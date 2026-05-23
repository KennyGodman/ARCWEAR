import { useState, useRef, useEffect } from "react";

const ARC_CHAIN_ID = "0x4cef52";
const ARC_CHAIN_CONFIG = {
  chainId: ARC_CHAIN_ID, chainName: "Arc Testnet",
  nativeCurrency: { name:"USDC", symbol:"USDC", decimals:6 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};
const USDC_ADDRESS  = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const MERCHANT_ADDR = "0x4932B6c1970131321B79d8Be02A1791A09554bf5";

const CATALOGUE = {
  men: { label:"Men", icon:"👔", categories:{
    shirts:  { label:"Shirts & Tops", emoji:"👕", items:[
      {id:"m-s1",name:"Oxford Button-Down",price:42,oldPrice:58,desc:"Egyptian cotton, spread collar",img:"https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80"},
      {id:"m-s2",name:"Linen Crew Tee",price:28,oldPrice:38,desc:"Stonewashed linen, relaxed fit",img:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80"},
      {id:"m-s3",name:"Flannel Overshirt",price:65,oldPrice:80,desc:"Brushed flannel, double chest pocket",img:"https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=400&q=80"},
    ]},
    trousers:{ label:"Trousers", emoji:"👖", items:[
      {id:"m-t1",name:"Slim Chino",price:58,oldPrice:75,desc:"Stretch cotton, tapered leg",img:"https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"},
      {id:"m-t2",name:"Cargo Pants",price:72,oldPrice:90,desc:"Ripstop canvas, utility pockets",img:"https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80"},
      {id:"m-t3",name:"Dress Trouser",price:85,oldPrice:105,desc:"Wool-blend, flat-front cut",img:"https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80"},
    ]},
    belts:   { label:"Belts", emoji:"🪢", items:[
      {id:"m-b1",name:"Leather Classic",price:35,oldPrice:45,desc:"Full-grain Italian leather",img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80"},
      {id:"m-b2",name:"Woven Canvas Belt",price:22,oldPrice:30,desc:"Military-style, brass buckle",img:"https://images.unsplash.com/photo-1625496492751-47e1f4a25c15?w=400&q=80"},
    ]},
    caps:    { label:"Headwear", emoji:"🧢", items:[
      {id:"m-c1",name:"Snapback Cap",price:25,oldPrice:32,desc:"6-panel, structured brim",img:"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80"},
      {id:"m-c2",name:"Bucket Hat",price:20,oldPrice:28,desc:"Waxed cotton, packable",img:"https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80"},
      {id:"m-c3",name:"Beanie Knit",price:18,oldPrice:25,desc:"Merino wool, ribbed cuff",img:"https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80"},
    ]},
    shoes:   { label:"Footwear", emoji:"👟", items:[
      {id:"m-sh1",name:"White Leather Sneaker",price:110,oldPrice:140,desc:"Tumbled leather, cupsole",img:"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80"},
      {id:"m-sh2",name:"Chelsea Boot",price:145,oldPrice:180,desc:"Suede upper, elastic gusset",img:"https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&q=80"},
      {id:"m-sh3",name:"Loafer Slip-On",price:98,oldPrice:120,desc:"Horsebit detail, leather lining",img:"https://images.unsplash.com/photo-1631984564919-1f6e59f72f73?w=400&q=80"},
    ]},
  }},
  women: { label:"Women", icon:"👗", categories:{
    shirts:  { label:"Tops & Blouses", emoji:"👚", items:[
      {id:"w-s1",name:"Silk Blouse",price:68,oldPrice:85,desc:"Mulberry silk, relaxed drape",img:"https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80"},
      {id:"w-s2",name:"Crop Cami",price:32,oldPrice:42,desc:"Ribbed modal, adjustable straps",img:"https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80"},
      {id:"w-s3",name:"Wrap Cardigan",price:55,oldPrice:70,desc:"Cashmere blend, tie-waist",img:"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80"},
    ]},
    trousers:{ label:"Bottoms", emoji:"👗", items:[
      {id:"w-t1",name:"High-Rise Flare",price:75,oldPrice:95,desc:"Stretch denim, wide flare hem",img:"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80"},
      {id:"w-t2",name:"Midi Skirt",price:60,oldPrice:78,desc:"Satin lining, A-line silhouette",img:"https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80"},
      {id:"w-t3",name:"Tailored Wide-Leg",price:88,oldPrice:110,desc:"Crepe fabric, pleat front",img:"https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80"},
    ]},
    belts:   { label:"Belts", emoji:"🪢", items:[
      {id:"w-b1",name:"Gold Chain Belt",price:38,oldPrice:50,desc:"Brass links, adjustable fit",img:"https://images.unsplash.com/photo-1624623278313-a930126a11c3?w=400&q=80"},
      {id:"w-b2",name:"Slim Patent",price:30,oldPrice:40,desc:"Patent leather, pin buckle",img:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80"},
    ]},
    caps:    { label:"Headwear", emoji:"🎩", items:[
      {id:"w-c1",name:"Wide Brim Sun Hat",price:40,oldPrice:52,desc:"Raffia weave, ribbon band",img:"https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80"},
      {id:"w-c2",name:"Classic Beret",price:28,oldPrice:36,desc:"Felted wool, French-style",img:"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80"},
      {id:"w-c3",name:"Knit Pom Beanie",price:22,oldPrice:30,desc:"Chunky knit, removable pom",img:"https://images.unsplash.com/photo-1510598155236-d3e2e31d3e0c?w=400&q=80"},
    ]},
    shoes:   { label:"Footwear", emoji:"👠", items:[
      {id:"w-sh1",name:"Block Heel Mule",price:120,oldPrice:150,desc:"Suede upper, 7cm block heel",img:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80"},
      {id:"w-sh2",name:"Platform Sneaker",price:95,oldPrice:120,desc:"Leather & canvas, 4cm platform",img:"https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80"},
      {id:"w-sh3",name:"Kitten Heel Pump",price:138,oldPrice:170,desc:"Satin finish, pointed toe",img:"https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80"},
    ]},
  }},
  children: { label:"Children", icon:"🧒", categories:{
    shirts:  { label:"Tops & Tees", emoji:"👕", items:[
      {id:"k-s1",name:"Dino Print Tee",price:18,oldPrice:25,desc:"100% organic cotton, crew neck",img:"https://images.unsplash.com/photo-1519278409-1f56ab241a7d?w=400&q=80"},
      {id:"k-s2",name:"Rainbow Hoodie",price:32,oldPrice:42,desc:"Brushed fleece, kangaroo pocket",img:"https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=400&q=80"},
      {id:"k-s3",name:"Striped Long Sleeve",price:22,oldPrice:30,desc:"Soft jersey, ribbed cuffs",img:"https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80"},
    ]},
    trousers:{ label:"Bottoms", emoji:"👖", items:[
      {id:"k-t1",name:"Elastic Joggers",price:25,oldPrice:32,desc:"French terry, elastic waist",img:"https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=400&q=80"},
      {id:"k-t2",name:"Denim Shortalls",price:40,oldPrice:52,desc:"Stretch denim, adjustable straps",img:"https://images.unsplash.com/photo-1468820153901-27f1c5dcafd4?w=400&q=80"},
      {id:"k-t3",name:"Cargo Shorts",price:28,oldPrice:36,desc:"Ripstop, velcro side pockets",img:"https://images.unsplash.com/photo-1577253313708-cab167d2c474?w=400&q=80"},
    ]},
    belts:   { label:"Belts", emoji:"🪢", items:[
      {id:"k-b1",name:"Cartoon Buckle Belt",price:12,oldPrice:18,desc:"Woven, fun character buckle",img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80"},
    ]},
    caps:    { label:"Headwear", emoji:"🧢", items:[
      {id:"k-c1",name:"Dino Baseball Cap",price:15,oldPrice:22,desc:"Cotton twill, embroidered dino",img:"https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=400&q=80"},
      {id:"k-c2",name:"Sun Protection Hat",price:20,oldPrice:28,desc:"UPF 50+, wide brim",img:"https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80"},
    ]},
    shoes:   { label:"Footwear", emoji:"👟", items:[
      {id:"k-sh1",name:"Light-Up Sneakers",price:55,oldPrice:70,desc:"LED outsole, velcro close",img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80"},
      {id:"k-sh2",name:"Velcro Sandals",price:38,oldPrice:50,desc:"Quick-dry, adjustable strap",img:"https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&q=80"},
      {id:"k-sh3",name:"Rain Boots",price:42,oldPrice:55,desc:"Natural rubber, easy-pull tab",img:"https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80"},
    ]},
  }},
};

const ALL_PRODUCTS=[];
for(const[sk,sec]of Object.entries(CATALOGUE))
  for(const[ck,cat]of Object.entries(sec.categories))
    for(const item of cat.items)
      ALL_PRODUCTS.push({...item,section:sk,sectionLabel:sec.label,category:ck,categoryLabel:cat.label,emoji:cat.emoji});

const AGENT_TOOLS=[
  {name:"search_products",description:"Search catalogue by section, category, price or keywords.",
   input_schema:{type:"object",properties:{section:{type:"string",enum:["men","women","children","all"]},category:{type:"string"},maxPrice:{type:"number"},minPrice:{type:"number"},keywords:{type:"array",items:{type:"string"}}}}},
  {name:"add_to_cart",description:"Add product to cart by ID.",
   input_schema:{type:"object",required:["productId"],properties:{productId:{type:"string"},quantity:{type:"number"}}}},
  {name:"view_cart",description:"View cart and total.",input_schema:{type:"object",properties:{}}},
  {name:"remove_from_cart",description:"Remove product from cart.",input_schema:{type:"object",required:["productId"],properties:{productId:{type:"string"}}}},
  {name:"initiate_checkout",description:"Open USDC checkout on Arc.",input_schema:{type:"object",properties:{}}},
];

const fmt   = n=>`${Number(n).toFixed(2)} USDC`;
const trunc = a=>a?`${a.slice(0,6)}…${a.slice(-4)}`:"";
const disc  = (p,op)=>Math.round(((op-p)/op)*100);

/* ── Toasts ─────────────────────────────────────────────────────────────── */
function Toasts({list}){
  return(
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none"}}>
      {list.map(t=>(
        <div key={t.id} style={{background:t.type==="agent"?"#c47d2a":t.type==="error"?"#b91c1c":"#1c1917",color:"#fff",padding:"9px 22px",borderRadius:40,fontSize:13,fontFamily:"'Jost',sans-serif",boxShadow:"0 4px 20px rgba(0,0,0,0.2)",whiteSpace:"nowrap",animation:"toastIn .3s ease"}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ── Edit Modal ─────────────────────────────────────────────────────────── */
function EditModal({item,onClose,onSave}){
  const [qty,setQty]=useState(1);
  const [size,setSize]=useState("M");
  const [color,setColor]=useState("Default");
  const sizes=["XS","S","M","L","XL","XXL"];
  const colors=["Default","Black","White","Navy","Grey","Beige"];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:16,width:440,maxWidth:"100%",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",animation:"modalIn .25s ease"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderBottom:"1px solid #f0ede8"}}>
          <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",background:"#f5f3f0",flexShrink:0}}>
            <img src={item.img} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
          </div>
          <div style={{flex:1}}>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,color:"#1c1917",margin:0,lineHeight:1.3}}>{item.name}</p>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#c47d2a",margin:"4px 0 0"}}>{fmt(item.price)}</p>
          </div>
          <button onClick={onClose} style={{background:"#f5f3f0",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14,color:"#78716c",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {/* Body */}
        <div style={{padding:"18px 20px"}}>
          {/* Size */}
          <div style={{marginBottom:16}}>
            <p style={{fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:700,color:"#78716c",letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>Size</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {sizes.map(s=>(
                <button key={s} onClick={()=>setSize(s)} style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${size===s?"#1c1917":"#e7e4e0"}`,background:size===s?"#1c1917":"#fff",color:size===s?"#fff":"#44403c",fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* Color */}
          <div style={{marginBottom:16}}>
            <p style={{fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:700,color:"#78716c",letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>Color</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {colors.map(c=>(
                <button key={c} onClick={()=>setColor(c)} style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${color===c?"#1c1917":"#e7e4e0"}`,background:color===c?"#1c1917":"#fff",color:color===c?"#fff":"#44403c",fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          {/* Qty */}
          <div style={{marginBottom:20}}>
            <p style={{fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:700,color:"#78716c",letterSpacing:1.2,textTransform:"uppercase",marginBottom:8}}>Quantity</p>
            <div style={{display:"flex",alignItems:"center",gap:0,border:"1px solid #e7e4e0",borderRadius:10,overflow:"hidden",width:"fit-content"}}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:40,height:40,border:"none",background:"#f5f3f0",cursor:"pointer",fontSize:16,color:"#44403c",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <span style={{width:44,textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:"#1c1917"}}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{width:40,height:40,border:"none",background:"#f5f3f0",cursor:"pointer",fontSize:16,color:"#44403c",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
          </div>
          <button onClick={()=>onSave({...item,qty,size,color})} style={{width:"100%",background:"#1c1917",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'Jost',sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
            Add to Cart — {fmt(item.price*qty)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Card (Jumia style) ─────────────────────────────────────────── */
function ProductCard({item,onAdd,onEdit,agentPick}){
  const [imgErr,setImgErr]=useState(false);
  const [wishlist,setWishlist]=useState(false);
  const pct=disc(item.price,item.oldPrice);
  return(
    <div style={{background:"#fff",border:"1px solid #e7e4e0",borderRadius:4,overflow:"hidden",cursor:"pointer",position:"relative",transition:"box-shadow .2s",fontFamily:"'Jost',sans-serif"}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.1)"}
      onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
      {/* Discount badge */}
      <div style={{position:"absolute",top:8,left:8,background:"#c41e3a",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:3,zIndex:2,letterSpacing:0.5}}>
        -{pct}%
      </div>
      {/* Wishlist */}
      <button onClick={()=>setWishlist(w=>!w)} style={{position:"absolute",top:8,right:8,background:"rgba(255,255,255,0.9)",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",zIndex:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}}>
        {wishlist?"❤️":"🤍"}
      </button>
      {/* AI Pick badge */}
      {agentPick&&<div style={{position:"absolute",top:40,left:8,background:"#c47d2a",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,zIndex:2,letterSpacing:0.8,textTransform:"uppercase"}}>AI Pick</div>}
      {/* Image */}
      <div style={{height:180,background:"#f9f7f5",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
        {!imgErr?(
          <img src={item.img} alt={item.name} onError={()=>setImgErr(true)} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .4s"}}
            onMouseEnter={e=>e.target.style.transform="scale(1.06)"}
            onMouseLeave={e=>e.target.style.transform="scale(1)"}/>
        ):(
          <span style={{fontSize:52}}>{item.emoji||"👕"}</span>
        )}
      </div>
      {/* Info */}
      <div style={{padding:"10px 12px 12px"}}>
        <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:500,color:"#1c1917",margin:"0 0 4px",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</p>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:"#c41e3a"}}>{fmt(item.price)}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#a8a29e",textDecoration:"line-through"}}>{fmt(item.oldPrice)}</span>
          <span style={{fontSize:10,color:"#78716c"}}>{item.desc}</span>
        </div>
        {/* Buttons */}
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>onAdd(item)} style={{flex:1,background:"#f97316",color:"#fff",border:"none",borderRadius:4,padding:"8px 0",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:0.8,textTransform:"uppercase",transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#ea6c0a"}
            onMouseLeave={e=>e.currentTarget.style.background="#f97316"}>
            Add to Cart
          </button>
          <button onClick={()=>onEdit(item)} style={{width:36,background:"#f5f3f0",border:"1px solid #e7e4e0",borderRadius:4,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s",flexShrink:0}}
            title="Edit options"
            onMouseEnter={e=>e.currentTarget.style.background="#e7e4e0"}
            onMouseLeave={e=>e.currentTarget.style.background="#f5f3f0"}>
            ✏️
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Cart Drawer ─────────────────────────────────────────────────────────── */
function CartDrawer({cart,onRemove,onCheckout,onClose,wallet}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1100,backdropFilter:"blur(2px)"}}/>
      <aside style={{position:"fixed",top:0,right:0,width:380,height:"100%",background:"#fff",zIndex:1200,display:"flex",flexDirection:"column",boxShadow:"-8px 0 40px rgba(0,0,0,0.12)",animation:"drawerIn .28s ease",fontFamily:"'Jost',sans-serif"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px",borderBottom:"1px solid #f0ede8"}}>
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#1c1917",margin:0}}>Your Cart</h2>
            <p style={{fontSize:11,color:"#a8a29e",margin:"3px 0 0"}}>{cart.reduce((s,i)=>s+i.qty,0)} items</p>
          </div>
          <button onClick={onClose} style={{background:"#f5f3f0",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:14,color:"#78716c",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
          {cart.length===0?(
            <div style={{textAlign:"center",paddingTop:80}}>
              <p style={{fontSize:44,marginBottom:10,opacity:0.2}}>🛒</p>
              <p style={{fontSize:13,color:"#a8a29e"}}>Your cart is empty</p>
            </div>
          ):cart.map(item=>(
            <div key={item.id+item.size+item.color} style={{display:"flex",gap:10,marginBottom:12,padding:10,background:"#faf9f7",borderRadius:8,border:"1px solid #f0ede8"}}>
              <div style={{width:52,height:52,borderRadius:6,overflow:"hidden",background:"#f0ede8",flexShrink:0}}>
                <img src={item.img} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontFamily:"'Jost',sans-serif",fontSize:13,fontWeight:600,color:"#1c1917",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</p>
                <p style={{fontSize:11,color:"#a8a29e",margin:"2px 0 0"}}>Qty {item.qty}{item.size?` · ${item.size}`:""}{item.color&&item.color!=="Default"?` · ${item.color}`:""}</p>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,color:"#1c1917",margin:0}}>{fmt(item.price*item.qty)}</p>
                <button onClick={()=>onRemove(item.id)} style={{background:"none",border:"none",color:"#a8a29e",cursor:"pointer",fontSize:10,marginTop:4,padding:0,textDecoration:"underline"}}>remove</button>
              </div>
            </div>
          ))}
        </div>
        {cart.length>0&&(
          <div style={{padding:"14px 20px 22px",borderTop:"1px solid #f0ede8"}}>
            {[["Subtotal",fmt(total)],["Gas (USDC)","~0.001"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#a8a29e",marginBottom:4}}>
                <span>{k}</span><span style={{fontFamily:"'DM Mono',monospace"}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:700,color:"#1c1917",borderTop:"1px solid #f0ede8",paddingTop:10,marginTop:6,marginBottom:14,fontFamily:"'Playfair Display',serif"}}>
              <span>Total</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:14}}>{fmt(total)}</span>
            </div>
            <div style={{background:"#1c1917",borderRadius:10,padding:"9px 13px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:26,height:26,background:"#c47d2a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>◎</div>
              <div>
                <p style={{fontSize:9,fontWeight:700,color:"#c47d2a",letterSpacing:1.5,textTransform:"uppercase",margin:0}}>Arc Blockchain · USDC</p>
                <p style={{fontSize:9,color:"#57534e",margin:"2px 0 0"}}>Sub-second finality · Circle L1</p>
              </div>
            </div>
            <button onClick={onCheckout} style={{width:"100%",background:"#f97316",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'Jost',sans-serif",boxShadow:"0 4px 16px rgba(249,115,22,0.3)"}}>
              {wallet?"Pay with USDC on Arc →":"Connect Wallet to Pay →"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ── Checkout Modal ──────────────────────────────────────────────────────── */
function CheckoutModal({cart,wallet,onClose,onSuccess,addToast}){
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const [step,setStep]=useState("review");
  const [txHash,setTxHash]=useState("");
  const [customerEmail,setCustomerEmail]=useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const pay=async()=>{
    if(!window.ethereum){addToast("No wallet detected","error");return;}
    setStep("signing");
    try{
      const currentChain=await window.ethereum.request({method:"eth_chainId"});
      if(currentChain!==ARC_CHAIN_ID){
        try{await window.ethereum.request({method:"wallet_addEthereumChain",params:[ARC_CHAIN_CONFIG]});}
        catch(e){
          try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:ARC_CHAIN_ID}]});}
          catch(se){
            addToast(se.code===4001?"Please approve the network switch":"Add Arc Testnet manually in your wallet","error");
            setStep("review");return;
          }
        }
      }
      const amt=Math.round(total*1e6);
      const data="0xa9059cbb"+MERCHANT_ADDR.slice(2).padStart(64,"0")+amt.toString(16).padStart(64,"0");
      const hash=await window.ethereum.request({method:"eth_sendTransaction",params:[{from:wallet,to:USDC_ADDRESS,data,gas:"0x186A0"}]});
      setTxHash(hash);setStep("success");onSuccess();addToast("Payment confirmed on Arc!","success");
      if(customerEmail){
  try{
    await fetch("/api/send-confirmation",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        customerEmail,
        customerWallet:wallet,
        items:cart,
        total,
        txHash:hash,
      }),
    });
  }catch(e){console.log("Email error:",e);}
}
    }catch(err){
      addToast(err.code===4001||err.message?.includes("denied")?"Transaction cancelled":"Error: "+(err.message||"Unknown"),"error");
      setStep("review");
    }
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:16,width:460,maxWidth:"100%",padding:30,position:"relative",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",animation:"modalIn .3s ease",fontFamily:"'Jost',sans-serif"}}>
        <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"#f5f3f0",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,color:"#78716c",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        {step==="review"&&<>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#1c1917",margin:"0 0 3px"}}>Order Summary</h2>
          <p style={{fontSize:11,color:"#a8a29e",margin:"0 0 16px",letterSpacing:0.3}}>Review before paying with USDC on Arc</p>
          <div style={{marginBottom:14}}>
  <label style={{fontSize:11,color:"#78716c",display:"block",marginBottom:6,letterSpacing:0.5}}>
    Email for order confirmation
  </label>
  <input
    type="email"
    value={customerEmail}
    onChange={e=>setCustomerEmail(e.target.value)}
    placeholder="you@email.com"
    style={{width:"100%",background:"#faf9f7",border:"1px solid #e7e4e0",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#1c1917",outline:"none",fontFamily:"'Jost',sans-serif"}}
    onFocus={e=>e.target.style.borderColor="#c47d2a"}
    onBlur={e=>e.target.style.borderColor="#e7e4e0"}
  />
</div>
          <div style={{background:"#faf9f7",borderRadius:10,border:"1px solid #f0ede8",marginBottom:16,maxHeight:140,overflowY:"auto"}}>
            {cart.map(i=>(
              <div key={i.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 14px",borderBottom:"1px solid #f0ede8",fontSize:13,color:"#1c1917"}}>
                <span>{i.name} <span style={{color:"#a8a29e"}}>×{i.qty}</span></span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{fmt(i.price*i.qty)}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#1c1917",borderRadius:12,padding:"14px 16px",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:30,height:30,background:"#c47d2a",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:800,flexShrink:0}}>◎</div>
              <div>
                <p style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#fff",margin:0}}>Arc Blockchain · USDC</p>
                <p style={{fontSize:9,color:"#57534e",letterSpacing:1.2,textTransform:"uppercase",margin:"2px 0 0"}}>Circle L1 · Rabby & MetaMask supported</p>
              </div>
            </div>
            {[["Wallet",trunc(wallet)||"Not connected"],["Network","Arc Testnet (5042002)"],["Gas","~0.001 USDC"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                <span style={{color:"#57534e"}}>{k}</span><span style={{fontFamily:"'DM Mono',monospace",color:"#a8a29e"}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,color:"#fff",borderTop:"1px solid #292524",paddingTop:8,marginTop:6}}>
              <span>Total</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#c47d2a"}}>{fmt(total)}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,background:"#f5f3f0",border:"1px solid #e7e4e0",borderRadius:10,padding:"11px",fontSize:11,cursor:"pointer",color:"#78716c",letterSpacing:1.5,textTransform:"uppercase"}}>Cancel</button>
            <button onClick={pay} style={{flex:2,background:"#f97316",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase",boxShadow:"0 4px 14px rgba(249,115,22,0.35)"}}>Pay {fmt(total)}</button>
          </div>
        </>}
        {step==="signing"&&(
          <div style={{textAlign:"center",padding:"44px 0"}}>
            <div style={{fontSize:40,marginBottom:14,animation:"spin 1s linear infinite",display:"inline-block"}}>⚡</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#1c1917",marginBottom:6}}>Signing Transaction</h3>
            <p style={{fontSize:12,color:"#a8a29e"}}>Approve in your wallet</p>
            <p style={{fontSize:10,color:"#c47d2a",letterSpacing:1.5,textTransform:"uppercase",marginTop:6}}>Arc finality &lt;1 second</p>
          </div>
        )}
        {step==="success"&&(
          <div style={{textAlign:"center",padding:"34px 0"}}>
            <div style={{width:56,height:56,background:"#1c1917",borderRadius:"50%",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"#c47d2a"}}>✓</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"#1c1917",marginBottom:5}}>Payment Confirmed</h3>
            <p style={{fontSize:12,color:"#a8a29e",marginBottom:16}}>Settled on Arc Blockchain</p>
            {txHash&&<p style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:"#a8a29e",background:"#faf9f7",borderRadius:8,padding:"8px 12px",wordBreak:"break-all",marginBottom:16,border:"1px solid #f0ede8"}}>{txHash}</p>}
            <button onClick={onClose} style={{background:"#1c1917",color:"#fff",border:"none",borderRadius:10,padding:"11px 28px",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1.5,textTransform:"uppercase"}}>Continue Shopping</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── AI Agent Chat ────────────────────────────────────────────────────────── */
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
      return{success:true,added:p.name};
    }
    if(name==="remove_from_cart"){setCart(p=>p.filter(x=>x.id!==inp.productId));return{success:true};}
    if(name==="view_cart"){const c=cartRef.current;return{items:c.map(i=>({id:i.id,name:i.name,qty:i.qty,price:i.price})),total:c.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)};}
    if(name==="initiate_checkout"){setTimeout(()=>setCheckoutOpen(true),600);return{success:true};}
    return{error:"Unknown"};
  };

  const runAgent=async(apiMsgs)=>{
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
        system:"You are ArcWear's AI shopping agent. Help users find and purchase clothing via USDC on Arc blockchain. Always use tools to act. When recommending outfits, search and add multiple items. Summarise additions with USDC totals. Sections: men, women, children. Categories: shirts, trousers, belts, caps, shoes.",
        tools:AGENT_TOOLS,messages:apiMsgs})});
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
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1300,background:"rgba(0,0,0,0.2)"}}/>
      <div style={{position:"fixed",bottom:24,right:24,width:385,height:565,background:"#fff",borderRadius:20,boxShadow:"0 24px 72px rgba(0,0,0,0.2)",zIndex:1400,display:"flex",flexDirection:"column",overflow:"hidden",animation:"agentIn .35s cubic-bezier(.16,1,.3,1)",fontFamily:"'Jost',sans-serif"}}>
        {/* Header */}
        <div style={{background:"#1c1917",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{position:"relative"}}>
              <div style={{width:34,height:34,background:"linear-gradient(135deg,#c47d2a,#e8a849)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>◎</div>
              <div style={{position:"absolute",bottom:-1,right:-1,width:10,height:10,background:"#22c55e",borderRadius:"50%",border:"2px solid #1c1917"}}/>
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:0,lineHeight:1}}>ArcWear Agent</p>
              <p style={{fontSize:8,color:"#c47d2a",letterSpacing:1.5,textTransform:"uppercase",margin:"2px 0 0"}}>AI · USDC · Arc Blockchain</p>
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"#78716c",width:26,height:26,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {/* Tool ticker */}
        {tools.length>0&&(
          <div style={{background:"#faf9f7",borderBottom:"1px solid #f0ede8",padding:"5px 14px",display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
            <span style={{fontSize:8,color:"#c47d2a",fontWeight:700,animation:"pulse .8s infinite"}}>●</span>
            {tools.map((t,i)=><span key={i} style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:20,padding:"2px 9px",fontSize:8,color:"#92400e",letterSpacing:1,textTransform:"uppercase",fontWeight:700}}>⚡ {t.replace(/_/g," ")}</span>)}
          </div>
        )}
        {/* Messages */}
        <div style={{flex:1,overflowY:"scroll",padding:"13px 14px",display:"flex",flexDirection:"column",gap:10,scrollbarWidth:"thin",scrollbarColor:"#c8c0b5 #f5f3f0"}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {m.role==="assistant"&&<div style={{width:26,height:26,background:"linear-gradient(135deg,#c47d2a,#e8a849)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:800,flexShrink:0}}>◎</div>}
              <div style={{background:m.role==="user"?"#1c1917":"#faf9f7",color:m.role==="user"?"#fff":"#1c1917",border:m.role==="user"?"none":"1px solid #f0ede8",borderRadius:m.role==="user"?"16px 16px 4px 16px":"4px 16px 16px 16px",padding:"10px 13px",maxWidth:"80%",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                {m.text}
              </div>
              {m.role==="user"&&<div style={{width:26,height:26,background:"#e7e4e0",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#78716c",fontWeight:700,flexShrink:0}}>U</div>}
            </div>
          ))}
          {loading&&(
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{width:26,height:26,background:"linear-gradient(135deg,#c47d2a,#e8a849)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:800}}>◎</div>
              <div style={{background:"#faf9f7",border:"1px solid #f0ede8",borderRadius:"4px 16px 16px 16px",padding:"10px 14px",display:"flex",gap:5}}>
                {[0,1,2].map(i=><div key={i} style={{width:7,height:7,background:"#c47d2a",borderRadius:"50%",animation:`bounce 1.1s ${i*0.18}s infinite`}}/>)}
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        {/* Chips */}
        {msgs.length<=1&&(
          <div style={{padding:"0 13px 10px",display:"flex",flexWrap:"wrap",gap:5,flexShrink:0}}>
            {CHIPS.map((c,i)=><button key={i} onClick={()=>setInput(c)} style={{background:"#faf9f7",border:"1px solid #e7e4e0",borderRadius:20,padding:"4px 11px",fontSize:10,color:"#78716c",cursor:"pointer",fontFamily:"'Jost',sans-serif"}}>{c}</button>)}
          </div>
        )}
        {/* Input */}
        <div style={{padding:"9px 13px 14px",borderTop:"1px solid #f0ede8",display:"flex",gap:8,flexShrink:0}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about outfits, budgets, styles…"
            style={{flex:1,background:"#faf9f7",border:"1px solid #e7e4e0",borderRadius:10,padding:"9px 13px",fontSize:12,color:"#1c1917",outline:"none",fontFamily:"'Jost',sans-serif"}}
            onFocus={e=>e.target.style.borderColor="#c47d2a"} onBlur={e=>e.target.style.borderColor="#e7e4e0"}/>
          <button onClick={send} disabled={loading||!input.trim()} style={{background:loading||!input.trim()?"#e7e4e0":"#1c1917",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",fontSize:10,fontWeight:700,cursor:loading||!input.trim()?"not-allowed":"pointer",letterSpacing:1.2,textTransform:"uppercase"}}>
            {loading?"…":"Send"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Main App ─────────────────────────────────────────────────────────────── */
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
  const [editItem,setEditItem]  =useState(null);

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
    if(!window.ethereum){addToast("Install Rabby or MetaMask","error");return;}
    try{const a=await window.ethereum.request({method:"eth_requestAccounts"});setWallet(a[0]);addToast(`Connected: ${trunc(a[0])}`,"success");}
    catch{addToast("Connection cancelled","error");}
  };

  const addToCart=item=>{
    setCart(prev=>{const ex=prev.find(x=>x.id===item.id);if(ex)return prev.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x);return[...prev,{...item,qty:1}];});
    addToast(`${item.name} added`,"success");
  };

  const addToCartWithOptions=item=>{
    setCart(prev=>{const ex=prev.find(x=>x.id===item.id&&x.size===item.size&&x.color===item.color);if(ex)return prev.map(x=>x.id===item.id&&x.size===item.size&&x.color===item.color?{...x,qty:x.qty+item.qty}:x);return[...prev,item];});
    addToast(`${item.name} (${item.size}, ${item.color}) added`,"success");
    setEditItem(null);
  };

  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const sec=CATALOGUE[section];
  const cats=Object.entries(sec.categories);
  const displayCats=activeCat?cats.filter(([k])=>k===activeCat):cats;

  return(
    <div style={{minHeight:"100vh",background:"#fff",fontFamily:"'Jost',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Jost:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}
        @keyframes drawerIn{from{transform:translateX(100%)}to{transform:none}}
        @keyframes modalIn{from{transform:scale(.96);opacity:0}to{transform:none;opacity:1}}
        @keyframes agentIn{from{transform:scale(.94) translateY(16px);opacity:0}to{transform:none;opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.45)}60%{box-shadow:0 0 0 12px rgba(249,115,22,0)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#faf9f7}
        ::-webkit-scrollbar-thumb{background:#d4cfc8;border-radius:4px}
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{background:"#1c1917",padding:"6px 0",textAlign:"center"}}>
        <p style={{fontSize:11,color:"#fde68a",letterSpacing:0.5,fontFamily:"'Jost',sans-serif"}}>
          🎉 Free shipping on orders over 150 USDC · Pay with USDC on Arc Blockchain
        </p>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:"sticky",top:0,zIndex:900,
        background: scrolled?"rgba(255,255,255,0.97)":"#fff",
        backdropFilter: scrolled?"blur(12px)":"none",
        borderBottom:"1px solid #e7e4e0",
        boxShadow: scrolled?"0 2px 16px rgba(0,0,0,0.06)":"none",
        transition:"all .3s",
      }}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:36,height:36,background:"#1c1917",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:12,fontWeight:700,color:"#c47d2a",letterSpacing:0.5}}>AW</span>
            </div>
            <div>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"#1c1917",lineHeight:1,letterSpacing:0.5}}>ArcWear</p>
              <p style={{fontSize:7,color:"#c47d2a",fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginTop:1}}>Agentic · Arc Blockchain</p>
            </div>
          </div>

          {/* Section Tabs */}
          <div style={{display:"flex",gap:1,background:"#f5f3f0",borderRadius:10,padding:3}}>
            {["men","women","children"].map(k=>{
              const s=CATALOGUE[k];
              return(
                <button key={k} onClick={()=>{setSection(k);setActiveCat(null);}} style={{
                  background:section===k?"#fff":"transparent",
                  color:section===k?"#1c1917":"#78716c",
                  border:"none",cursor:"pointer",padding:"7px 16px",borderRadius:8,
                  fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:600,
                  boxShadow:section===k?"0 1px 8px rgba(0,0,0,0.08)":"none",
                  transition:"all .2s",display:"flex",alignItems:"center",gap:5,
                }}>
                  <span style={{fontSize:14}}>{s.icon}</span>{s.label}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {wallet?(
              <div style={{display:"flex",alignItems:"center",gap:5,background:"#faf9f7",border:"1px solid #e7e4e0",borderRadius:20,padding:"5px 10px"}}>
                <div style={{width:6,height:6,background:"#22c55e",borderRadius:"50%"}}/>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#c47d2a"}}>{trunc(wallet)}</span>
              </div>
            ):(
              <button onClick={connectWallet} style={{background:"#fff",color:"#1c1917",border:"1px solid #e7e4e0",borderRadius:20,padding:"7px 14px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Jost',sans-serif",display:"flex",alignItems:"center",gap:5,transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#c47d2a"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#e7e4e0"}>
                <span>◎</span> Connect Wallet
              </button>
            )}
            {/* CART with icon */}
            <button onClick={()=>setCartOpen(true)} style={{background:"#f97316",color:"#fff",border:"none",borderRadius:20,padding:"8px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Jost',sans-serif",display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 12px rgba(249,115,22,0.3)",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#ea6c0a";e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#f97316";e.currentTarget.style.transform="none";}}>
              🛒 Cart
              {cartCount>0&&<span style={{background:"#fff",color:"#f97316",borderRadius:"50%",width:18,height:18,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800}}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{background:"#1c1917",padding:"44px 24px 38px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 15% 50%, rgba(196,125,42,0.15) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(249,115,22,0.08) 0%, transparent 50%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1280,margin:"0 auto",position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:24}}>
            <div style={{maxWidth:520}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:7,background:"rgba(249,115,22,0.15)",border:"1px solid rgba(249,115,22,0.25)",borderRadius:20,padding:"4px 12px",marginBottom:14}}>
                <div style={{width:5,height:5,background:"#22c55e",borderRadius:"50%",animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:9,color:"#fb923c",fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>AI Agent · Live on Arc</span>
              </div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4vw,48px)",fontWeight:700,color:"#fff",lineHeight:1.15,marginBottom:10}}>
                Shop with ArcWear
              </h1>
              <p style={{fontSize:13,color:"#78716c",lineHeight:1.65,marginBottom:22}}>
                {sec.label}'s collection — shirts, trousers, belts, headwear & footwear · Pay with USDC on Arc Blockchain
              </p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={()=>setAgent(true)} style={{background:"#f97316",color:"#fff",border:"none",borderRadius:10,padding:"11px 22px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Jost',sans-serif",boxShadow:"0 6px 20px rgba(249,115,22,0.3)",display:"flex",alignItems:"center",gap:7,transition:"all .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  ◎ Shop with AI Agent
                </button>
                <button onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})} style={{color:"#d4cfc8",border:"1px solid #44403c",background:"transparent",borderRadius:10,padding:"11px 22px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Jost',sans-serif",transition:"all .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#78716c"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#44403c"}>
                  Browse Collection ↓
                </button>
              </div>
            </div>
            {/* Stats */}
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {[["5","Categories"],["25+","Products"],["USDC","Payment"],["Arc","Blockchain"]].map(([v,l])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#fff",lineHeight:1}}>{v}</p>
                  <p style={{fontSize:9,color:"#57534e",letterSpacing:1.5,textTransform:"uppercase",marginTop:3}}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <div style={{background:"#fff",borderBottom:"1px solid #e7e4e0",position:"sticky",top:64,zIndex:800}}>
        <div style={{maxWidth:1280,margin:"0 auto",padding:"0 24px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:6,overflowX:"auto",padding:"4px 0"}}>
            {[["all","All"],["shirts","Shirts"],["trousers","Trousers"],["belts","Belts"],["caps","Headwear"],["shoes","Footwear"]].map(([k,label])=>(
              <button key={k} onClick={()=>setActiveCat(k==="all"?null:k)}
                style={{background:(k==="all"&&!activeCat)||(activeCat===k)?"#1c1917":"#f5f3f0",color:(k==="all"&&!activeCat)||(activeCat===k)?"#fff":"#78716c",border:`1px solid ${(k==="all"&&!activeCat)||(activeCat===k)?"#1c1917":"#e7e4e0"}`,borderRadius:20,padding:"4px 14px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Jost',sans-serif",whiteSpace:"nowrap",transition:"all .15s"}}>
                {label}
              </button>
            ))}
          </div>
          <p style={{fontSize:11,color:"#a8a29e",flexShrink:0,marginLeft:12}}>
            {displayCats.reduce((s,[,c])=>s+c.items.length,0)} items
          </p>
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <main id="products" style={{maxWidth:1280,margin:"0 auto",padding:"24px 24px 80px"}}>
        {displayCats.map(([catKey,cat])=>(
          <section key={catKey} style={{marginBottom:40}}>
            {/* Section header */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:10,borderBottom:"2px solid #f5f3f0"}}>
              <span style={{fontSize:20}}>{cat.emoji}</span>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#1c1917"}}>{cat.label}</h2>
              <div style={{flex:1,height:1,background:"#f0ede8"}}/>
              <span style={{fontSize:11,color:"#a8a29e"}}>{cat.items.length} products</span>
            </div>
            {/* Jumia-style grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:1,border:"1px solid #e7e4e0",borderRadius:4,overflow:"hidden"}}>
              {cat.items.map(item=>(
                <ProductCard key={item.id} item={{...item,categoryLabel:cat.label}} onAdd={addToCart} onEdit={setEditItem} agentPick={false}/>
              ))}
            </div>
          </section>
        ))}

        {/* Arc Banner */}
        <div style={{background:"#1c1917",borderRadius:12,padding:"24px 28px",display:"flex",alignItems:"center",flexWrap:"wrap",gap:20,marginTop:8,border:"1px solid #292524"}}>
          <div style={{flex:1,minWidth:200}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#fff",marginBottom:5}}>Powered by Arc Blockchain</h3>
            <p style={{fontSize:11,color:"#57534e",lineHeight:1.7,margin:0}}>AI shopping agent · USDC stablecoin · Circle's Arc L1 · Sub-second settlement · Non-custodial</p>
          </div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {[["◎","AI Agent","Autonomous"],["⚡","<1s","Finality"],["$","USDC","Stablecoin"],["🔒","Non","Custodial"]].map(([ic,a,b])=>(
              <div key={b} style={{textAlign:"center"}}>
                <p style={{fontSize:18,marginBottom:4}}>{ic}</p>
                <p style={{fontSize:11,fontWeight:700,color:"#fff"}}>{a}</p>
                <p style={{fontSize:8,color:"#44403c",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── FLOATING BUTTONS ── */}
      {!agentOpen&&(
        <button onClick={()=>setAgent(true)} style={{position:"fixed",bottom:28,right:28,background:"#1c1917",color:"#fff",border:"2px solid #f97316",borderRadius:28,padding:"13px 20px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 8px 28px rgba(0,0,0,0.25)",zIndex:700,fontFamily:"'Jost',sans-serif",animation:"glow 3s ease-in-out infinite",transition:"transform .2s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}>
          <div style={{position:"relative",width:8,height:8}}>
            <div style={{width:8,height:8,background:"#22c55e",borderRadius:"50%"}}/>
            <div style={{position:"absolute",inset:0,background:"#22c55e",borderRadius:"50%",animation:"pulse 1.5s ease-out infinite",opacity:0.5}}/>
          </div>
          ◎ AI Agent
        </button>
      )}
      {scrolled&&(
        <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:28,left:28,background:"#fff",color:"#1c1917",border:"1px solid #e7e4e0",borderRadius:"50%",width:42,height:42,fontSize:16,cursor:"pointer",boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.15)"}
          onMouseLeave={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"}>↑</button>
      )}

      {/* Modals & Panels */}
      {editItem&&<EditModal item={editItem} onClose={()=>setEditItem(null)} onSave={addToCartWithOptions}/>}
      {cartOpen&&<CartDrawer cart={cart} onRemove={id=>setCart(p=>p.filter(x=>x.id!==id))} onCheckout={()=>{if(!wallet){connectWallet();return;}setCartOpen(false);setCheckout(true);}} onClose={()=>setCartOpen(false)} wallet={wallet}/>}
      {checkout&&<CheckoutModal cart={cart} wallet={wallet} onClose={()=>setCheckout(false)} onSuccess={()=>{setCart([]);setCheckout(false);}} addToast={addToast}/>}
      {agentOpen&&<AgentChat cart={cart} setCart={setCart} setActiveSection={setSection} setCheckoutOpen={setCheckout} addToast={addToast} onClose={()=>setAgent(false)}/>}

      <Toasts list={toasts}/>
    </div>
  );
}