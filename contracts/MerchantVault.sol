// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ── Fix #7: Import canonical OZ IERC20 instead of defining a conflicting local interface.
// ── Fix #1/#2: ReentrancyGuard for all fund-moving functions.
// ── Fix #9: Ownable2Step for two-step ownership transfer to prevent permanent lockout.
// ── Fix #7 / OZ v5 paths (utils/*, access/*).
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    Ownable2Step,
    Ownable
} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {
    MerchantVault__ZeroAddress,
    MerchantVault__ZeroAmount,
    MerchantVault__EmptyOrderId,
    MerchantVault__ExceedsMaxAmount,
    MerchantVault__OrderAlreadyUsed,
    MerchantVault__NotAuthorized,
    MerchantVault__InvalidStatus,
    MerchantVault__OrderNotFound,
    MerchantVault__UsdcNotReceived,
    MerchantVault__NoSurplus,
    MerchantVault__ReturnWindowOpen,
    MerchantVault__TooEarlyForNonBuyer,
    MerchantVault__ActiveEscrowsExist
} from "./ArcWearErrors.sol";
import {OrderStatus, Order} from "./ArcWearTypes.sol";
import {
    PaymentRecorded,
    OrderShipped,
    DeliveryConfirmed,
    OrderDisputed,
    Settled,
    BulkSettled,
    Refunded,
    AgentUpdated,
    UsdcTokenUpdated
} from "./ArcWearEvents.sol";

/**
 * @title  MerchantVault v3
 * @author ArcWear
 * @notice Trustless escrow vault for autonomous order lifecycle management on Arc.
 *
 * @dev Lifecycle:
 *   1. Buyer calls pay() OR agent calls recordAgentPayment() — USDC enters escrow.
 *   2. Merchant / agent calls confirmShipped() once the order is dispatched.
 *   3. Buyer (or non-buyer after MINIMUM_TRANSIT_TIME) calls confirmDelivery(),
 *      starting the 30-day RETURN_WINDOW.
 *   4. After RETURN_WINDOW expires, anyone calls releaseAfterWindow() to settle.
 *   5. Either party may raise a dispute via disputeOrder(); the owner then
 *      resolves it via settleOrder() (merchant wins) or refundOrder() (buyer wins).
 *
 * Roles:
 *   owner = merchant — receives settled USDC, manages disputes, issues refunds.
 *   agent = Circle Agent Wallet — records autonomous payments on behalf of buyers.
 *
 * orderId convention:
 *   All external functions accept a bytes32 orderId.
 *   Callers must compute: orderId = keccak256(abi.encodePacked(rawStringOrderId))
 *   This is significantly cheaper than string-keyed mappings (fix #14).
 *   Key must be keccak256(abi.encodePacked(rawStringOrderId)) computed off-chain.
 */
contract MerchantVault is ReentrancyGuard, Ownable2Step, Pausable {
    using SafeERC20 for IERC20;

    // ── Constants ──────────────────────────────────────────────────────────────

    /// @notice Duration of the post-delivery buyer return / dispute window.
    uint256 public constant RETURN_WINDOW = 30 days;

    /// @notice Minimum elapsed time after shipment before a non-buyer can confirm delivery.
    ///         Prevents the merchant from instantly starting the return window clock.
    uint256 public constant MINIMUM_TRANSIT_TIME = 1 days;

    /// @notice Maximum USDC (6-decimal raw units) allowed per single order — 100,000 USDC.
    ///         Guards against fat-finger errors locking an unbounded amount.
    uint256 public constant MAX_ORDER_AMOUNT = 100_000 * 1e6;

    // ── State ──────────────────────────────────────────────────────────────────

    /// @notice Circle Agent Wallet — authorised to record autonomous payments.
    address public agent;

    /// @notice The USDC token contract this vault holds in escrow.
    IERC20 public usdcToken;

    /// @notice Running total of USDC locked in non-terminal (active) escrow orders.
    /// @dev    Incremented on payment, decremented on settle/refund.
    ///         Used by settleAll() to guarantee buyer funds are never swept.
    uint256 public activeEscrowBalance;

    /// @dev Internal monotonic counter — never decrements.
    uint256 private _orderCounter;

    // ── Storage ────────────────────────────────────────────────────────────────

    /// @notice orderId (bytes32) → Order mapping (fix #14: bytes32 keys vs string).
    /// @dev    Key must be keccak256(abi.encodePacked(rawStringOrderId)) computed off-chain.
    mapping(bytes32 => Order) public orders;

    /// @dev Tracks used orderIds without requiring iteration (O(1) duplicate check).
    mapping(bytes32 => bool) private _usedOrderIds;

    // ── Modifiers ──────────────────────────────────────────────────────────────

    modifier onlyAgent() {
        _onlyAgent();
        _;
    }

    function _onlyAgent() internal view {
        if (msg.sender != agent) revert MerchantVault__NotAuthorized();
    }

    modifier onlyOwnerOrAgent() {
        _onlyOwnerOrAgent();
        _;
    }

    function _onlyOwnerOrAgent() internal view {
        if (msg.sender != owner() && msg.sender != agent)
            revert MerchantVault__NotAuthorized();
    }

    /// @dev Accepts the orderId key so the buyer address can be read from storage
    ///      without copying the entire Order struct to memory (fix #4 in modifier refactor).
    modifier onlyBuyerOrOwnerOrAgent(bytes32 orderId) {
        _onlyBuyerOrOwnerOrAgent(orderId);
        _;
    }

    function _onlyBuyerOrOwnerOrAgent(bytes32 orderId) internal view {
        if (
            msg.sender != orders[orderId].buyer &&
            msg.sender != owner() &&
            msg.sender != agent
        ) revert MerchantVault__NotAuthorized();
    }

    modifier orderExists(bytes32 orderId) {
        _orderExists(orderId);
        _;
    }

    function _orderExists(bytes32 orderId) internal view {
        if (orders[orderId].buyer == address(0))
            revert MerchantVault__OrderNotFound(orderId);
    }

    // ── Constructor (fix #3, #4) ───────────────────────────────────────────────

    /**
     * @notice Deploys the vault.
     * @dev    Uses Ownable(msg.sender) — the canonical OZ v5 initialisation path
     *         (fix #3). Zero-address guards applied to both constructor args (fix #4).
     * @param _usdcToken Address of the USDC ERC-20 contract on Arc.
     * @param _agent     Address of the Circle Agent Wallet.
     */
    constructor(address _usdcToken, address _agent) Ownable(msg.sender) {
        if (_usdcToken == address(0)) revert MerchantVault__ZeroAddress();
        if (_agent == address(0)) revert MerchantVault__ZeroAddress();
        agent = _agent;
        usdcToken = IERC20(_usdcToken);
    }

    // ── Payment Functions ──────────────────────────────────────────────────────

    /**
     * @notice Buyer-initiated payment. Buyer signs the transaction directly.
     * @dev    Buyer must first call USDC.approve(address(this), amount).
     *         The orderId must be keccak256(abi.encodePacked(rawStringOrderId)),
     *         computed off-chain before submitting the transaction.
     * @param amount      Raw USDC amount in 6-decimal units (e.g. 49_990_000 = $49.99).
     * @param orderId     keccak256 hash of the unique string order identifier.
     * @param productName Human-readable product description stored on-chain.
     */
    function pay(
        uint256 amount,
        bytes32 orderId,
        string calldata productName
    ) external whenNotPaused nonReentrant {
        if (amount == 0) revert MerchantVault__ZeroAmount();
        if (orderId == bytes32(0)) revert MerchantVault__EmptyOrderId();
        if (_usedOrderIds[orderId])
            revert MerchantVault__OrderAlreadyUsed(orderId);
        if (amount > MAX_ORDER_AMOUNT)
            revert MerchantVault__ExceedsMaxAmount(amount, MAX_ORDER_AMOUNT);

        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        _recordOrder(msg.sender, orderId, amount, productName);
    }

    /**
     * @notice Records a payment the Circle agent already executed via transferFrom.
     * @dev    The vault performs a balance snapshot check (fix #2) to verify that
     *         the declared amount was actually received before recording the order.
     *         The agent must call USDC.transferFrom(buyer, address(this), amount)
     *         in the same transaction or a prior one before calling this function.
     *         orderId = keccak256(abi.encodePacked(rawStringOrderId)) off-chain.
     * @param buyer       The buyer's wallet address (fix #10: validated non-zero).
     * @param orderId     keccak256 hash of the unique string order identifier.
     * @param amount      Raw USDC amount in 6-decimal units.
     * @param productName Human-readable product description stored on-chain.
     */
    function recordAgentPayment(
        address buyer,
        bytes32 orderId,
        uint256 amount,
        string calldata productName
    ) external whenNotPaused onlyAgent nonReentrant {
        if (buyer == address(0)) revert MerchantVault__ZeroAddress(); // fix #10
        if (amount == 0) revert MerchantVault__ZeroAmount();
        if (orderId == bytes32(0)) revert MerchantVault__EmptyOrderId();
        if (_usedOrderIds[orderId])
            revert MerchantVault__OrderAlreadyUsed(orderId);
        if (amount > MAX_ORDER_AMOUNT)
            revert MerchantVault__ExceedsMaxAmount(amount, MAX_ORDER_AMOUNT);

        // Fix #2: Snapshot check — vault balance must cover all prior active escrows
        // PLUS this new amount. If the agent's transferFrom never ran, this reverts.
        if (usdcToken.balanceOf(address(this)) < activeEscrowBalance + amount)
            revert MerchantVault__UsdcNotReceived();

        _recordOrder(buyer, orderId, amount, productName);
    }

    // ── Order Lifecycle ────────────────────────────────────────────────────────

    /**
     * @notice Merchant (or agent) confirms the order has been dispatched.
     * @param orderId keccak256 hash of the order identifier.
     */
    function confirmShipped(
        bytes32 orderId
    ) external whenNotPaused onlyOwnerOrAgent orderExists(orderId) {
        Order storage o = orders[orderId];
        if (o.status != OrderStatus.Paid)
            revert MerchantVault__InvalidStatus(orderId);

        o.status = OrderStatus.Shipped;
        o.shippedAt = block.timestamp;
        emit OrderShipped(orderId, block.timestamp);
    }

    /**
     * @notice Confirms delivery, starting the 30-day return window.
     * @dev    Fix #11: Non-buyers (merchant / agent) may only confirm after
     *         MINIMUM_TRANSIT_TIME has elapsed since shipment, preventing the
     *         merchant from immediately starting the return window clock.
     *         Buyer may confirm at any time after shipment.
     * @param orderId keccak256 hash of the order identifier.
     */
    function confirmDelivery(
        bytes32 orderId
    )
        external
        whenNotPaused
        orderExists(orderId)
        onlyBuyerOrOwnerOrAgent(orderId)
    {
        Order storage o = orders[orderId];
        if (o.status != OrderStatus.Shipped)
            revert MerchantVault__InvalidStatus(orderId);

        // Fix #11: Enforce minimum transit delay for non-buyer confirmations.
        if (msg.sender != o.buyer) {
            if (block.timestamp < o.shippedAt + MINIMUM_TRANSIT_TIME)
                revert MerchantVault__TooEarlyForNonBuyer();
        }

        o.status = OrderStatus.Delivered;
        o.deliveredAt = block.timestamp;
        o.returnWindowEnd = block.timestamp + RETURN_WINDOW;

        emit DeliveryConfirmed(orderId, block.timestamp, o.returnWindowEnd);
    }

    /**
     * @notice Fix #6: Raises a dispute on a Shipped or Delivered order, freezing settlement.
     * @dev    Disputable states: Shipped, Delivered.
     *         Once Disputed, only the owner can resolve via settleOrder() or refundOrder().
     *         Any of buyer / owner / agent may raise a dispute.
     * @param orderId keccak256 hash of the order identifier.
     */
    function disputeOrder(
        bytes32 orderId
    )
        external
        whenNotPaused
        orderExists(orderId)
        onlyBuyerOrOwnerOrAgent(orderId)
    {
        Order storage o = orders[orderId];
        if (
            o.status != OrderStatus.Shipped && o.status != OrderStatus.Delivered
        ) revert MerchantVault__InvalidStatus(orderId);

        o.status = OrderStatus.Disputed;
        emit OrderDisputed(orderId, msg.sender);
    }

    /**
     * @notice Permissionless settlement once the 30-day return window has expired.
     * @dev    Anyone can call this — it's trustless once the window closes.
     *         Decrements activeEscrowBalance so buyer funds remain protected.
     * @param orderId keccak256 hash of the order identifier.
     */
    function releaseAfterWindow(
        bytes32 orderId
    ) external whenNotPaused nonReentrant orderExists(orderId) {
        Order storage o = orders[orderId];
        if (o.status != OrderStatus.Delivered)
            revert MerchantVault__InvalidStatus(orderId);
        if (block.timestamp < o.returnWindowEnd)
            revert MerchantVault__ReturnWindowOpen();

        o.status = OrderStatus.Settled;
        o.settledAt = block.timestamp;
        activeEscrowBalance -= o.amount; // fix #1

        usdcToken.safeTransfer(owner(), o.amount);
        emit Settled(owner(), orderId, o.amount);
    }

    /**
     * @notice Fix #5: Owner settles a Delivered (post-window) or Disputed order.
     * @dev    For Delivered orders: the RETURN_WINDOW must have elapsed — this mirrors
     *         releaseAfterWindow() but allows a custom recipient (e.g. a sub-wallet).
     *         For Disputed orders: the owner resolves in the merchant's favour with
     *         no time restriction, as the dispute overrides normal window protection.
     *         Decrements activeEscrowBalance (fix #1).
     * @param orderId keccak256 hash of the order identifier.
     * @param to      Recipient of the USDC (usually owner(), may be a treasury).
     */
    function settleOrder(
        bytes32 orderId,
        address to
    ) external whenNotPaused onlyOwner nonReentrant orderExists(orderId) {
        if (to == address(0)) revert MerchantVault__ZeroAddress();

        Order storage o = orders[orderId];

        bool deliveredAndWindowPassed = o.status == OrderStatus.Delivered &&
            block.timestamp >= o.returnWindowEnd;
        bool isDisputed = o.status == OrderStatus.Disputed;

        if (!deliveredAndWindowPassed && !isDisputed)
            revert MerchantVault__InvalidStatus(orderId);

        o.status = OrderStatus.Settled;
        o.settledAt = block.timestamp;
        activeEscrowBalance -= o.amount; // fix #1

        usdcToken.safeTransfer(to, o.amount);
        emit Settled(to, orderId, o.amount);
    }

    /**
     * @notice Owner refunds an active order back to the buyer.
     * @dev    Callable on any non-terminal status: Paid, Shipped, Delivered, Disputed.
     *         This is the resolution path when the merchant decides in the buyer's favour,
     *         including dispute resolution. Decrements activeEscrowBalance (fix #1).
     * @param orderId keccak256 hash of the order identifier.
     */
    function refundOrder(
        bytes32 orderId
    ) external whenNotPaused onlyOwner nonReentrant orderExists(orderId) {
        Order storage o = orders[orderId];
        if (o.status == OrderStatus.Settled)
            revert MerchantVault__InvalidStatus(orderId);
        if (o.status == OrderStatus.Refunded)
            revert MerchantVault__InvalidStatus(orderId);

        o.status = OrderStatus.Refunded;
        o.refundedAt = block.timestamp;
        activeEscrowBalance -= o.amount; // fix #1

        usdcToken.safeTransfer(o.buyer, o.amount);
        emit Refunded(o.buyer, orderId, o.amount);
    }

    // ── Bulk Settlement ────────────────────────────────────────────────────────

    /**
     * @notice Fix #1: Withdraws only the USDC surplus above all active escrow balances.
     * @dev    active escrow funds (i.e. orders in Paid/Shipped/Delivered/Disputed state)
     *         are NEVER touched. Only surplus arising from direct transfers, fee income,
     *         or rounding dust can be withdrawn. This preserves buyer refund guarantees.
     * @param to Recipient of the surplus USDC.
     */
    function settleAll(
        address to
    ) external whenNotPaused onlyOwner nonReentrant {
        if (to == address(0)) revert MerchantVault__ZeroAddress();
        uint256 bal = usdcToken.balanceOf(address(this));
        if (bal <= activeEscrowBalance) revert MerchantVault__NoSurplus();
        uint256 surplus = bal - activeEscrowBalance;
        usdcToken.safeTransfer(to, surplus);
        emit BulkSettled(to, surplus);
    }

    // ── View Functions ─────────────────────────────────────────────────────────

    /**
     * @notice Returns full order details for a given orderId hash.
     * @param orderId keccak256 hash of the order identifier.
     * @return The Order struct stored at that key.
     */
    function getOrder(bytes32 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    /**
     * @notice Returns the total number of orders ever recorded (including terminal ones).
     * @return Monotonically increasing order count.
     */
    function totalOrders() external view returns (uint256) {
        return _orderCounter;
    }

    /**
     * @notice Returns the current raw USDC balance held by the vault.
     * @return Raw USDC (6-decimal) balance of this contract.
     */
    function vaultBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    /**
     * @notice Returns the USDC surplus above active escrow obligations.
     * @dev    This is the maximum amount safely withdrawable via settleAll().
     * @return Surplus USDC not backing any active order, or 0 if deficit.
     */
    function surplusBalance() external view returns (uint256) {
        uint256 bal = usdcToken.balanceOf(address(this));
        return bal > activeEscrowBalance ? bal - activeEscrowBalance : 0;
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    /**
     * @notice Updates the Circle Agent Wallet address.
     * @dev    Fix #12: Intentionally NOT gated by whenNotPaused. The most critical
     *         time to rotate the agent is during a pause triggered by a compromised
     *         agent. Blocking rotation would defeat the purpose of the pause.
     *         Emits old + new address for full audit trail.
     * @param newAgent The replacement agent wallet address.
     */
    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert MerchantVault__ZeroAddress();
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    /**
     * @notice Fix #13: Replaces the accepted USDC token address.
     * @dev    Only callable when activeEscrowBalance == 0 to guarantee no buyer
     *         funds are left stranded on the old token address after migration.
     *         Use when the USDC contract on Arc is upgraded or the chain migrates.
     * @param newToken The new USDC-compatible ERC-20 address.
     */
    function setUsdcToken(address newToken) external onlyOwner {
        if (newToken == address(0)) revert MerchantVault__ZeroAddress();
        if (activeEscrowBalance > 0) revert MerchantVault__ActiveEscrowsExist();
        emit UsdcTokenUpdated(address(usdcToken), newToken);
        usdcToken = IERC20(newToken);
    }

    /**
     * @notice Pauses all state-mutating functions (except setAgent and unpause).
     * @dev    Use in emergencies: detected exploit, compromised agent, or upgrade.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Restores normal contract operation after a pause.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    /**
     * @dev Creates and persists a new Order record. Called by pay() and recordAgentPayment().
     *      Increments activeEscrowBalance (fix #1) and _orderCounter.
     * @param buyer       Buyer's wallet address.
     * @param orderId     bytes32 key for the orders mapping.
     * @param amount      Raw USDC (6 decimals) to hold in escrow.
     * @param productName Human-readable product description.
     */
    function _recordOrder(
        address buyer,
        bytes32 orderId,
        uint256 amount,
        string calldata productName
    ) internal {
        _usedOrderIds[orderId] = true;
        orders[orderId] = Order({
            buyer: buyer,
            amount: amount,
            status: OrderStatus.Paid,
            paidAt: block.timestamp,
            shippedAt: 0,
            deliveredAt: 0,
            returnWindowEnd: 0,
            settledAt: 0,
            refundedAt: 0,
            productName: productName
        });
        activeEscrowBalance += amount; // fix #1
        _orderCounter++;
        emit PaymentRecorded(buyer, orderId, amount, productName);
    }
}

//https://testnet.arcscan.app/address/0xd515765a6c9b1c3f9a4df52f5326eea43ee42469
