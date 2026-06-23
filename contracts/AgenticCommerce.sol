// SPDX-License-Identifier: MIT
// Fix #13: aligned pragma with MerchantVault.sol
pragma solidity ^0.8.20;

// Fix #1: Correct OZ v5 import paths (moved from /security/ to /utils/ and /access/)
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// Fix #2: Import OZ canonical IERC20 — removes the local interface that caused a
//         SafeERC20 type mismatch (locally-defined IERC20 ≠ OZ's IERC20).
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// Fix #8: Ownable2Step — new owner must call acceptOwnership() to confirm.
import {
    Ownable2Step,
    Ownable
} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title  AgenticCommerce v2
 * @author ArcWear
 * @notice Trustless job escrow implementing a subset of ERC-8183 Agentic Commerce Protocol.
 *
 * @dev Role mapping for ArcWear:
 *   client    = buyer wallet (funds the escrow)
 *   provider  = ArcWear merchant wallet (receives USDC on completion)
 *   evaluator = ArcWear backend / Circle agent (triggers complete or reject)
 *   agent     = Circle agent wallet (creates jobs and funds on behalf of client)
 *
 * Lifecycle:
 *   Open → Funded → Submitted → Completed  (USDC → provider, minus fee)
 *                            → Rejected    (USDC → client, full refund)
 *                 → Expired                (USDC → client, permissionless after expiredAt)
 *
 * Usage:
 *   1. Buyer approves THIS contract for USDC (not the agent wallet).
 *   2. Agent calls createJob() to open the job.
 *   3. Agent calls fundOnBehalf(jobId, buyerAddr, amount) — pulls USDC into escrow.
 *   4. Backend auto-calls submit(jobId, orderHash) — order accepted.
 *   5. Evaluator calls complete(jobId) — USDC released to merchant (minus platform fee).
 *      OR evaluator calls reject(jobId) on dispute — full USDC refunded to buyer.
 *   6. Anyone calls claimRefund(jobId) after expiredAt (permissionless).
 */
import {
    AgenticCommerce__ZeroAddress,
    AgenticCommerce__ZeroAgent,
    AgenticCommerce__ZeroBudget,
    AgenticCommerce__ExpiryInPast,
    AgenticCommerce__EmptyDescription,
    AgenticCommerce__JobNotFound,
    AgenticCommerce__InvalidStatus,
    AgenticCommerce__NotAuthorized,
    AgenticCommerce__BudgetMismatch,
    AgenticCommerce__JobExpiredAlready,
    AgenticCommerce__ExpiryNotReached,
    AgenticCommerce__BudgetExceedsMax,
    AgenticCommerce__ZeroTreasuryWithFee,
    AgenticCommerce__JobTerminal
} from "./ArcWearErrors.sol";
import {JobStatus, Job} from "./ArcWearTypes.sol";
import {
    JobCreated,
    JobFunded,
    JobSubmitted,
    JobCompleted,
    JobRejected,
    JobExpired,
    AgentUpdated,
    FeeUpdated,
    EvaluatorUpdated
} from "./ArcWearEvents.sol";

contract AgenticCommerce is ReentrancyGuard, Ownable2Step, Pausable {
    using SafeERC20 for IERC20;

    // ── Constants ──────────────────────────────────────────────────────────────

    /// @notice Fix #10: maximum USDC (6-decimal raw units) per job — 100,000 USDC.
    uint256 public constant MAX_BUDGET = 100_000 * 1e6;

    // ── State ──────────────────────────────────────────────────────────────────

    /// @notice Circle Agent Wallet — authorised to create jobs and fund on behalf of clients.
    address public agent;

    /// @dev Monotonically increasing job ID counter.
    uint256 private _jobCounter;

    /// @notice jobId → Job mapping.
    mapping(uint256 => Job) public jobs;

    /// @notice Platform fee in basis points (e.g. 50 = 0.5%). Default: 0.
    uint256 public platformFeeBps;

    /// @notice Address that receives platform fees. Must be non-zero when platformFeeBps > 0.
    address public treasury;

    // ── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyAgent() {
        _onlyAgent();
        _;
    }

    function _onlyAgent() internal view {
        if (msg.sender != agent) revert AgenticCommerce__NotAuthorized();
    }

    modifier onlyAgentOrOwner() {
        _onlyAgentOrOwner();
        _;
    }

    function _onlyAgentOrOwner() internal view {
        if (msg.sender != agent && msg.sender != owner())
            revert AgenticCommerce__NotAuthorized();
    }

    modifier jobExists(uint256 jobId) {
        _jobExists(jobId);
        _;
    }

    function _jobExists(uint256 jobId) internal view {
        if (jobs[jobId].client == address(0))
            revert AgenticCommerce__JobNotFound(jobId);
    }

    modifier onlyEvaluator(uint256 jobId) {
        _onlyEvaluator(jobId);
        _;
    }

    function _onlyEvaluator(uint256 jobId) internal view {
        if (msg.sender != jobs[jobId].evaluator)
            revert AgenticCommerce__NotAuthorized();
    }

    // ── Constructor (fix #3, #8) ───────────────────────────────────────────────

    /**
     * @notice Deploys the AgenticCommerce escrow contract.
     * @dev    Fix #3: uses `Ownable(msg.sender)` — canonical OZ v5 initialisation path.
     *         Fix #8: inherits Ownable2Step, so ownership transfers require two steps.
     * @param _agent The Circle Agent Wallet authorised to create and fund jobs.
     */
    constructor(address _agent) Ownable(msg.sender) {
        if (_agent == address(0)) revert AgenticCommerce__ZeroAgent();
        agent = _agent;
        treasury = msg.sender;
        platformFeeBps = 0;
    }

    // ── Job Creation ───────────────────────────────────────────────────────────

    /**
     * @notice Create a new escrow job. Called by the agent or owner on behalf of the buyer.
     * @dev    Fix #10: enforces MAX_BUDGET cap to prevent unbounded escrow locks.
     * @param client      The buyer's wallet address.
     * @param provider    The merchant wallet that receives USDC on completion.
     * @param evaluator   Address authorised to call complete() or reject().
     * @param token       The USDC token address on Arc.
     * @param budget      USDC amount in raw 6-decimal units.
     * @param expiredAt   Unix timestamp after which claimRefund() is callable.
     * @param description Human-readable description (e.g. order ID or product name).
     * @return jobId      The auto-incremented job identifier.
     */
    function createJob(
        address client,
        address provider,
        address evaluator,
        address token,
        uint256 budget,
        uint256 expiredAt,
        string calldata description
    ) external whenNotPaused onlyAgentOrOwner returns (uint256 jobId) {
        if (client == address(0)) revert AgenticCommerce__ZeroAddress();
        if (provider == address(0)) revert AgenticCommerce__ZeroAddress();
        if (evaluator == address(0)) revert AgenticCommerce__ZeroAddress();
        if (token == address(0)) revert AgenticCommerce__ZeroAddress();
        if (budget == 0) revert AgenticCommerce__ZeroBudget();
        if (expiredAt <= block.timestamp)
            revert AgenticCommerce__ExpiryInPast();
        if (bytes(description).length == 0)
            revert AgenticCommerce__EmptyDescription();
        if (budget > MAX_BUDGET)
            revert AgenticCommerce__BudgetExceedsMax(budget, MAX_BUDGET);

        _jobCounter++;
        jobId = _jobCounter;

        jobs[jobId] = Job({
            client: client,
            provider: provider,
            evaluator: evaluator,
            token: token,
            budget: budget,
            expiredAt: expiredAt,
            status: JobStatus.Open,
            deliverable: bytes32(0),
            completionReason: bytes32(0),
            completedAt: 0,
            rejectedAt: 0,
            claimedAt: 0
        });

        emit JobCreated(
            jobId,
            client,
            provider,
            evaluator,
            token,
            expiredAt,
            description
        );
    }

    // ── Funding ────────────────────────────────────────────────────────────────

    /**
     * @notice Fund a job by pulling USDC from the client into escrow.
     * @dev    Client must have approved this contract for at least job.budget USDC.
     *         Called by the Circle agent wallet on behalf of the buyer.
     * @param jobId          The job to fund.
     * @param client         The buyer wallet — USDC is pulled FROM this address.
     * @param expectedBudget Must match job.budget exactly (prevents front-running).
     */
    function fundOnBehalf(
        uint256 jobId,
        address client,
        uint256 expectedBudget
    ) external whenNotPaused onlyAgentOrOwner nonReentrant jobExists(jobId) {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Open)
            revert AgenticCommerce__InvalidStatus(jobId);
        if (job.client != client) revert AgenticCommerce__NotAuthorized();
        if (job.budget != expectedBudget)
            revert AgenticCommerce__BudgetMismatch(expectedBudget, job.budget);
        if (block.timestamp >= job.expiredAt)
            revert AgenticCommerce__JobExpiredAlready(jobId);

        job.status = JobStatus.Funded;

        IERC20(job.token).safeTransferFrom(client, address(this), job.budget);

        emit JobFunded(jobId, job.budget);
    }

    /**
     * @notice Standard ERC-8183 fund() — client calls directly.
     * @dev    Client must have approved this contract for USDC.
     * @param jobId          The job to fund.
     * @param expectedBudget Must match job.budget exactly (prevents front-running).
     */
    function fund(
        uint256 jobId,
        uint256 expectedBudget
    ) external whenNotPaused nonReentrant jobExists(jobId) {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Open)
            revert AgenticCommerce__InvalidStatus(jobId);
        if (job.client != msg.sender) revert AgenticCommerce__NotAuthorized();
        if (job.budget != expectedBudget)
            revert AgenticCommerce__BudgetMismatch(expectedBudget, job.budget);
        if (block.timestamp >= job.expiredAt)
            revert AgenticCommerce__JobExpiredAlready(jobId);

        job.status = JobStatus.Funded;

        IERC20(job.token).safeTransferFrom(
            msg.sender,
            address(this),
            job.budget
        );

        emit JobFunded(jobId, job.budget);
    }

    // ── Work Submission ────────────────────────────────────────────────────────

    /**
     * @notice Submit work — signals the order has been accepted and shipped.
     * @dev    Fix #7: now includes `nonReentrant` guard (defence-in-depth).
     *         Authorised callers: provider, evaluator, agent, or owner.
     * @param jobId       The funded job.
     * @param deliverable keccak256 hash of the order ID or tracking reference.
     */
    function submit(
        uint256 jobId,
        bytes32 deliverable
    ) external whenNotPaused nonReentrant jobExists(jobId) {
        Job storage job = jobs[jobId];

        if (
            msg.sender != job.provider &&
            msg.sender != job.evaluator &&
            msg.sender != agent &&
            msg.sender != owner()
        ) revert AgenticCommerce__NotAuthorized();

        if (job.status != JobStatus.Funded)
            revert AgenticCommerce__InvalidStatus(jobId);
        if (block.timestamp >= job.expiredAt)
            revert AgenticCommerce__JobExpiredAlready(jobId);

        job.status = JobStatus.Submitted;
        job.deliverable = deliverable;

        emit JobSubmitted(jobId, deliverable);
    }

    // ── Terminal States ────────────────────────────────────────────────────────

    /**
     * @notice Complete a job — releases escrowed USDC to the provider (merchant).
     * @dev    Fix #9: platform fee is only deducted when treasury is a valid address;
     *         a zero treasury no longer strands the fee portion in the contract.
     *         Only the evaluator may call this when status is Submitted.
     * @param jobId  The submitted job.
     * @param reason Optional bytes32 audit hash.
     */
    function complete(
        uint256 jobId,
        bytes32 reason
    )
        external
        whenNotPaused
        nonReentrant
        jobExists(jobId)
        onlyEvaluator(jobId)
    {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Submitted)
            revert AgenticCommerce__InvalidStatus(jobId);

        job.status = JobStatus.Completed;
        job.completionReason = reason;
        job.completedAt = block.timestamp;

        // Fix #9: only deduct a fee when there is a valid treasury to receive it.
        // Prevents the scenario where fee > 0 but treasury == address(0) causes
        // the fee to be silently deducted from payout and stranded in the contract.
        uint256 fee = (platformFeeBps > 0 && treasury != address(0))
            ? (job.budget * platformFeeBps) / 10_000
            : 0;
        uint256 payout = job.budget - fee;

        if (fee > 0) {
            IERC20(job.token).safeTransfer(treasury, fee);
        }
        IERC20(job.token).safeTransfer(job.provider, payout);

        emit JobCompleted(jobId, job.provider, payout, reason);
    }

    /**
     * @notice Reject a job — refunds escrowed USDC to the client (buyer).
     * @dev    Evaluator may call this when status is Funded or Submitted.
     * @param jobId  The job to reject.
     * @param reason Optional bytes32 audit hash.
     */
    function reject(
        uint256 jobId,
        bytes32 reason
    )
        external
        whenNotPaused
        nonReentrant
        jobExists(jobId)
        onlyEvaluator(jobId)
    {
        Job storage job = jobs[jobId];
        if (job.status != JobStatus.Funded && job.status != JobStatus.Submitted)
            revert AgenticCommerce__InvalidStatus(jobId);

        job.status = JobStatus.Rejected;
        job.completionReason = reason;
        job.rejectedAt = block.timestamp;

        IERC20(job.token).safeTransfer(job.client, job.budget);

        emit JobRejected(jobId, job.client, job.budget, reason);
    }

    /**
     * @notice Claim a refund after the expiry timestamp has passed.
     * @dev    Permissionless once expiredAt is reached — anyone may call this.
     *         Fix #4: removed the dead `require(status != Expired)` guard that was
     *         structurally unreachable: the prior check already guarantees status is
     *         Funded or Submitted, making Expired impossible at that point.
     * @param jobId The job to expire and refund.
     */
    function claimRefund(
        uint256 jobId
    ) external whenNotPaused nonReentrant jobExists(jobId) {
        Job storage job = jobs[jobId];
        // Only Funded or Submitted jobs hold funds eligible for refund.
        if (job.status != JobStatus.Funded && job.status != JobStatus.Submitted)
            revert AgenticCommerce__InvalidStatus(jobId);
        if (block.timestamp < job.expiredAt)
            revert AgenticCommerce__ExpiryNotReached(jobId);

        job.status = JobStatus.Expired;
        job.claimedAt = block.timestamp;

        IERC20(job.token).safeTransfer(job.client, job.budget);

        emit JobExpired(jobId, job.client, job.budget);
    }

    // ── View Functions ─────────────────────────────────────────────────────────

    /**
     * @notice Return full job details by ID.
     * @param jobId The job identifier.
     * @return The Job struct stored at that key.
     */
    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    /**
     * @notice Total number of jobs ever created (including terminal ones).
     * @return Monotonically increasing job count.
     */
    function totalJobs() external view returns (uint256) {
        return _jobCounter;
    }

    /**
     * @notice USDC balance currently held in escrow by this contract.
     * @param token The ERC-20 token address to query (typically USDC on Arc).
     * @return Raw 6-decimal balance held by this contract.
     */
    function escrowBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    /**
     * @notice Update the Circle Agent Wallet address.
     * @dev    Fix #5: intentionally NOT gated by `whenNotPaused`. The most critical
     *         time to rotate the agent is during an emergency pause caused by a
     *         compromised agent — blocking rotation would defeat the purpose of pausing.
     *         Fix #12: emits both old and new agent for a complete audit trail.
     * @param newAgent The replacement agent wallet address.
     */
    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert AgenticCommerce__ZeroAddress();
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    /**
     * @notice Set platform fee (in basis points) and treasury recipient address.
     * @dev    Fix #6: enforces that treasury must be a valid address when fee > 0.
     *         Previously, bps > 0 with treasury = address(0) caused fee stranding
     *         in complete() (deducted from payout but never transferred).
     *         Note: whenNotPaused removed — fee config should be possible during a pause.
     * @param bps       Fee in basis points (max 500 = 5%; 0 disables fee).
     * @param _treasury Recipient of platform fees. Must be non-zero if bps > 0.
     */
    function setFee(uint256 bps, address _treasury) external onlyOwner {
        require(bps <= 500, "ACP: max 5% fee");
        if (bps > 0 && _treasury == address(0))
            revert AgenticCommerce__ZeroTreasuryWithFee();
        treasury = _treasury;
        platformFeeBps = bps;
        emit FeeUpdated(bps, _treasury);
    }

    /**
     * @notice Fix #11: Rotate the evaluator for a specific job.
     * @dev    Emergency function for when the evaluator key is compromised between
     *         createJob() and complete()/reject(). Only callable on non-terminal jobs.
     *         Not gated by whenNotPaused so it's usable during an emergency pause.
     * @param jobId        The job whose evaluator should be updated.
     * @param newEvaluator The replacement evaluator address.
     */
    function setJobEvaluator(
        uint256 jobId,
        address newEvaluator
    ) external onlyOwner jobExists(jobId) {
        if (newEvaluator == address(0)) revert AgenticCommerce__ZeroAddress();
        Job storage job = jobs[jobId];
        if (
            job.status == JobStatus.Completed ||
            job.status == JobStatus.Rejected ||
            job.status == JobStatus.Expired
        ) revert AgenticCommerce__JobTerminal(jobId);

        job.evaluator = newEvaluator;
        emit EvaluatorUpdated(jobId, newEvaluator);
    }

    /**
     * @notice Pause all state-mutating functions (except setAgent, setFee,
     *         setJobEvaluator, and unpause).
     * @dev    Use in emergencies: detected exploit, compromised agent or evaluator.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Restore normal contract operation after a pause.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

//https://testnet.arcscan.app/address/0x0B833fed511bCaaC668Fa45131Fb9f9c7601A353
