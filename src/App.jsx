import { useState, useRef, useEffect } from "react";
const ARC_CHAIN_ID = "0x4cef52";
const ARC_CHAIN_CONFIG = {
  chainId: ARC_CHAIN_ID, chainName: "Arc Testnet",
  nativeCurrency: { name:"USDC", symbol:"USDC", decimals:6 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};
const USDC_ADDRESS  = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const MERCHANT_ADDR = "0xDemoMerchantAddress000000000000000000001";

const CATALOGUE = { 
  men: {
    label:"Men", icon:"👔",
    categories:{
      shirts:{ label:"Shirts & Tops", items:[
        {id:"m-s1",name:"Oxford Button-Down",price:42,desc:"Egyptian cotton, spread collar",
         img:"https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80"},
        {id:"m-s2",name:"Linen Crew Tee",price:28,desc:"Stonewashed linen, relaxed fit",
         img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80"},
        {id:"m-s3",name:"Flannel Overshirt",price:65,desc:"Brushed flannel, double chest pocket",
         img:"https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=400&q=80"},
      ]},
      trousers:{ label:"Trousers", items:[
        {id:"m-t1",name:"Slim Chino",price:58,desc:"Stretch cotton, tapered leg",
         img:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"},
        {id:"m-t2",name:"Cargo Pants",price:72,desc:"Ripstop canvas, utility pockets",
         img:"https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80"},
        {id:"m-t3",name:"Dress Trouser",price:85,desc:"Wool-blend, flat-front cut",
         img:"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80"},
      ]},
      belts:{ label:"Belts", items:[
        {id:"m-b1",name:"Leather Classic",price:35,desc:"Full-grain Italian leather",
         img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80"},
        {id:"m-b2",name:"Woven Canvas Belt",price:22,desc:"Military-style, brass buckle",
         img:"https://images.unsplash.com/photo-1625496492751-47e1f4a25c15?w=400&q=80"},
      ]},
      caps:{ label:"Headwear", items:[
        {id:"m-c1",name:"Snapback Cap",price:25,desc:"6-panel, structured brim",
         img:"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80"},
        {id:"m-c2",name:"Bucket Hat",price:20,desc:"Waxed cotton, packable",
         img:"https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80"},
        {id:"m-c3",name:"Beanie Knit",price:18,desc:"Merino wool, ribbed cuff",
         img:"https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80"},
      ]},
      shoes:{ label:"Footwear", items:[
        {id:"m-sh1",name:"White Leather Sneaker",price:110,desc:"Tumbled leather, cupsole",
         img:"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80"},
        {id:"m-sh2",name:"Chelsea Boot",price:145,desc:"Suede upper, elastic gusset",
         img:"https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&q=80"},
        {id:"m-sh3",name:"Loafer Slip-On",price:98,desc:"Horsebit detail, leather lining",
         img:"https://images.unsplash.com/photo-1631984564919-1f6e59f72f73?w=400&q=80"},
      ]},
    }
  },
  women:{
    label:"Women", icon:"👗",
    categories:{
      shirts:{ label:"Tops & Blouses", items:[
        {id:"w-s1",name:"Silk Blouse",price:68,desc:"Mulberry silk, relaxed drape",
         img:"https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80"},
        {id:"w-s2",name:"Crop Cami",price:32,desc:"Ribbed modal, adjustable straps",
         img:"https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80"},
        {id:"w-s3",name:"Wrap Cardigan",price:55,desc:"Cashmere blend, tie-waist",
         img:"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80"},
      ]},
      trousers:{ label:"Bottoms", items:[
        {id:"w-t1",name:"High-Rise Flare",price:75,desc:"Stretch denim, wide flare hem",
         img:"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80"},
        {id:"w-t2",name:"Midi Skirt",price:60,desc:"Satin lining, A-line silhouette",
         img:"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80"},
        {id:"w-t3",name:"Tailored Wide-Leg",price:88,desc:"Crepe fabric, pleat front",
         img:"https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80"},
      ]},
      belts:{ label:"Belts", items:[
        {id:"w-b1",name:"Gold Chain Belt",price:38,desc:"Brass links, adjustable fit",
         img:"https://images.unsplash.com/photo-1624623278313-a930126a11c3?w=400&q=80"},
        {id:"w-b2",name:"Slim Patent",price:30,desc:"Patent leather, pin buckle",
         img:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80"},
      ]},
      caps:{ label:"Headwear", items:[
        {id:"w-c1",name:"Wide Brim Sun Hat",price:40,desc:"Raffia weave, ribbon band",
         img:"https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80"},
        {id:"w-c2",name:"Classic Beret",price:28,desc:"Felted wool, French-style",
         img:"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80"},
        {id:"w-c3",name:"Knit Pom Beanie",price:22,desc:"Chunky knit, removable pom",
         img:"https://images.unsplash.com/photo-1510598155236-d3e2e31d3e0c?w=400&q=80"},
      ]},
      shoes:{ label:"Footwear", items:[
        {id:"w-sh1",name:"Block Heel Mule",price:120,desc:"Suede upper, 7cm block heel",
         img:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80"},
        {id:"w-sh2",name:"Platform Sneaker",price:95,desc:"Leather & canvas, 4cm platform",
         img:"https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80"},
        {id:"w-sh3",name:"Kitten Heel Pump",price:138,desc:"Satin finish, pointed toe",
         img:"https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80"},
      ]},
    }
  },
  children:{
    label:"Children", icon:"🧒",
    categories:{
      shirts:{ label:"Tops & Tees", items:[
        {id:"k-s1",name:"Dino Print Tee",price:18,desc:"100% organic cotton, crew neck",
         img:"https://images.unsplash.com/photo-1519278409-1f56ab241a7d?w=400&q=80"},
        {id:"k-s2",name:"Rainbow Hoodie",price:32,desc:"Brushed fleece, kangaroo pocket",
         img:"https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=400&q=80"},
        {id:"k-s3",name:"Striped Long Sleeve",price:22,desc:"Soft jersey, ribbed cuffs",
         img:"https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80"},
      ]},
      trousers:{ label:"Bottoms", items:[
        {id:"k-t1",name:"Elastic Joggers",price:25,desc:"French terry, elastic waist",
         img:"https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=400&q=80"},
        {id:"k-t2",name:"Denim Shortalls",price:40,desc:"Stretch denim, adjustable straps",
         img:"https://images.unsplash.com/photo-1468820153901-27f1c5dcafd4?w=400&q=80"},
        {id:"k-t3",name:"Cargo Shorts",price:28,desc:"Ripstop, velcro side pockets",
         img:"https://images.unsplash.com/photo-1577253313708-cab167d2c474?w=400&q=80"},
      ]},
      belts:{ label:"Belts", items:[
        {id:"k-b1",name:"Cartoon Buckle Belt",price:12,desc:"Woven, fun character buckle",
         img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80"},
      ]},
      caps:{ label:"Headwear", items:[
        {id:"k-c1",name:"Dino Baseball Cap",price:15,desc:"Cotton twill, embroidered dino",
         img:"https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=400&q=80"},
        {id:"k-c2",name:"Sun Protection Hat",price:20,desc:"UPF 50+, wide brim",
         img:"https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80"},
      ]},
      shoes:{ label:"Footwear", items:[
        {id:"k-sh1",name:"Light-Up Sneakers",price:55,desc:"LED outsole, velcro close",
         img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"},
        {id:"k-sh2",name:"Velcro Sandals",price:38,desc:"Quick-dry, adjustable strap",
         img:"https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&q=80"},
        {id:"k-sh3",name:"Rain Boots",price:42,desc:"Natural rubber, easy-pull tab",
         img:"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80"},
      ]},
    }
  },
};

const ALL_PRODUCTS = [];
for(const [sk,sec] of Object.entries(CATALOGUE))
  for(const [ck,cat] of Object.entries(sec.categories))
    for(const item of cat.items)
      ALL_PRODUCTS.push({...item,section:sk,sectionLabel:sec.label,category:ck,categoryLabel:cat.label});

const AGENT_TOOLS=[
  {name:"search_products",description:"Search catalogue by section, category, price or keywords.",
   input_schema:{type:"object",properties:{
     section:{type:"string",enum:["men","women","children","all"]},
     category:{type:"string"},maxPrice:{type:"number"},minPrice:{type:"number"},
     keywords:{type:"array",items:{type:"string"}},
   }}},
  {name:"add_to_cart",description:"Add product to cart by ID.",
   input_schema:{type:"object",required:["productId"],properties:{productId:{type:"string"},quantity:{type:"number"}}}},
  {name:"view_cart",description:"View cart contents and total.",
   input_schema:{type:"object",properties:{}}},
  {name:"remove_from_cart",description:"Remove a product from cart.",
   input_schema:{type:"object",required:["productId"],properties:{productId:{type:"string"}}}},
  {name:"initiate_checkout",description:"Open USDC checkout modal on Arc.",
   input_schema:{type:"object",properties:{}}},
];

const fmt   = n=>`${Number(n).toFixed(2)} USDC`;
const trunc = a=>a?`${a.slice(0,6)}…${a.slice(-4)}`:"";

function Toasts({list}){
  return(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9000] flex flex-col gap-2 items-center pointer-events-none">
      {list.map(t=>(
        <div key={t.id} className={`px-5 py-2.5 rounded-full text-sm font-medium text-white shadow-xl whitespace-nowrap ${t.type==="agent"?"bg-amber-700":t.type==="error"?"bg-red-700":"bg-stone-900"}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function ProductCard({item,onAdd,agentPick}){
  const [added,setAdded]=useState(false);
  const [imgErr,setImgErr]=useState(false);
  return(
    <div className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${agentPick?"border-amber-400 shadow-amber-100 shadow-md":"border-stone-200 shadow-sm"}`}>
      <div className="relative overflow-hidden bg-stone-100 h-52">
        {!imgErr?(
          <img src={item.img} alt={item.name} onError={()=>setImgErr(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
        ):(
          <div className="w-full h-full flex items-center justify-center text-5xl bg-stone-100">👕</div>
        )}
        {agentPick&&(
          <div className="absolute top-2.5 left-2.5 bg-amber-600 text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">
            AI Pick
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 text-sm leading-tight mb-1">{item.name}</h3>
        <p className="text-stone-400 text-xs leading-relaxed mb-3">{item.desc}</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono font-semibold text-stone-900 text-sm">{fmt(item.price)}</p>
            <p className="text-[10px] text-stone-400 tracking-wide uppercase mt-0.5">Arc · USDC</p>
          </div>
          <button
            onClick={()=>{onAdd(item);setAdded(true);setTimeout(()=>setAdded(false),1300);}}
            className={`text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-all duration-300 ${added?"bg-amber-600 text-white":"bg-stone-900 hover:bg-stone-700 text-white"}`}>
            {added?"✓ Added":"Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({cart,onRemove,onCheckout,onClose,wallet}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  return(
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100]"/>
      <aside className="fixed top-0 right-0 w-96 h-full bg-white z-[1200] flex flex-col shadow-2xl animate-[drawerIn_.28s_ease]">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div>
            <h2 className="font-serif text-xl font-semibold text-stone-900">Shopping Bag</h2>
            <p className="text-xs text-stone-400 mt-0.5">{cart.reduce((s,i)=>s+i.qty,0)} items</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length===0?(
            <div className="text-center pt-20">
              <p className="text-4xl mb-3 opacity-20">🛒</p>
              <p className="text-sm text-stone-400">Your bag is empty</p>
            </div>
          ):cart.map(item=>(
            <div key={item.id} className="flex gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                <img src={item.img} alt={item.name} onError={e=>e.target.style.display="none"} className="w-full h-full object-cover"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                <p className="text-xs text-stone-400 mt-0.5">Qty {item.qty} · {fmt(item.price)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-xs font-semibold text-stone-900">{fmt(item.price*item.qty)}</p>
                <button onClick={()=>onRemove(item.id)} className="text-[10px] text-stone-400 hover:text-red-500 underline mt-1 block transition-colors">remove</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length>0&&(
          <div className="p-5 border-t border-stone-100 space-y-3">
            <div className="space-y-1.5">
              {[["Subtotal",fmt(total)],["Gas (USDC)","~0.001"]].map(([k,v])=>(
                <div key={k} className="flex justify-between text-xs text-stone-400">
                  <span>{k}</span><span className="font-mono">{v}</span>
                </div>
              ))}
              <div className="flex justify-between text-base font-semibold text-stone-900 border-t border-stone-100 pt-2 mt-1">
                <span>Total</span><span className="font-mono">{fmt(total)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-stone-900 rounded-xl p-3">
              <div className="w-7 h-7 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">◎</div>
              <div>
                <p className="text-[9px] font-bold text-amber-400 tracking-widest uppercase">Arc Blockchain · USDC</p>
                <p className="text-[9px] text-stone-500 mt-0.5">Sub-second finality · Circle L1</p>
              </div>
            </div>
            <button onClick={onCheckout} className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs tracking-widest uppercase py-3.5 rounded-xl transition-colors shadow-lg shadow-stone-900/20">
              {wallet?"Pay with USDC on Arc →":"Connect Wallet to Pay →"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

// ── Checkout Modal with Rabby + MetaMask fix ────────────────────────────────
function CheckoutModal({cart,wallet,onClose,onSuccess,addToast}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const [step,setStep]=useState("review");
  const [txHash,setTxHash]=useState("");

  const pay = async () => {
    if (!window.ethereum) {
      addToast("No wallet detected. Please install Rabby or MetaMask", "error");
      return;
    }
    setStep("signing");
    try {
      // Step 1 — check which chain we are on
      const currentChain = await window.ethereum.request({ method: "eth_chainId" });

      // Step 2 — only switch if not already on Arc
      if (currentChain !== ARC_CHAIN_ID) {
        try {
          // Try adding the chain first (works for both Rabby and MetaMask)
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ARC_CHAIN_CONFIG],
          });
        } catch (addErr) {
          // If add fails, try switching directly
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: ARC_CHAIN_ID }],
            });
          } catch (switchErr) {
            if (switchErr.code === 4001) {
              addToast("Please approve the network switch in your wallet", "error");
            } else {
              addToast("Please add Arc Testnet manually in your wallet settings", "error");
            }
            setStep("review");
            return;
          }
        }
      }

      // Step 3 — send the USDC transaction
      const amt = Math.round(total * 1e6);
      const data = "0xa9059cbb" +
        MERCHANT_ADDR.slice(2).padStart(64, "0") +
        amt.toString(16).padStart(64, "0");

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: USDC_ADDRESS, data, gas: "0x186A0" }],
      });

      setTxHash(hash);
      setStep("success");
      onSuccess();
      addToast("Payment confirmed on Arc!", "success");

    } catch (err) {
      if (err.code === 4001 || err.message?.includes("denied") || err.message?.includes("rejected")) {
        addToast("Transaction cancelled", "error");
      } else {
        addToast("Error: " + (err.message || "Unknown error"), "error");
      }
      setStep("review");
    }
  };

  return(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[460px] max-w-full p-8 relative shadow-2xl animate-[modalIn_.3s_ease]">
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 flex items-center justify-center text-xs transition-colors">✕</button>
        {step==="review"&&<>
          <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-1">Order Summary</h2>
          <p className="text-xs text-stone-400 tracking-wide mb-5">Review before paying with USDC on Arc</p>
          <div className="bg-stone-50 rounded-xl border border-stone-100 divide-y divide-stone-100 mb-5 max-h-36 overflow-y-auto">
            {cart.map(i=>(
              <div key={i.id} className="flex justify-between items-center px-4 py-2 text-sm">
                <span className="text-stone-700">{i.name} <span className="text-stone-400">×{i.qty}</span></span>
                <span className="font-mono text-xs text-stone-600">{fmt(i.price*i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="bg-stone-900 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">◎</div>
              <div>
                <p className="text-sm font-semibold text-white">Arc Blockchain · USDC</p>
                <p className="text-[9px] text-stone-500 tracking-widest uppercase mt-0.5">Circle L1 · EVM Compatible · Rabby & MetaMask</p>
              </div>
            </div>
            {[["Wallet",trunc(wallet)||"Not connected"],["Network","Arc Testnet"],["Gas","~0.001 USDC"]].map(([k,v])=>(
              <div key={k} className="flex justify-between text-xs py-0.5">
                <span className="text-stone-500">{k}</span><span className="font-mono text-stone-300">{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-semibold text-white border-t border-stone-700 pt-3 mt-2">
              <span>Total</span><span className="font-mono text-amber-400">{fmt(total)}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold tracking-widest uppercase py-3 rounded-xl transition-colors">Cancel</button>
            <button onClick={pay} className="flex-[2] bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-widest uppercase py-3 rounded-xl transition-colors shadow-lg">Pay {fmt(total)}</button>
          </div>
        </>}
        {step==="signing"&&(
          <div className="text-center py-12">
            <div className="text-4xl mb-4 inline-block animate-spin">⚡</div>
            <h3 className="font-serif text-xl font-semibold text-stone-900 mb-2">Signing Transaction</h3>
            <p className="text-sm text-stone-400">Approve in your wallet</p>
            <p className="text-xs text-amber-600 tracking-widest uppercase mt-2">Arc finality &lt;1 second</p>
          </div>
        )}
        {step==="success"&&(
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-stone-900 rounded-full mx-auto mb-4 flex items-center justify-center text-amber-400 text-2xl">✓</div>
            <h3 className="font-serif text-2xl font-semibold text-stone-900 mb-2">Payment Confirmed</h3>
            <p className="text-sm text-stone-400 mb-4">Settled on Arc Blockchain</p>
            {txHash&&<p className="text-[9px] font-mono text-stone-400 bg-stone-50 rounded-lg p-2 break-all mb-4 border border-stone-100">{txHash}</p>}
            <button onClick={onClose} className="bg-stone-900 text-white text-xs font-bold tracking-widest uppercase px-8 py-3 rounded-xl hover:bg-stone-800 transition-colors">Continue Shopping</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentChat({cart,setCart,setActiveSection,setCheckoutOpen,addToast,onClose}){
  const [msgs,setMsgs]=useState([{role:"assistant",text:"Hi! I'm your ArcWear AI agent 👋\n\nTell me what you're looking for — an outfit, a budget, an occasion — and I'll search, add items to your cart, and handle USDC checkout on Arc."}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [tools,setTools]=useState([]);
  const cartRef=useRef(cart);
  const bottomRef=useRef(null);
  useEffect(()=>{cartRef.current=cart;},[cart]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);

  const exec=(name,inp)=>{
    if(name==="search_products"){
      let r=[...ALL_PRODUCTS];
      if(inp.section&&inp.section!=="all") r=r.filter(p=>p.section===inp.section);
      if(inp.category) r=r.filter(p=>p.category===inp.category);
      if(inp.maxPrice) r=r.filter(p=>p.price<=inp.maxPrice);
      if(inp.minPrice) r=r.filter(p=>p.price>=inp.minPrice);
      if(inp.keywords?.length) r=r.filter(p=>inp.keywords.some(k=>p.name.toLowerCase().includes(k.toLowerCase())));
      return{found:r.length,products:r.map(p=>({id:p.id,name:p.name,price:p.price,section:p.sectionLabel,category:p.categoryLabel}))};
    }
    if(name==="add_to_cart"){
      const p=ALL_PRODUCTS.find(x=>x.id===inp.productId);
      if(!p) return{error:"Not found"};
      setCart(prev=>{const ex=prev.find(x=>x.id===p.id);if(ex)return prev.map(x=>x.id===p.id?{...x,qty:x.qty+(inp.quantity||1)}:x);return[...prev,{...p,qty:inp.quantity||1}];});
      setActiveSection(p.section);
      addToast(`✓ Agent added ${p.name}`,"agent");
      return{success:true,added:p.name,price:p.price};
    }
    if(name==="remove_from_cart"){setCart(p=>p.filter(x=>x.id!==inp.productId));return{success:true};}
    if(name==="view_cart"){
      const c=cartRef.current;
      return{items:c.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})),total:c.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)};
    }
    if(name==="initiate_checkout"){setTimeout(()=>setCheckoutOpen(true),600);return{success:true};}
    return{error:"Unknown"};
  };

  const runAgent=async(apiMsgs)=>{
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514",max_tokens:1000,
        system:"You are ArcWear's AI shopping agent. Help users find and purchase clothing via USDC on Arc blockchain. Always use tools to act. When recommending outfits, search and add multiple items. Summarise additions with USDC totals. Sections: men, women, children. Categories: shirts, trousers, belts, caps, shoes.",
        tools:AGENT_TOOLS,messages:apiMsgs,
      }),
    });
    const data=await res.json();
    let text="";const toolBlocks=[];
    for(const b of data.content||[]){if(b.type==="text")text+=b.text;if(b.type==="tool_use")toolBlocks.push(b);}
    if(toolBlocks.length){
      setTools(toolBlocks.map(b=>b.name));
      const results=toolBlocks.map(b=>({type:"tool_result",tool_use_id:b.id,content:JSON.stringify(exec(b.name,b.input))}));
      return runAgent([...apiMsgs,{role:"assistant",content:data.content},{role:"user",content:results}]);
    }
    setTools([]);return text;
  };

  const send=async()=>{
    if(!input.trim()||loading)return;
    const txt=input.trim();setInput("");setLoading(true);
    setMsgs(p=>[...p,{role:"user",text:txt}]);
    const apiMsgs=msgs.filter(m=>m.role==="assistant"||m.role==="user").map(m=>({role:m.role,content:m.text}));
    apiMsgs.push({role:"user",content:txt});
    try{const r=await runAgent(apiMsgs);setMsgs(p=>[...p,{role:"assistant",text:r||"Done! Anything else?"}]);}
    catch{setMsgs(p=>[...p,{role:"assistant",text:"Something went wrong. Please try again."}]);}
    setLoading(false);
  };

  const CHIPS=["Men's formal outfit under 200 USDC","Women's summer look","Kids outfit under 80 USDC","View my cart","Checkout now"];

  return(
    <>
      <div onClick={onClose} className="fixed inset-0 z-[1300] bg-black/20 backdrop-blur-[2px]"/>
      <div className="fixed bottom-6 right-6 w-96 h-[560px] bg-white rounded-2xl shadow-2xl z-[1400] flex flex-col overflow-hidden animate-[agentIn_.35s_cubic-bezier(.16,1,.3,1)]">
        <div className="bg-stone-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-400 rounded-xl flex items-center justify-center text-sm font-bold text-white">◎</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-stone-900"/>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">ArcWear Agent</p>
              <p className="text-[9px] text-amber-400 tracking-widest uppercase mt-0.5">AI · USDC · Arc Blockchain</p>
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center text-xs transition-colors">✕</button>
        </div>
        {tools.length>0&&(
          <div className="bg-stone-50 border-b border-stone-100 px-4 py-1.5 flex gap-2 items-center flex-shrink-0">
            <span className="text-amber-500 text-[8px] font-bold animate-pulse">●</span>
            {tools.map((t,i)=><span key={i} className="bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide uppercase">⚡ {t.replace(/_/g," ")}</span>)}
          </div>
        )}
        <div className="flex-1 overflow-y-scroll p-4 space-y-3 agent-scroll">
          {msgs.map((m,i)=>(
            <div key={i} className={`flex gap-2 items-end ${m.role==="user"?"flex-row-reverse":""}`}>
              {m.role==="assistant"&&(
                <div className="w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-400 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">◎</div>
              )}
              <div className={`px-3.5 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap break-words ${m.role==="user"?"bg-stone-900 text-white rounded-br-sm":"bg-stone-50 border border-stone-100 text-stone-800 rounded-bl-sm"}`}>
                {m.text}
              </div>
              {m.role==="user"&&<div className="w-7 h-7 bg-stone-200 rounded-lg flex items-center justify-center text-xs font-semibold text-stone-600 flex-shrink-0">U</div>}
            </div>
          ))}
          {loading&&(
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-400 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">◎</div>
              <div className="bg-stone-50 border border-stone-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                {[0,1,2].map(i=><div key={i} style={{animationDelay:`${i*0.18}s`}} className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        {msgs.length<=1&&(
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
            {CHIPS.map((c,i)=>(
              <button key={i} onClick={()=>setInput(c)} className="bg-stone-50 hover:border-amber-400 border border-stone-200 rounded-full px-3 py-1 text-[10px] text-stone-600 cursor-pointer transition-colors">
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="p-3 border-t border-stone-100 flex gap-2 flex-shrink-0">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Ask about outfits, budgets, styles…"
            className="flex-1 bg-stone-50 border border-stone-200 focus:border-amber-400 focus:outline-none rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 transition-colors"/>
          <button onClick={send} disabled={loading||!input.trim()}
            className={`px-4 rounded-xl text-xs font-bold tracking-widest uppercase text-white transition-colors ${loading||!input.trim()?"bg-stone-300 cursor-not-allowed":"bg-stone-900 hover:bg-stone-700"}`}>
            {loading?"…":"Send"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function ArcWear(){
  const [section,setSection]    =useState("men");
  const [activeCat,setActiveCat]=useState(null);
  const [cart,setCart]          =useState([]);
  const [cartOpen,setCartOpen]  =useState(false);
  const [checkout,setCheckout]  =useState(false);
  const [agentOpen,setAgent]    =useState(false);
  const [wallet,setWallet]      =useState(null);
  const [toasts,setToasts]      =useState([]);
  const [scrolled,setScrolled]  =useState(false);

  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>50);
    window.addEventListener("scroll",h);
    return()=>window.removeEventListener("scroll",h);
  },[]);

  const addToast=(msg,type="info")=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3000);
  };

  const connectWallet=async()=>{
    if(!window.ethereum){addToast("Install Rabby or MetaMask to connect","error");return;}
    try{
      const a=await window.ethereum.request({method:"eth_requestAccounts"});
      setWallet(a[0]);
      addToast(`Connected: ${trunc(a[0])}`,"success");
    }catch{addToast("Connection cancelled","error");}
  };

  const addToCart=item=>{
    setCart(prev=>{const ex=prev.find(x=>x.id===item.id);if(ex)return prev.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x);return[...prev,{...item,qty:1}];});
    addToast(`${item.name} added to bag`,"success");
  };

  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const sec=CATALOGUE[section];
  const cats=Object.entries(sec.categories);
  const displayCats=activeCat?cats.filter(([k])=>k===activeCat):cats;

  return(
    <div className="min-h-screen bg-[#F8F5F0]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        .font-serif { font-family: 'Playfair Display', serif !important; }
        .font-mono  { font-family: 'DM Mono', monospace !important; }
        @keyframes toastIn   { from{transform:translateY(14px);opacity:0} to{transform:none;opacity:1} }
        @keyframes drawerIn  { from{transform:translateX(100%)} to{transform:none} }
        @keyframes modalIn   { from{transform:scale(.96);opacity:0} to{transform:none;opacity:1} }
        @keyframes agentIn   { from{transform:scale(.93) translateY(18px);opacity:0} to{transform:none;opacity:1} }
        @keyframes heroFade  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes glow      { 0%,100%{box-shadow:0 0 0 0 rgba(180,140,80,.5)} 60%{box-shadow:0 0 0 12px rgba(180,140,80,0)} }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#F8F5F0}
        ::-webkit-scrollbar-thumb{background:#D9D0C4;border-radius:4px}
        .agent-scroll::-webkit-scrollbar{width:6px}
        .agent-scroll::-webkit-scrollbar-track{background:#f1ede8;border-radius:6px;margin:6px 0}
        .agent-scroll::-webkit-scrollbar-thumb{background:#b8a898;border-radius:6px;border:1px solid #f1ede8}
        .agent-scroll::-webkit-scrollbar-thumb:hover{background:#9a7b4f}
        .agent-scroll{scrollbar-width:thin;scrollbar-color:#b8a898 #f1ede8}
      `}</style>

      {/* NAVBAR */}
      <nav className={`sticky top-0 z-[900] transition-all duration-300 ${scrolled?"bg-[#F8F5F0]/95 backdrop-blur-xl border-b border-stone-200 shadow-sm":"bg-[#F8F5F0]"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="font-serif text-xs font-bold text-amber-500 tracking-wider">AW</span>
            </div>
            <div>
              <p className="font-serif text-base font-bold text-stone-900 leading-none tracking-wide">ArcWear</p>
              <p className="text-[7px] text-amber-600 font-semibold tracking-[2px] uppercase mt-0.5">Agentic · Arc Blockchain</p>
            </div>
          </div>
          <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
            {["men","women","children"].map(k=>{
              const s=CATALOGUE[k];
              return(
                <button key={k} onClick={()=>{setSection(k);setActiveCat(null);}}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${section===k?"bg-white text-stone-900 shadow-sm":"text-stone-500 hover:text-stone-700"}`}>
                  <span className="text-sm">{s.icon}</span>{s.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {wallet?(
              <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"/>
                <span className="font-mono text-[9px] text-amber-600">{trunc(wallet)}</span>
              </div>
            ):(
              <button onClick={connectWallet}
                className="flex items-center gap-1.5 bg-white hover:border-amber-400 border border-stone-200 rounded-full px-4 py-2 text-xs font-semibold text-stone-700 transition-all hover:shadow-sm">
                <span>◎</span> Connect Wallet
              </button>
            )}
            <button onClick={()=>setCartOpen(true)}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all shadow-lg shadow-stone-900/20">
              🛍 Bag
              {cartCount>0&&<span className="bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-stone-900 px-6 py-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(circle at 18% 52%, rgba(154,123,79,0.14) 0%, transparent 58%), radial-gradient(circle at 82% 18%, rgba(196,164,124,0.07) 0%, transparent 50%)"}}/>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-8" style={{animation:"heroFade .6s ease both"}}>
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-amber-900/30 border border-amber-700/30 rounded-full px-3 py-1 mb-4">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>
                <span className="text-[9px] text-amber-400 font-bold tracking-[2px] uppercase">AI Agent · Live on Arc</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
                Shop with ArcWear
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">
                {sec.label}'s collection — shirts, trousers, belts, headwear & footwear · Pay with USDC on Arc Blockchain
              </p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={()=>setAgent(true)}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-amber-900/30 transition-all hover:-translate-y-0.5">
                  ◎ Shop with AI Agent
                </button>
                <button onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}
                  className="text-stone-300 hover:text-white border border-stone-700 hover:border-stone-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                  Browse Collection ↓
                </button>
              </div>
            </div>
            <div className="flex gap-6 flex-wrap" style={{animation:"heroFade .8s .12s ease both",opacity:0}}>
              {[["5","Categories"],["25+","Products"],["USDC","Payment"],["Arc","Blockchain"]].map(([v,l])=>(
                <div key={l} className="text-center">
                  <p className="font-serif text-2xl font-bold text-white">{v}</p>
                  <p className="text-[9px] text-stone-500 tracking-[1.5px] uppercase mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="bg-white border-b border-stone-100 sticky top-16 z-[800]">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto py-2">
            <button onClick={()=>setActiveCat(null)}
              className={`px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border transition-all whitespace-nowrap ${!activeCat?"bg-stone-900 text-white border-stone-900":"bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400"}`}>
              All
            </button>
            {cats.map(([k,cat])=>(
              <button key={k} onClick={()=>setActiveCat(activeCat===k?null:k)}
                className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border transition-all whitespace-nowrap ${activeCat===k?"bg-stone-900 text-white border-stone-900":"bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-400"}`}>
                <span className="text-sm">{cat.emoji||"🏷"}</span>{cat.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400 flex-shrink-0 ml-4">
            {displayCats.reduce((s,[,c])=>s+c.items.length,0)} items
          </p>
        </div>
      </div>

      {/* PRODUCTS */}
      <main id="products" className="max-w-7xl mx-auto px-6 py-10 pb-24">
        {displayCats.map(([catKey,cat])=>(
          <section key={catKey} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl">{cat.emoji}</span>
              <h2 className="font-serif text-xl font-semibold text-stone-900">{cat.label}</h2>
              <div className="flex-1 h-px bg-stone-200"/>
              <span className="text-xs text-stone-400">{cat.items.length} products</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {cat.items.map(item=>(
                <ProductCard key={item.id} item={{...item,categoryLabel:cat.label}} onAdd={addToCart} agentPick={false}/>
              ))}
            </div>
          </section>
        ))}
        <div className="bg-stone-900 rounded-2xl p-8 flex items-center flex-wrap gap-6 mt-4 border border-stone-800">
          <div className="flex-1 min-w-48">
            <h3 className="font-serif text-lg font-semibold text-white mb-1.5">Powered by Arc Blockchain</h3>
            <p className="text-xs text-stone-500 leading-relaxed">AI shopping agent · USDC stablecoin · Circle's Arc L1 · Sub-second settlement · Non-custodial</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            {[["◎","AI Agent","Autonomous"],["⚡","<1s","Finality"],["$","USDC","Stablecoin"],["🔒","Non","Custodial"]].map(([ic,a,b])=>(
              <div key={b} className="text-center">
                <p className="text-lg mb-1">{ic}</p>
                <p className="text-xs font-semibold text-white">{a}</p>
                <p className="text-[9px] text-stone-600 uppercase tracking-widest mt-0.5">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FLOATING BUTTONS */}
      {!agentOpen&&(
        <button onClick={()=>setAgent(true)}
          className="fixed bottom-7 right-7 flex items-center gap-2.5 bg-stone-900 text-white border-2 border-amber-600 rounded-full px-5 py-3 text-xs font-bold tracking-wide z-[700] shadow-xl transition-transform hover:scale-105"
          style={{animation:"glow 3s ease-in-out infinite"}}>
          <div className="relative w-2 h-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"/>
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-60"/>
          </div>
          ◎ AI Agent
        </button>
      )}
      {scrolled&&(
        <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}
          className="fixed bottom-7 left-7 w-10 h-10 bg-white border border-stone-200 rounded-full text-stone-700 flex items-center justify-center shadow-md z-[700] hover:-translate-y-0.5 hover:shadow-lg transition-all">
          ↑
        </button>
      )}

      {cartOpen&&<CartDrawer cart={cart} onRemove={id=>setCart(p=>p.filter(x=>x.id!==id))} onCheckout={()=>{if(!wallet){connectWallet();return;}setCartOpen(false);setCheckout(true);}} onClose={()=>setCartOpen(false)} wallet={wallet}/>}
      {checkout&&<CheckoutModal cart={cart} wallet={wallet} onClose={()=>setCheckout(false)} onSuccess={()=>{setCart([]);setCheckout(false);}} addToast={addToast}/>}
      {agentOpen&&<AgentChat cart={cart} setCart={setCart} setActiveSection={setSection} setCheckoutOpen={setCheckout} addToast={addToast} onClose={()=>setAgent(false)}/>}

      <Toasts list={toasts}/>
    </div>
  );
}