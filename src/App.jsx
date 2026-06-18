import { useState, useRef, useEffect } from "react";
import useAllowance from "./hooks/useAllowance";
import ApprovalModal from "./components/ApprovalModal";
import ProductDetailPage from "./components/ProductDetailPage";
import { encodeMemoUSDC } from "./utils";

/* =========================================================
   ARCWEAR — Main Application
   Arc Blockchain · USDC Payments · AI Agent
   ========================================================= */

// ── Blockchain Config ──────────────────────────────────────
const ARC_CHAIN_ID = "0x4cef52";
const ARC_CHAIN_CONFIG = {
  chainId: ARC_CHAIN_ID,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const MERCHANT_ADDR = "0x627148dF4DE3b44Aa624e7592d3A47485777A6Bb";
const MEMO_ADDRESS = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";

// ── Helpers ───────────────────────────────────────────────
const fmt = (n) => `${Number(n).toFixed(2)} USDC`;
const trunc = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
const disc = (p, op) => Math.round(((op - p) / op) * 100);

/* =========================================================
   Product Catalogue
   ========================================================= */
const CATALOGUE = {
  men: {
    label: "Men", icon: "👔", categories: {
      shirts: {
        label: "Shirts & Tops", emoji: "👕", items: [
          { id: "m-s1", name: "Oxford Button-Down", price: 42, oldPrice: 58, desc: "Egyptian cotton, spread collar", img: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&q=80" },
          { id: "m-s2", name: "Linen Crew Tee", price: 28, oldPrice: 38, desc: "Stonewashed linen, relaxed fit", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80" },
          { id: "m-s3", name: "Flannel Overshirt", price: 65, oldPrice: 80, desc: "Brushed flannel, double chest pocket", img: "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?w=400&q=80" },
          { id: "m-s4", name: "Knit Polo Shirt", price: 48, oldPrice: 65, desc: "Fine knit cotton, ribbed collar & cuffs", img: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&q=80" },
          { id: "m-s5", name: "Denim Utility Shirt", price: 55, oldPrice: 75, desc: "Lightweight denim, double chest pockets", img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80" },
          { id: "m-s6", name: "Flannel Overshirt", price: 65, oldPrice: 80, desc: "Brushed flannel, double chest pocket", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80" },
          { id: "m-s7", name: "Knit Polo Shirt", price: 48, oldPrice: 65, desc: "Fine knit cotton, ribbed collar & cuffs", img: "https://images.unsplash.com/photo-1618886614638-80e3c103d31a?w=400&q=80" },
        ],
      },
      trousers: {
        label: "Trousers", emoji: "👖", items: [
          { id: "m-t1", name: "Slim Chino", price: 58, oldPrice: 75, desc: "Stretch cotton, tapered leg", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80" },
          { id: "m-t2", name: "Cargo Pants", price: 72, oldPrice: 90, desc: "Ripstop canvas, utility pockets", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&q=80" },
          { id: "m-t3", name: "Dress Trouser", price: 85, oldPrice: 105, desc: "Wool-blend, flat-front cut", img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80" },
          { id: "m-t4", name: "Tailored Corduroy", price: 78, oldPrice: 98, desc: "Fine-wale corduroy, comfortable stretch", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80" },
          { id: "m-t5", name: "Relaxed Linen Pants", price: 65, oldPrice: 85, desc: "Drawstring waist, breathable fabric", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=397&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D=80" },
          { id: "m-t6", name: "Dress Trouser", price: 85, oldPrice: 105, desc: "Wool-blend, flat-front cut", img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&q=80" },
          { id: "m-t7", name: "Tailored Corduroy", price: 78, oldPrice: 98, desc: "Fine-wale corduroy, comfortable stretch", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80" },
        ],
      },
      belts: {
        label: "Belts", emoji: "🪢", items: [
          { id: "m-b1", name: "Leather Classic", price: 35, oldPrice: 45, desc: "Full-grain Italian leather", img: "https://images.unsplash.com/photo-1752386268324-0533ffbfbc0e?fm=jpg&q=80&w=400" },
          { id: "m-b2", name: "Woven Canvas Belt", price: 22, oldPrice: 30, desc: "Military-style, brass buckle", img: "https://images.unsplash.com/photo-1666723043169-22e29545675c?q=80&w=400" },
          { id: "m-b3", name: "Suede Dress Belt", price: 38, oldPrice: 52, desc: "Genuine brushed suede, brushed steel buckle", img: "https://images.unsplash.com/photo-1664286074240-d7059e004dff?q=80&w=400" },
          { id: "m-b4", name: "Braided Leather Belt", price: 42, oldPrice: 55, desc: "Intricately hand-woven leather cords", img: "https://images.unsplash.com/photo-1705493655920-20c572928501?q=80&w=400" },
          { id: "m-b5", name: "Reversible Smooth Belt", price: 45, oldPrice: 60, desc: "Dual-sided black/brown sleek leather", img: "https://images.unsplash.com/photo-1549654929-e63d34779e41?q=80&w=400" },
          { id: "m-b6", name: "Suede Dress Belt", price: 38, oldPrice: 52, desc: "Genuine brushed suede, brushed steel buckle", img: "https://images.unsplash.com/photo-1664286022075-8e997e95bd17?q=80&w=400" },
          { id: "m-b7", name: "Braided Leather Belt", price: 42, oldPrice: 55, desc: "Intricately hand-woven leather cords", img: "https://images.unsplash.com/photo-1752386268324-0533ffbfbc0e?q=80&w=400" },
        ],
      },
      caps: {
        label: "Headwear", emoji: "🧢", items: [
          { id: "m-c1", name: "Snapback Cap", price: 25, oldPrice: 32, desc: "6-panel, structured brim", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80" },
          { id: "m-c2", name: "Bucket Hat", price: 20, oldPrice: 28, desc: "Waxed cotton, packable", img: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80" },
          { id: "m-c3", name: "Beanie Knit", price: 18, oldPrice: 25, desc: "Merino wool, ribbed cuff", img: "https://plus.unsplash.com/premium_photo-1671810380670-1cca53667f00?q=80&w=400" },
          { id: "m-c4", name: "Merino Wool Beanie", price: 24, oldPrice: 32, desc: "Ultra-soft merino, dynamic thermal weave", img: "https://plus.unsplash.com/premium_photo-1725914369015-e031be89c5cf?q=80&w=400" },
          { id: "m-c5", name: "Classic Cap", price: 45, oldPrice: 60, desc: "Stiff wool felt, leather band accent", img: "https://images.unsplash.com/photo-1466992133056-ae8de8e22809?q=80&w=400" },
          { id: "m-c6", name: " Turban", price: 18, oldPrice: 25, desc: "Indian Turban", img: "https://images.unsplash.com/photo-1762331236115-6b4165187de4?q=80&w=400" },
          { id: "m-c7", name: "Cowboy Hat", price: 24, oldPrice: 32, desc: "Black Cowboy Hat", img: "https://images.unsplash.com/photo-1768594362994-c95c01a34650?q=80&w=400" },
        ],
      },
      shoes: {
        label: "Footwear", emoji: "👟", items: [
          { id: "m-sh1", name: "White Leather Sneaker", price: 110, oldPrice: 140, desc: "Tumbled leather, cupsole", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80" },
          { id: "m-sh2", name: "Chelsea Boot", price: 145, oldPrice: 180, desc: "Suede upper, elastic gusset", img: "https://plus.unsplash.com/premium_photo-1729788891863-0d9b6f2b453b?q=80&w=400" },
          { id: "m-sh3", name: "Loafer ", price: 98, oldPrice: 120, desc: "Horsebit detail, leather lining", img: "https://images.unsplash.com/photo-1777987601447-266e128de448?q=80&w=400" },
          { id: "m-sh4", name: "Suede Desert Boot", price: 125, oldPrice: 160, desc: "Crepe sole, water-repellent suede upper", img: "https://images.unsplash.com/photo-1616688577198-0462bcecbdf9?q=80&w=400" },
          { id: "m-sh5", name: "Double Monk Strap", price: 135, oldPrice: 170, desc: "Burnished calfskin, silver buckle details", img: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&q=80" },
          { id: "m-sh6", name: "Sneakers", price: 98, oldPrice: 120, desc: "Horsebit detail, leather lining", img: "https://images.unsplash.com/photo-1622760807800-66cf1466fc08?q=80&w=400" },
          { id: "m-sh7", name: "Running Boot", price: 125, oldPrice: 160, desc: "Crepe sole, water-repellent suede upper", img: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?q=80&w=400" },
        ],
      },
    },
  },
  women: {
    label: "Women", icon: "👗", categories: {
      shirts: {
        label: "Tops & Blouses", emoji: "👚", items: [
          { id: "w-s1", name: "Silk Blouse", price: 68, oldPrice: 85, desc: "Mulberry silk, relaxed drape", img: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80" },
          { id: "w-s2", name: "Crop Cami", price: 32, oldPrice: 42, desc: "Ribbed modal, adjustable straps", img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80" },
          { id: "w-s3", name: "Wrap Cardigan", price: 55, oldPrice: 70, desc: "Cashmere blend, tie-waist", img: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80" },
          { id: "w-s4", name: "Linen V-Neck Blouse", price: 48, oldPrice: 65, desc: "Relaxed linen, shell button front", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80" },
          { id: "w-s5", name: "Off-Shoulder Ribbed Knit", price: 45, oldPrice: 60, desc: "Soft cotton-rib blend, long sleeves", img: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80" },
          { id: "w-s6", name: "Wrap Cardigan", price: 55, oldPrice: 70, desc: "Cashmere blend, tie-waist", img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80" },
          { id: "w-s7", name: "Linen V-Neck Blouse", price: 48, oldPrice: 65, desc: "Relaxed linen, shell button front", img: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=400&q=80" },
        ],
      },
      trousers: {
        label: "Bottoms", emoji: "👗", items: [
          { id: "w-t1", name: "High-Rise Flare", price: 75, oldPrice: 95, desc: "Stretch denim, wide flare hem", img: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=400&q=80" },
          { id: "w-t2", name: "Midi Skirt", price: 60, oldPrice: 78, desc: "Satin lining, A-line silhouette", img: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80" },
          { id: "w-t3", name: "Tailored Wide-Leg", price: 88, oldPrice: 110, desc: "Crepe fabric, pleat front", img: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80" },
          { id: "w-t4", name: "Paperbag Linen Shorts", price: 42, oldPrice: 58, desc: "Tie-waist belt, breezy linen fabric", img: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&q=80" },
          { id: "w-t5", name: "Pleated Tapered Trouser", price: 78, oldPrice: 98, desc: "High-waist front pleats, ankle crop", img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80" },
          { id: "w-t6", name: "Tailored Wide-Leg", price: 88, oldPrice: 110, desc: "Crepe fabric, pleat front", img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80" },
          { id: "w-t7", name: "Paperbag Linen Shorts", price: 42, oldPrice: 58, desc: "Tie-waist belt, breezy linen fabric", img: "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400&q=80" },
        ],
      },
      belts: {
        label: "Belts", emoji: "🪢", items: [
          { id: "w-b1", name: "Gold Chain Belt", price: 38, oldPrice: 50, desc: "Brass links, adjustable fit", img: "https://plus.unsplash.com/premium_photo-1737659254929-44685a35717b?q=80&w=400" },
          { id: "w-b2", name: "Louis Vuitton", price: 30, oldPrice: 40, desc: "Patent leather, pin buckle", img: "https://images.unsplash.com/photo-1585856331452-87ea5a04c21c?w=500&q=60" },
          { id: "w-b3", name: "Studded Suede Belt", price: 35, oldPrice: 48, desc: "Gold-tone studs, rich suede strap", img: "https://plus.unsplash.com/premium_photo-1724075829638-7a4d3f2eb235?q=80&w=400" },
          { id: "w-b4", name: "Wide Leather Waist Cinch", price: 48, oldPrice: 65, desc: "Premium smooth leather, statement buckle", img: "https://images.unsplash.com/photo-1574288443562-5ccb5bdb46d8?q=80&w=400" },
          { id: "w-b5", name: "Woven Raffia Belt", price: 26, oldPrice: 38, desc: "Natural straw weave, round wooden buckle", img: "https://images.unsplash.com/photo-1763673375520-c5562a39a2c5?q=80&w=400" },
          { id: "w-b6", name: "Studded Suede Belt", price: 35, oldPrice: 48, desc: "Gold-tone studs, rich suede strap", img: "https://images.unsplash.com/photo-1760040803892-913d1471a121?q=80&w=400" },
          { id: "w-b7", name: "Wide Leather Waist Cinch", price: 48, oldPrice: 65, desc: "Premium smooth leather, statement buckle", img: "https://images.unsplash.com/photo-1758505805266-3bd5f8fbd867?w=400" },
        ],
      },
      caps: {
        label: "Headwear", emoji: "🎩", items: [
          { id: "w-c1", name: "Wide Brim Sun Hat", price: 40, oldPrice: 52, desc: "Raffia weave, ribbon band", img: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80" },
          { id: "w-c2", name: "Classic Beret", price: 28, oldPrice: 36, desc: "Felted wool, French-style", img: "https://images.unsplash.com/photo-1693748160059-adf1a64c0873?q=80&w=400" },
          { id: "w-c3", name: "Beach Hat", price: 22, oldPrice: 30, desc: "Chunky knit, removable pom", img: "https://plus.unsplash.com/premium_photo-1693221161784-e6a735e8e4b4?q=80&w=400" },
          { id: "w-c4", name: "Fedora Hat", price: 32, oldPrice: 45, desc: "Warm angora blend, delicate cable knit", img: "https://images.unsplash.com/photo-1642170637760-f59a0b6d922d?q=80&w=400" },
          { id: "w-c5", name: "Polo cap", price: 52, oldPrice: 70, desc: "Sleek teardrop crown, raw-edge brim", img: "https://images.unsplash.com/photo-1777455163870-a846a5ca98af?w=400" },
          { id: "w-c6", name: "Knit Pom Beanie", price: 22, oldPrice: 30, desc: "Chunky knit, removable pom", img: "https://images.unsplash.com/photo-1745274811550-64b2289deea4?q=80&w=400" },
          { id: "w-c7", name: "", price: 32, oldPrice: 45, desc: "Warm angora blend, delicate cable knit", img: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=400" },
        ],
      },
      shoes: {
        label: "Footwear", emoji: "👠", items: [
          { id: "w-sh1", name: "Block Heel Mule", price: 120, oldPrice: 150, desc: "Suede upper, 7cm block heel", img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80" },
          { id: "w-sh2", name: "Platform Sneaker", price: 95, oldPrice: 120, desc: "Leather & canvas, 4cm platform", img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80" },
          { id: "w-sh3", name: "Kitten Heel Pump", price: 138, oldPrice: 170, desc: "Satin finish, pointed toe", img: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80" },
          { id: "w-sh4", name: "Pointed Toe Flat", price: 88, oldPrice: 110, desc: "Soft glove leather, cushioned insole", img: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400&q=80" },
          { id: "w-sh5", name: "Ankle Strap Sandal", price: 115, oldPrice: 145, desc: "Block heel, gold buckle closure", img: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80" },
          { id: "w-sh6", name: "Kitten Heel Pump", price: 138, oldPrice: 170, desc: "Satin finish, pointed toe", img: "https://plus.unsplash.com/premium_photo-1676234844384-82e1830af724?w=400&q=80" },
          { id: "w-sh7", name: "Pointed Toe Flat", price: 88, oldPrice: 110, desc: "Soft glove leather, cushioned insole", img: "https://images.unsplash.com/photo-1618274158638-41d9f8d9279d?w=400&q=80" },
        ],
      },
    },
  },
  children: {
    label: "Children", icon: "🧒", categories: {
      shirts: {
        label: "Tops & Tees", emoji: "👕", items: [
          { id: "k-s1", name: "Dino Print Tee", price: 18, oldPrice: 25, desc: "100% organic cotton, crew neck", img: "https://images.unsplash.com/photo-1622290291165-d341f1938b8a?q=80&w=400" },
          { id: "k-s2", name: "Rainbow Hoodie", price: 32, oldPrice: 42, desc: "Brushed fleece, kangaroo pocket", img: "https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=400&q=80" },
          { id: "k-s3", name: "Striped Long Sleeve", price: 22, oldPrice: 30, desc: "Soft jersey, ribbed cuffs", img: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80" },
          { id: "k-s4", name: "Flannel Plaid Shirt", price: 25, oldPrice: 35, desc: "Soft organic flannel, button-up front", img: "https://plus.unsplash.com/premium_photo-1675183689613-f28f2d39cb9b?q=80&w=400" },
          { id: "k-s5", name: "Embroidered Knit Top", price: 28, oldPrice: 38, desc: "Cute floral accents, scalloped collar", img: "https://plus.unsplash.com/premium_photo-1691367782367-2bd37f646abc?q=80&w=400" },
          { id: "k-s6", name: "Striped Long Sleeve", price: 22, oldPrice: 30, desc: "Soft jersey, ribbed cuffs", img: "https://plus.unsplash.com/premium_photo-1701984401543-4b635f3a03b5?q=80&w=400" },
          { id: "k-s7", name: "Flannel Plaid Shirt", price: 25, oldPrice: 35, desc: "Soft organic flannel, button-up front", img: "https://images.unsplash.com/photo-1764417846375-da86bd2603f8?q=80&w=400" },
        ],
      },
      trousers: {
        label: "Bottoms", emoji: "👖", items: [
          { id: "k-t1", name: "Elastic Joggers", price: 25, oldPrice: 32, desc: "French terry, elastic waist", img: "https://images.unsplash.com/photo-1616692994673-2feb09ac5770?q=80&w=400" },
          { id: "k-t2", name: "Denim Shortalls", price: 40, oldPrice: 52, desc: "Stretch denim, adjustable straps", img: "https://plus.unsplash.com/premium_photo-1673835711880-e672de68193b?w=400" },
          { id: "k-t3", name: "Cargo Shorts", price: 28, oldPrice: 36, desc: "Ripstop, velcro side pockets", img: "https://images.unsplash.com/photo-1607454317233-28962e07083a?w=400" },
          { id: "k-t4", name: "Corduroy Overall Dress", price: 35, oldPrice: 48, desc: "Adjustable straps, front pouch pocket", img: "https://images.unsplash.com/photo-1615962024321-f029aefe1f25?w=400" },
          { id: "k-t5", name: "Chino Work Shorts", price: 22, oldPrice: 30, desc: "Durable twill, elastic button adjusters", img: "https://images.unsplash.com/photo-1632232962967-0740a757380d?w=400" },
          { id: "k-t6", name: "Jump Suit", price: 28, oldPrice: 36, desc: "Ripstop, velcro side pockets", img: "https://plus.unsplash.com/premium_photo-1671736768698-67783d4200d6?w=400" },
          { id: "k-t7", name: "Corduroy Overall Dress", price: 35, oldPrice: 48, desc: "Adjustable straps, front pouch pocket", img: "https://images.unsplash.com/photo-1604482858862-1db908a653e4?w=400" },
        ],
      },
      belts: {
        label: "Belts", emoji: "🪢", items: [
          { id: "k-b1", name: "Cartoon Buckle Belt", price: 12, oldPrice: 18, desc: "Woven, fun character buckle", img: "https://images.unsplash.com/photo-1752386341161-de2b02ea1f50?w=400&q=80" },
          { id: "k-b2", name: "Glitter Elastic Belt", price: 14, oldPrice: 20, desc: "Sparkly elastic webbing, heart-shape clasp", img: "https://images.unsplash.com/photo-1711443982852-b3df5c563448?w=400&q=80" },
          { id: "k-b3", name: "Braided Cotton Belt", price: 15, oldPrice: 22, desc: "Colorful cotton cord, brass hardware", img: "https://images.unsplash.com/photo-1664286074176-5206ee5dc878?w=400&q=80" },
          { id: "k-b4", name: "Reversible Casual Belt", price: 16, oldPrice: 24, desc: "Two-tone webbed strap, steel buckle", img: "https://plus.unsplash.com/premium_photo-1723575737806-ecd7f74bf3a1?w=400&q=80" },
          { id: "k-b5", name: "Classic Toddler Suspenders", price: 18, oldPrice: 26, desc: "Y-back elastic strap, heavy-duty clips", img: "https://images.unsplash.com/photo-1717241424404-5331845a1107?w=400&q=80" },
          { id: "k-b6", name: "Black leather Suspenders", price: 15, oldPrice: 22, desc: "Colorful cotton cord, brass hardware", img: "https://images.unsplash.com/photo-1503327151497-be3b97ef0d42?w=400&q=80" },
          { id: "k-b7", name: "KungFu Belt", price: 16, oldPrice: 24, desc: "Two-tone webbed strap, steel buckle", img: "https://plus.unsplash.com/premium_photo-1667941272664-9146446e1b7b?w=400&q=80" },
        ],
      },
      caps: {
        label: "Headwear", emoji: "🧢", items: [
          { id: "k-c1", name: "Dino Baseball Cap", price: 15, oldPrice: 22, desc: "Cotton twill, embroidered dino", img: "https://images.unsplash.com/flagged/photo-1552840207-7b12058bfee4?w=400&q=80" },
          { id: "k-c2", name: "Sun Protection Hat", price: 20, oldPrice: 28, desc: "UPF 50+, wide brim", img: "https://images.unsplash.com/photo-1732041101188-eff6bfc65692?w=400&q=80" },
          { id: "k-c3", name: "Cozy Knit Ear Hat", price: 18, oldPrice: 25, desc: "Soft fleece lining, cute bear ear details", img: "https://plus.unsplash.com/premium_photo-1697183202193-a5037862b539?w=400&q=80" },
          { id: "k-c4", name: "Head Warmer", price: 16, oldPrice: 24, desc: "Open-top weave, velcro strap back", img: "https://images.unsplash.com/photo-1768399408789-3a5e1fac6166?q=80&w=400" },
          { id: "k-c5", name: "Waterproof Rain Hat", price: 22, oldPrice: 30, desc: "Wide brim, toggle drawstring chin strap", img: "https://images.unsplash.com/photo-1773176862337-17602cd46015?q=80&w=400" },
          { id: "k-c6", name: "Face cap", price: 18, oldPrice: 25, desc: "Soft fleece lining, cute bear ear details", img: "https://images.unsplash.com/photo-1616788474390-5c5d9db71a19?q=80&w=400" },
          { id: "k-c7", name: "Bucket Hat", price: 16, oldPrice: 24, desc: "Open-top weave, velcro strap back", img: "https://images.unsplash.com/photo-1775324588624-6bbe1092734d?q=80&w=400" },
        ],
      },
      shoes: {
        label: "Footwear", emoji: "👟", items: [
          { id: "k-sh1", name: "Light-Up Sneakers", price: 55, oldPrice: 70, desc: "LED outsole, velcro close", img: "https://images.unsplash.com/photo-1742390671647-bc9c5399fdf3?q=80&w=400" },
          { id: "k-sh2", name: "Velcro Sandals", price: 38, oldPrice: 50, desc: "Quick-dry, adjustable strap", img: "https://images.unsplash.com/photo-1625563206627-7e713d1ac0a8?q=80&w=400" },
          { id: "k-sh3", name: "Rain Boots", price: 42, oldPrice: 55, desc: "Natural rubber, easy-pull tab", img: "https://images.unsplash.com/photo-1571180202803-407624f64578?q=80&w=400" },
          { id: "k-sh4", name: "Canvas Slip-On Loafer", price: 35, oldPrice: 46, desc: "Breathable canvas upper, flexible outsole", img: "https://images.unsplash.com/photo-1764155161021-bab07b550c01?q=80&w=400" },
          { id: "k-sh5", name: "Classic High-Top Sneaker", price: 48, oldPrice: 62, desc: "Lace closure with side zipper for easy on/off", img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&q=80" },
          { id: "k-sh6", name: "Soft Sneakers", price: 42, oldPrice: 55, desc: "Natural rubber, easy-pull tab", img: "https://images.unsplash.com/photo-1631542245680-3bc3aeb813be?w=400&q=80" },
          { id: "k-sh7", name: "Rubber Sandals", price: 35, oldPrice: 46, desc: "Breathable canvas upper, flexible outsole", img: "https://plus.unsplash.com/premium_photo-1749544314937-e95c0200a250?q=80&w=400" },
        ],
      },
    },
  },
};

// Flatten catalogue into a searchable array
const ALL_PRODUCTS = [];
for (const [sk, sec] of Object.entries(CATALOGUE))
  for (const [ck, cat] of Object.entries(sec.categories))
    for (const item of cat.items)
      ALL_PRODUCTS.push({ ...item, section: sk, sectionLabel: sec.label, category: ck, categoryLabel: cat.label, emoji: cat.emoji });

/* =========================================================
   AI Agent Tool Definitions
   ========================================================= */
const AGENT_TOOLS = [
  {
    name: "search_products",
    description: "Search catalogue by section, category, price or keywords.",
    input_schema: {
      type: "object",
      properties: {
        section: { type: "string", enum: ["men", "women", "children", "all"] },
        category: { anyOf: [{ type: "string" }, { type: "null" }] },
        maxPrice: { anyOf: [{ type: "number" }, { type: "null" }] },
        minPrice: { anyOf: [{ type: "number" }, { type: "null" }] },
        keywords: { anyOf: [{ type: "string" }, { type: "null" }], description: "Keywords to search in name or description (e.g. 'oxford button-down')" },
      },
    },
  },
  {
    name: "add_to_cart",
    description: "Add product to cart by ID.",
    input_schema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string" },
        quantity: { anyOf: [{ type: "number" }, { type: "null" }] },
      },
    },
  },
  {
    name: "view_cart",
    description: "View cart contents and total.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "remove_from_cart",
    description: "Remove a product from the cart.",
    input_schema: {
      type: "object",
      required: ["productId"],
      properties: { productId: { type: "string" } },
    },
  },
  {
    name: "initiate_checkout",
    description: "Open the standard USDC checkout flow on Arc (requires wallet popup).",
    input_schema: { type: "object", properties: {} },
  },
  // ── Autonomous Agent Tools ──
  {
    name: "check_allowance",
    description: "Check if user has pre-approved USDC spending for the agent. Returns remaining allowance in USDC. Call this before attempting agent_checkout.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "request_approval",
    description: "Ask user to approve a USDC spending allowance so the agent can purchase without wallet popups. Use when allowance is 0 or insufficient for the cart total.",
    input_schema: {
      type: "object",
      required: ["amount"],
      properties: {
        amount: { type: "number", description: "USDC amount to request approval for (e.g. 500)" },
      },
    },
  },
  {
    name: "agent_checkout",
    description: "Execute checkout using the pre-approved USDC allowance — INSTANT, NO wallet popup needed. Only use when check_allowance shows sufficient allowance.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_reorder",
    description: "Set up automatic reorder for a product at a regular interval. User will get a confirmation notification before each reorder executes.",
    input_schema: {
      type: "object",
      required: ["productId", "intervalDays"],
      properties: {
        productId: { type: "string" },
        intervalDays: { type: "number", description: "Days between reorders" },
        maxPrice: { anyOf: [{ type: "number" }, { type: "null" }], description: "Max price guard — agent won't reorder if price exceeds this" },
      },
    },
  },
  {
    name: "add_to_wishlist",
    description: "Add a product to the user's wishlist by ID.",
    input_schema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string" },
      },
    },
  },
  {
    name: "remove_from_wishlist",
    description: "Remove a product from the user's wishlist by ID.",
    input_schema: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: { type: "string" },
      },
    },
  },
  {
    name: "view_wishlist",
    description: "View the user's wishlist contents.",
    input_schema: { type: "object", properties: {} },
  },
];

/* =========================================================
   LogoImage
   ========================================================= */
function LogoImage() {
  const [err, setErr] = useState(false);

  if (err) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 36, height: 36,
          background: "#1c1917", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#c47d2a", letterSpacing: 1 }}>AW</span>
        </div>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 700, color: "#1c1917", letterSpacing: 0.5 }}>
          ArcWear
        </span>
      </div>
    );
  }

  return (
    <img
      src="/arcc.png"
      alt="ArcWear"
      style={{ height: "44px", width: "auto", objectFit: "contain", maxWidth: 160 }}
      onError={() => setErr(true)}
    />
  );
}

/* =========================================================
   Toasts
   ========================================================= */
function Toasts({ list }) {
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
      alignItems: "center", pointerEvents: "none",
    }}>
      {list.map(t => (
        <div
          key={t.id}
          className={`toast toast--${t.type === "agent" ? "agent" : t.type === "error" ? "error" : "success"}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   EditModal — item options (size, colour, qty) before adding
   ========================================================= */
function EditModal({ item, onClose, onSave }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("M");
  const [color, setColor] = useState("Default");
  const [added, setAdded] = useState(false);

  const handleSave = (e) => {
    setAdded(true);
    setTimeout(() => onSave({ ...item, qty, size, color }, e), 600);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.55)", zIndex: 3000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        width: 440, maxWidth: "100%", overflow: "hidden",
        boxShadow: "var(--shadow-xl)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px", borderBottom: "1px solid #f0ede8",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", background: "#f5f3f0", flexShrink: 0 }}>
            <img
              src={item.img} alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => e.target.style.display = "none"}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#1c1917", margin: 0, lineHeight: 1.3 }}>{item.name}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "#c47d2a", margin: "4px 0 0" }}>{fmt(item.price)}</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px" }}>
          {/* Size */}
          <div style={{ marginBottom: 16 }}>
            <span className="label">Size</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
                <button
                  key={s}
                  className={`option-btn${size === s ? " active" : ""}`}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colour */}
          <div style={{ marginBottom: 16 }}>
            <span className="label">Colour</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Default", "Black", "White", "Navy", "Grey", "Beige"].map(c => (
                <button
                  key={c}
                  className={`option-btn${color === c ? " active" : ""}`}
                  onClick={() => setColor(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: 20 }}>
            <span className="label">Quantity</span>
            <div className="qty-stepper">
              <button className="qty-stepper__btn" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span className="qty-stepper__value" aria-live="polite">{qty}</span>
              <button className="qty-stepper__btn" onClick={() => setQty(q => q + 1)} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button
            onClick={handleSave}
            style={{
              width: "100%",
              background: added ? "hsl(158, 65%, 38%)" : "#1c1917",
              color: "#fff", border: "none", borderRadius: 10,
              padding: "13px", fontSize: 14, fontWeight: 700,
              cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase",
              transition: "all .25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: added ? "scale(0.96)" : "scale(1)",
            }}
          >
            {added ? "✓ Added to Cart!" : `Add to Cart — ${fmt(item.price * qty)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ProductCard
   ========================================================= */
function ProductCard({ item, onAdd, onEdit, onViewDetail, agentPick, wishlist = [], onToggleWishlist }) {
  const [imgErr, setImgErr] = useState(false);
  const isWishlisted = wishlist.includes(item.id);
  const [added, setAdded] = useState(false);
  const pct = disc(item.price, item.oldPrice);

  const handleAdd = (e) => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    onAdd(item, e);
  };

  return (
    <div className="product-card" data-product-id={item.id}>
      {/* Sale badge */}
      <div className="badge badge-sale" style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
        -{pct}%
      </div>

      {/* Wishlist */}
      <button
        className="wishlist-btn"
        onClick={(e) => { e.stopPropagation(); onToggleWishlist(item); }}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
      >
        {isWishlisted ? "❤️" : "🤍"}
      </button>

      {/* AI Pick badge */}
      {agentPick && (
        <div className="badge badge-ai" style={{ position: "absolute", top: 40, left: 8, zIndex: 2 }}>
          AI Pick
        </div>
      )}

      {/* Image — click opens detail page */}
      <div
        className="product-img"
        style={{ position: "relative", cursor: "pointer" }}
        onClick={() => onViewDetail(item)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${item.name}`}
        onKeyDown={e => e.key === "Enter" && onViewDetail(item)}
      >
        {!imgErr ? (
          <img
            src={item.img}
            alt={item.name}
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .4s" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        ) : (
          <span style={{ fontSize: 52 }}>{item.emoji || "👕"}</span>
        )}
        {/* Hover overlay — View Details */}
        <button
          className="view-detail-btn"
          onClick={e => { e.stopPropagation(); onViewDetail(item); }}
          aria-label={`View details for ${item.name}`}
          tabIndex={-1}
        >
          🔍 View Details
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <p
          style={{ fontSize: 15, fontWeight: 500, color: "#1c1917", margin: "0 0 4px", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
          onClick={() => onViewDetail(item)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === "Enter" && onViewDetail(item)}
        >
          {item.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#c41e3a" }}>
            {fmt(item.price)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#a8a29e", textDecoration: "line-through" }}>
            {fmt(item.oldPrice)}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleAdd}
            className="add-btn"
            style={{
              flex: 1,
              background: added ? "hsl(158, 65%, 38%)" : "#f97316",
              color: "#fff", border: "none", borderRadius: 4,
              padding: "8px 0", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textTransform: "uppercase",
              transition: "all .25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: added ? "scale(1.05)" : "scale(1)",
            }}
          >
            {added ? "✓ Added!" : "Add to Cart"}
          </button>
          <button
            onClick={() => onEdit(item)}
            aria-label="Edit options"
            title="Edit options"
            style={{
              width: 36, background: "#f5f3f0",
              border: "1px solid #e7e4e0", borderRadius: 4,
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
            }}
          >
            ✏️
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CartDrawer
   ========================================================= */
function CartDrawer({ cart, onRemove, onCheckout, onClose, wallet }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      <div className="backdrop" onClick={onClose} aria-label="Close cart" />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        style={{
          position: "fixed", top: 0, right: 0, height: "100%",
          background: "#fff", zIndex: 1200,
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          animation: "drawerIn .28s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #f0ede8" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1c1917", margin: 0 }}>Your Cart</h2>
            <p style={{ fontSize: 13, color: "#a8a29e", margin: "3px 0 0" }}>
              {cart.reduce((s, i) => s + i.qty, 0)} items
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <p style={{ fontSize: 48, marginBottom: 10, opacity: 0.2 }}>🛒</p>
              <p style={{ fontSize: 15, color: "#a8a29e" }}>Your cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id + item.size + item.color} className="cart-item">
              <div className="cart-item__thumb">
                <img
                  src={item.img} alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => e.target.style.display = "none"}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#1c1917", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </p>
                <p style={{ fontSize: 13, color: "#a8a29e", margin: "2px 0 0" }}>
                  Qty {item.qty}{item.size ? ` · ${item.size}` : ""}{item.color && item.color !== "Default" ? ` · ${item.color}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "#1c1917", margin: 0 }}>
                  {fmt(item.price * item.qty)}
                </p>
                <button
                  onClick={() => onRemove(item.id)}
                  style={{ background: "none", border: "none", color: "#a8a29e", cursor: "pointer", fontSize: 12, marginTop: 4, padding: 0, textDecoration: "underline" }}
                >
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: "14px 20px 22px", borderTop: "1px solid #f0ede8" }}>
            {[["Subtotal", fmt(total)], ["Gas (USDC)", "~0.001"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#a8a29e", marginBottom: 4 }}>
                <span>{k}</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, fontWeight: 700, color: "#1c1917", borderTop: "1px solid #f0ede8", paddingTop: 10, marginTop: 6, marginBottom: 14 }}>
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 16 }}>{fmt(total)}</span>
            </div>

            {/* Arc info pill */}
            <div className="arc-block" style={{ marginBottom: 12 }}>
              <div className="arc-block__icon">◎</div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#c47d2a", letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>Arc Blockchain · USDC</p>
                <p style={{ fontSize: 11, color: "#57534e", margin: "2px 0 0" }}>Sub-second finality · Circle L1</p>
              </div>
            </div>

            <button
              onClick={onCheckout}
              style={{
                width: "100%", background: "#f97316", color: "#fff",
                border: "none", borderRadius: 10, padding: "13px",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                letterSpacing: 1.5, textTransform: "uppercase",
              }}
            >
              {wallet ? "Pay with USDC on Arc →" : "Connect Wallet to Pay →"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

const generateTempTxHash = () => "pending_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

/* =========================================================
   CheckoutModal
   ========================================================= */
function CheckoutModal({ cart, wallet, onClose, onSuccess, onTxSent, onTxHashUpdated, addToast }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const [step, setStep] = useState("review");
  const [txHash, setTxHash] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const pay = async () => {
    if (!window.ethereum) { addToast("No wallet detected", "error"); return; }
    setStep("signing");

    // Initialize the order as pending immediately on click!
    let orderId = createdOrderId;
    if (!orderId) {
      const tempTxHash = generateTempTxHash();
      if (onTxSent) {
        const saved = await onTxSent(tempTxHash);
        if (saved && saved.id) {
          orderId = saved.id;
          setCreatedOrderId(saved.id);
        }
      }
    }

    try {
      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      if (currentChain !== ARC_CHAIN_ID) {
        try {
          await window.ethereum.request({ method: "wallet_addEthereumChain", params: [ARC_CHAIN_CONFIG] });
        } catch {
          try {
            await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_CHAIN_ID }] });
          } catch (se) {
            addToast(se.code === 4001 ? "Please approve the network switch" : "Add Arc Testnet manually", "error");
            setStep("review");
            return;
          }
        }
      }

      // 1. Get ERC20 USDC balance for payment
      const cleanAddress = wallet.toLowerCase().replace("0x", "");
      const balanceOfData = "0x70a08231" + cleanAddress.padStart(64, "0");
      const erc20Hex = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: USDC_ADDRESS, data: balanceOfData }, "latest"],
      });
      const balance = parseInt(erc20Hex, 16) / 1e6;

      if (balance < total) {
        addToast(`Insufficient USDC balance. You need ${fmt(total)} but only have ${fmt(balance)}.`, "error");
        setStep("review");
        return;
      }

      // 2. Get native USDC balance for gas check
      const nativeHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [wallet, "latest"],
      });
      const nativeBalance = parseInt(nativeHex, 16) / 1e18;
      if (nativeBalance < 0.0001) {
        addToast("Insufficient native balance for gas. Please get some testnet USDC for gas.", "error");
        setStep("review");
        return;
      }

      // Wrap the transfer in a Memo transaction carrying the order ID
      const data = encodeMemoUSDC(MERCHANT_ADDR, total, orderId || "00000000000000000000000000000000");
      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: MEMO_ADDRESS, data, gas: "0x30D40" }],
      });

      setTxHash(hash);
      setStep("confirming");
      
      // Update the order in the database with the real txHash!
      if (onTxHashUpdated && orderId) {
        onTxHashUpdated(orderId, hash);
      }

      // 3. Wait for transaction to be mined
      const waitForTransactionReceipt = async (txHash) => {
        for (let i = 0; i < 30; i++) {
          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });
          if (receipt) return receipt;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        throw new Error("Transaction receipt timeout. Please check ArcScan.");
      };

      const receipt = await waitForTransactionReceipt(hash);
      if (receipt.status !== "0x1") {
        throw new Error("Transaction failed on-chain. Please verify your balance and try again.");
      }

      setStep("success");
      onSuccess();
      addToast("Payment confirmed on Arc!", "success");

      if (customerEmail) {
        try {
          const emailRes = await fetch("/api/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerEmail, customerWallet: wallet, items: cart, total, txHash: hash }),
          });
          const emailData = await emailRes.json();
          if (emailRes.ok && emailData.success) {
            addToast("📧 Confirmation email sent!", "success");
          } else {
            console.error("Email error:", emailData);
            addToast("Email failed: " + (emailData?.error?.message || JSON.stringify(emailData?.error) || "Unknown error"), "error");
          }
        } catch (e) {
          console.error("Email confirmation error:", e);
          addToast("Email could not be sent: " + e.message, "error");
        }
      } else {
        addToast("No email entered — skipping confirmation", "success");
      }
    } catch (err) {
      const msg = err.code === 4001 || err.message?.includes("denied")
        ? "Transaction cancelled"
        : "Error: " + (err.message || "Unknown");
      addToast(msg, "error");
      setStep("review");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.65)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, backdropFilter: "blur(4px)",
    }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        style={{
          background: "#fff", borderRadius: 16,
          width: 460, maxWidth: "100%", padding: 28,
          position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Close checkout"
          style={{ position: "absolute", top: 12, right: 12 }}
        >
          ✕
        </button>

        {/* ── Review step ── */}
        {step === "review" && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", margin: "0 0 3px" }}>Order Summary</h2>
            <p style={{ fontSize: 13, color: "#a8a29e", margin: "0 0 14px" }}>Review before paying with USDC on Arc</p>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="checkout-email" className="label">📧 Email for confirmation</label>
              <input
                id="checkout-email"
                type="email"
                className="input"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>

            {/* Item list */}
            <div style={{ background: "#faf9f7", borderRadius: 10, border: "1px solid #f0ede8", marginBottom: 16, maxHeight: 140, overflowY: "auto" }}>
              {cart.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: "1px solid #f0ede8", fontSize: 15, color: "#1c1917" }}>
                  <span>{i.name} <span style={{ color: "#a8a29e" }}>×{i.qty}</span></span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            {/* Payment details */}
            <div style={{ background: "#1c1917", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, background: "#c47d2a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff", fontWeight: 800, flexShrink: 0 }}>◎</div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Arc Blockchain · USDC</p>
                  <p style={{ fontSize: 11, color: "#57534e", letterSpacing: 1.2, textTransform: "uppercase", margin: "2px 0 0" }}>Circle L1 · Rabby & MetaMask</p>
                </div>
              </div>
              {[["Wallet", trunc(wallet) || "Not connected"], ["Network", "Arc Testnet (5042002)"], ["Gas", "~0.001 USDC"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span style={{ color: "#57534e" }}>{k}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#a8a29e" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, color: "#fff", borderTop: "1px solid #292524", paddingTop: 8, marginTop: 6 }}>
                <span>Total</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "#c47d2a" }}>{fmt(total)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, background: "#f5f3f0", border: "1px solid #e7e4e0", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", color: "#78716c", letterSpacing: 1.5, textTransform: "uppercase" }}
              >
                Cancel
              </button>
              <button
                onClick={pay}
                style={{ flex: 2, background: "#f97316", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
              >
                Pay {fmt(total)}
              </button>
            </div>
          </>
        )}

        {/* ── Signing step ── */}
        {step === "signing" && (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <img
              src="/arc-logo-signing.jpg"
              alt="Signing Transaction"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                marginBottom: 14,
                animation: "spin 1.5s linear infinite",
                display: "inline-block",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "2px solid #e7e4e0",
              }}
            />
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>Signing Transaction</h3>
            <p style={{ fontSize: 14, color: "#a8a29e" }}>Approve in your wallet</p>
            <p style={{ fontSize: 12, color: "#c47d2a", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>Arc finality &lt;1 second</p>
          </div>
        )}

        {/* ── Confirming step ── */}
        {step === "confirming" && (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 14, animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>Confirming Payment</h3>
            <p style={{ fontSize: 14, color: "#a8a29e" }}>Waiting for block finalization on Arc...</p>
            {txHash && (
              <div style={{ marginTop: 12 }}>
                <a
                  href={`${ARC_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "#f97316", textDecoration: "underline" }}
                >
                  View on ArcScan ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Success step ── */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "34px 0" }}>
            <div style={{ width: 56, height: 56, background: "#1c1917", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#c47d2a" }}>✓</div>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: "#1c1917", marginBottom: 5 }}>Payment Confirmed</h3>
            <p style={{ fontSize: 14, color: "#a8a29e", marginBottom: 16 }}>Settled on Arc Blockchain</p>
            {txHash && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#78716c", margin: "0 0 6px" }}>Transaction Hash:</p>
                <a
                  href={`${ARC_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    color: "#f97316",
                    background: "#faf9f7",
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "block",
                    wordBreak: "break-all",
                    border: "1px solid #f0ede8",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  {txHash} ↗
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              style={{ background: "#1c1917", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   AgentChat — AI shopping assistant panel
   ========================================================= */
function AgentChat({ cart, setCart, setActiveSection, setCheckoutOpen, addToast, onClose, wallet, allowance, onRequestApproval, onRefreshAllowance, onSaveOrder, wishlist, onToggleWishlist }) {
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    text: "Hi! I'm your ArcWear AI agent 👋\n\nTell me what you're looking for — an outfit, a budget, an occasion — and I'll search, add items to your cart, and handle USDC checkout on Arc." + (allowance > 0 ? `\n\n🔓 Agent mode active — ${allowance.toFixed(2)} USDC remaining allowance.` : ""),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState([]);
  const cartRef = useRef(cart);
  const wishlistRef = useRef(wishlist);
  const bottomRef = useRef(null);
  const waitingForApproval = useRef(false);

  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { wishlistRef.current = wishlist; }, [wishlist]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  // Auto-resume agent checkout when allowance is approved
  useEffect(() => {
    const totalAmount = cartRef.current.reduce((s, i) => s + i.price * i.qty, 0);
    if (waitingForApproval.current && allowance >= totalAmount && totalAmount > 0 && !loading) {
      waitingForApproval.current = false;
      
      const triggerAutoCheckout = async () => {
        setLoading(true);
        const autoText = "Approved! Proceeding with checkout.";
        setMsgs(p => [...p, { role: "user", text: autoText }]);

        const c = cartRef.current;
        try {
          addToast("🤖 Agent executing purchase...", "agent");
          const res = await fetch("/api/agent-pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userWallet: wallet,
              items: c.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
              total: totalAmount,
            }),
          });
          const data = await res.json();
          if (!res.ok || data.error) {
            const errMsg = data.error || data.message || "Agent payment failed";
            setMsgs(p => [...p, {
              role: "assistant",
              text: `Sorry, the autonomous checkout failed: ${errMsg}. Please try again.`
            }]);
            addToast(`❌ Agent purchase failed: ${errMsg}`, "error");
          } else {
            if (onSaveOrder) {
              onSaveOrder(data.txHash, totalAmount, c, {
                jobId: data.jobId,
                escrowStatus: data.escrowStatus || "completed",
                escrow: data.escrow
              });
            }
            setCart([]);
            if (onRefreshAllowance) setTimeout(onRefreshAllowance, 2000);
            
            const successMsg = `✓ Purchase confirmed! I've autonomously executed the transaction via the escrow contract.

Ordered: ${c.map(i => `${i.name} (x${i.qty})`).join(", ")}
Total: ${totalAmount.toFixed(2)} USDC
Transaction Hash: ${data.txHash} ${data.jobId ? `(Escrow Job #${data.jobId})` : ""}`;
            
            setMsgs(p => [...p, {
              role: "assistant",
              text: successMsg
            }]);
            addToast(`✓ Agent purchased ${c.length} items for ${totalAmount.toFixed(2)} USDC!`, "success");
          }
        } catch (err) {
          const errMsg = err.message || "Unknown network error";
          setMsgs(p => [...p, {
            role: "assistant",
            text: `Sorry, I ran into a request failure: ${errMsg}. Please try again.`
          }]);
        }
        setLoading(false);
      };

      triggerAutoCheckout();
    }
  }, [allowance, loading, msgs]);

  // Execute a tool call locally
  const exec = async (name, inp) => {
    if (name === "search_products") {
      let r = [...ALL_PRODUCTS];
      if (inp.section && inp.section !== "all") r = r.filter(p => p.section === inp.section);
      if (inp.category) {
        const catQuery = String(inp.category).toLowerCase().trim();
        r = r.filter(p =>
          p.category.toLowerCase().includes(catQuery) ||
          catQuery.includes(p.category.toLowerCase()) ||
          p.categoryLabel.toLowerCase().includes(catQuery) ||
          catQuery.includes(p.categoryLabel.toLowerCase())
        );
      }
      if (inp.maxPrice) r = r.filter(p => p.price <= inp.maxPrice);
      if (inp.minPrice) r = r.filter(p => p.price >= inp.minPrice);
      if (inp.keywords) {
        const query = (typeof inp.keywords === "string" ? inp.keywords : inp.keywords.join(" "))
          .toLowerCase()
          .replace(/\b(men|man|women|woman|children|child|kid|kids|wear|wears|clothes|clothing)\b/g, "")
          .trim();
        if (query) {
          const terms = query.split(/\s+/).filter(Boolean);
          r = r.filter(p => {
            const nameLower = p.name.toLowerCase();
            const descLower = (p.desc || "").toLowerCase();
            const catLower = p.categoryLabel.toLowerCase();
            return terms.every(term => nameLower.includes(term) || descLower.includes(term) || catLower.includes(term));
          });
        }
      }
      return { found: r.length, products: r.map(p => ({ id: p.id, name: p.name, price: p.price, section: p.sectionLabel, category: p.categoryLabel })) };
    }
    if (name === "add_to_cart") {
      let p = ALL_PRODUCTS.find(x => x.id === inp.productId);
      if (!p) {
        p = ALL_PRODUCTS.find(x => x.name.toLowerCase() === inp.productId.toLowerCase());
      }
      if (!p) return { error: "Product not found" };
      const qty = inp.quantity || 1;
      let newCart;
      const ex = cartRef.current.find(x => x.id === p.id);
      if (ex) {
        newCart = cartRef.current.map(x => x.id === p.id ? { ...x, qty: x.qty + qty } : x);
      } else {
        newCart = [...cartRef.current, { ...p, qty }];
      }
      cartRef.current = newCart;
      setCart(newCart);
      setActiveSection(p.section);
      addToast(`✓ Agent added ${p.name}`, "agent");
      return { success: true, added: p.name };
    }
    if (name === "remove_from_cart") {
      let p = ALL_PRODUCTS.find(x => x.id === inp.productId);
      if (!p) {
        p = ALL_PRODUCTS.find(x => x.name.toLowerCase() === inp.productId.toLowerCase());
      }
      const pId = p ? p.id : inp.productId;
      const newCart = cartRef.current.filter(x => x.id !== pId);
      cartRef.current = newCart;
      setCart(newCart);
      return { success: true };
    }
    if (name === "view_cart") {
      const c = cartRef.current;
      return {
        items: c.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        total: c.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2),
      };
    }
    if (name === "initiate_checkout") {
      setTimeout(() => setCheckoutOpen(true), 600);
      return { success: true };
    }
    // ── Autonomous tool handlers ──
    if (name === "check_allowance") {
      return {
        allowance: allowance?.toFixed(2) || "0.00",
        isApproved: (allowance || 0) > 0,
        agentWallet: "0xb73d...c1e4",
        message: allowance > 0
          ? `User has approved ${allowance.toFixed(2)} USDC for agent spending.`
          : "No allowance set. Use request_approval to ask user to enable agent mode.",
      };
    }
    if (name === "request_approval") {
      waitingForApproval.current = true;
      if (onRequestApproval) onRequestApproval(inp.amount || 500);
      return {
        success: true,
        message: `Approval modal shown to user for ${inp.amount || 500} USDC. Wait for user to confirm in their wallet.`,
      };
    }
    if (name === "agent_checkout") {
      const c = cartRef.current;
      const total = c.reduce((s, i) => s + i.price * i.qty, 0);
      if (c.length === 0) return { error: "Cart is empty" };
      if (!wallet) return { error: "No wallet connected. Ask user to connect wallet first." };
      if ((allowance || 0) < total) {
        return {
          error: "INSUFFICIENT_ALLOWANCE",
          message: `Need ${total.toFixed(2)} USDC but only ${(allowance || 0).toFixed(2)} approved. Use request_approval to ask for more.`,
        };
      }
      // Call the agent-pay backend
      try {
        addToast("🤖 Agent executing purchase...", "agent");
        const res = await fetch("/api/agent-pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userWallet: wallet,
            items: c.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
            total,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          return { error: data.error || data.message || "Agent payment failed" };
        }
        // Success — clear cart and refresh allowance
        if (onSaveOrder) onSaveOrder(data.txHash, total, c, { jobId: data.jobId, escrowStatus: data.escrowStatus || "completed", escrow: data.escrow });
        setCart([]);
        if (onRefreshAllowance) setTimeout(onRefreshAllowance, 2000);
        addToast(`✓ Agent purchased ${c.length} items for ${total.toFixed(2)} USDC!`, "success");
        return {
          success: true,
          txHash: data.txHash,
          total: total.toFixed(2),
          message: `Purchase complete! ${c.length} items for ${total.toFixed(2)} USDC. Tx: ${data.txHash}`,
        };
      } catch (err) {
        return { error: "Agent payment request failed: " + (err.message || "Unknown error") };
      }
    }
    if (name === "create_reorder") {
      const p = ALL_PRODUCTS.find(x => x.id === inp.productId);
      if (!p) return { error: "Product not found" };
      // Store reorder in localStorage for MVP
      const reorders = JSON.parse(localStorage.getItem("arcwear_reorders") || "[]");
      const newReorder = {
        id: Date.now().toString(),
        productId: p.id,
        productName: p.name,
        price: p.price,
        intervalDays: inp.intervalDays,
        maxPrice: inp.maxPrice || p.price * 1.2,
        createdAt: new Date().toISOString(),
        nextOrder: new Date(Date.now() + inp.intervalDays * 86400000).toISOString(),
        active: true,
      };
      reorders.push(newReorder);
      localStorage.setItem("arcwear_reorders", JSON.stringify(reorders));
      addToast(`🔁 Auto-reorder set: ${p.name} every ${inp.intervalDays} days`, "agent");
      return {
        success: true,
        reorder: newReorder,
        message: `Reorder created! ${p.name} will be reordered every ${inp.intervalDays} days. You'll receive a confirmation before each purchase. Next reorder: ${newReorder.nextOrder.split("T")[0]}`,
      };
    }
    if (name === "add_to_wishlist") {
      let p = ALL_PRODUCTS.find(x => x.id === inp.productId);
      if (!p) {
        p = ALL_PRODUCTS.find(x => x.name.toLowerCase() === inp.productId.toLowerCase());
      }
      if (!p) return { error: "Product not found" };
      if (!wishlistRef.current.includes(p.id)) {
        wishlistRef.current = [...wishlistRef.current, p.id];
        onToggleWishlist(p);
      }
      return { success: true, added: p.name };
    }
    if (name === "remove_from_wishlist") {
      let p = ALL_PRODUCTS.find(x => x.id === inp.productId);
      if (!p) {
        p = ALL_PRODUCTS.find(x => x.name.toLowerCase() === inp.productId.toLowerCase());
      }
      if (!p) return { error: "Product not found" };
      if (wishlistRef.current.includes(p.id)) {
        wishlistRef.current = wishlistRef.current.filter(id => id !== p.id);
        onToggleWishlist(p);
      }
      return { success: true, removed: p.name };
    }
    if (name === "view_wishlist") {
      const wishlistedProducts = ALL_PRODUCTS.filter(p => wishlistRef.current.includes(p.id));
      return {
        items: wishlistedProducts.map(p => ({ id: p.id, name: p.name, price: p.price })),
        count: wishlistedProducts.length
      };
    }
    return { error: "Unknown tool" };
  };

  const runAgent = async (apiMsgs, depth = 0) => {
    if (depth >= 3) {
      setTools([]);
      return "I ran into a loop while executing tools. Is there something else I can help you find?";
    }
    // Only send tools that the agent can use given current state
    const availableTools = wallet ? AGENT_TOOLS : AGENT_TOOLS.filter(t => !["check_allowance", "request_approval", "agent_checkout"].includes(t.name));
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tools: availableTools,
        messages: apiMsgs,
        allowance,
        wallet,
        cart: cartRef.current,
        wishlist: ALL_PRODUCTS.filter(p => wishlistRef.current.includes(p.id))
      }),
    });
    const data = await res.json();
    if (data.error) { setTools([]); return "Sorry, I ran into an issue. Please try again."; }

    let text = "";
    const toolBlocks = [];
    for (const b of data.content || []) {
      if (b.type === "text") text += b.text;
      if (b.type === "tool_use") toolBlocks.push(b);
    }

    if (toolBlocks.length > 0) {
      setTools(toolBlocks.map(b => b.name));
      const results = [];
      let isBlocking = false;
      let blockingMsg = "";

      for (const b of toolBlocks) {
        const result = await exec(b.name, b.input);
        results.push({
          type: "tool_result",
          tool_use_id: b.id,
          content: JSON.stringify(result),
        });
        if (b.name === "request_approval") {
          isBlocking = true;
          blockingMsg = text || `I have popped up the Agent Approval modal for ${b.input.amount || 500} USDC. Please approve the spending limit in your wallet to enable instant agent checkout!`;
        }
        if (b.name === "initiate_checkout") {
          isBlocking = true;
          blockingMsg = text || "I have opened the checkout flow for you. Please review your details and confirm the transaction in your wallet.";
        }
      }

      if (isBlocking) {
        setTools([]);
        return blockingMsg;
      }

      return runAgent([...apiMsgs, { role: "assistant", content: data.content }, { role: "user", content: results }], depth + 1);
    }

    // Fail-safe: if the agent explains it's going to request approval but forgot the tool call
    const lowerText = text.toLowerCase();
    if (
      (lowerText.includes("allowance") || lowerText.includes("spending limit") || lowerText.includes("approve")) &&
      (lowerText.includes("request") || lowerText.includes("popup") || lowerText.includes("pop up") || lowerText.includes("modal"))
    ) {
      const totalAmount = cartRef.current.reduce((s, i) => s + i.price * i.qty, 0);
      if (totalAmount > 0 && allowance < totalAmount) {
        console.log("[runAgent] Fail-safe: Triggering request_approval from text response");
        waitingForApproval.current = true;
        if (onRequestApproval) {
          onRequestApproval(totalAmount || 500);
        }
        setTools([]);
        return text || `I have popped up the Agent Approval modal for ${totalAmount} USDC. Please approve the spending limit in your wallet to enable instant agent checkout!`;
      }
    }

    setTools([]);
    return text || "Done! What else can I help with?";
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    setLoading(true);
    setMsgs(p => [...p, { role: "user", text: txt }]);

    const apiMsgs = msgs
      .filter(m => m.role === "assistant" || m.role === "user")
      .slice(-4)
      .map(m => ({ role: m.role, content: m.text }));
    apiMsgs.push({ role: "user", content: txt });

    try {
      const r = await runAgent(apiMsgs);
      setMsgs(p => [...p, { role: "assistant", text: r || "Done! Anything else?" }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const SUGGESTION_CHIPS = [
    "Men's formal outfit under 200 USDC",
    "Women's summer look",
    "Kids outfit under 80 USDC",
    "View my cart",
    "Checkout now",
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(0,0,0,0.2)" }}
        aria-label="Close agent"
      />
      <div
        className="agent-panel"
        role="dialog"
        aria-modal="true"
        aria-label="ArcWear AI shopping agent"
      >
        {/* Header */}
        <div style={{ background: "#1c1917", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#c47d2a,#e8a849)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>◎</div>
              <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, background: "#22c55e", borderRadius: "50%", border: "2px solid #1c1917" }} aria-hidden="true" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1 }}>ArcWear Agent</p>
              <p style={{ fontSize: 10, color: "#c47d2a", letterSpacing: 1.5, textTransform: "uppercase", margin: "2px 0 0" }}>AI · USDC · Arc Blockchain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close agent panel"
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "#888", width: 26, height: 26, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        {/* Active tools indicator */}
        {tools.length > 0 && (
          <div style={{ background: "#faf9f7", borderBottom: "1px solid #f0ede8", padding: "5px 14px", display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: "#c47d2a", fontWeight: 700, animation: "pulse .8s infinite" }} aria-hidden="true">●</span>
            {tools.map((t, i) => (
              <span key={i} className="badge-tool">⚡ {t.replace(/_/g, " ")}</span>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "13px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
              {m.role === "assistant" && <div className="agent-avatar" aria-hidden="true">◎</div>}
              <div className={`chat-bubble chat-bubble--${m.role}`}>{m.text}</div>
              {m.role === "user" && (
                <div style={{ width: 26, height: 26, background: "#e7e4e0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#78716c", fontWeight: 700, flexShrink: 0 }} aria-hidden="true">
                  U
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div className="agent-avatar" aria-hidden="true">◎</div>
              <div style={{ background: "#faf9f7", border: "1px solid #f0ede8", borderRadius: "4px 16px 16px 16px", padding: "10px 14px", display: "flex", gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, background: "#c47d2a", borderRadius: "50%", animation: `bounce 1.1s ${i * 0.18}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {msgs.length <= 1 && (
          <div style={{ padding: "0 13px 10px", display: "flex", flexWrap: "wrap", gap: 5, flexShrink: 0 }}>
            {SUGGESTION_CHIPS.map((c, i) => (
              <button
                key={i}
                onClick={() => setInput(c)}
                style={{ background: "#faf9f7", border: "1px solid #e7e4e0", borderRadius: 20, padding: "4px 11px", fontSize: 12, color: "#78716c", cursor: "pointer" }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "9px 13px 14px", borderTop: "1px solid #f0ede8", display: "flex", gap: 8, flexShrink: 0 }}>
          <input
            className="input"
            style={{ flex: 1, padding: "9px 13px" }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about outfits, budgets, styles…"
            aria-label="Chat with AI agent"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            style={{
              background: loading || !input.trim() ? "#e7e4e0" : "#1c1917",
              color: "#fff", border: "none", borderRadius: 10,
              padding: "0 16px", fontSize: 12, fontWeight: 700,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              letterSpacing: 1.2, textTransform: "uppercase",
            }}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   WishlistDrawer — slide-out panel for wishlisted items
   ========================================================= */
function WishlistDrawer({ wishlist, onClose, onRemove, onAddToCart, allProducts }) {
  const wishlistedItems = allProducts.filter(p => wishlist.includes(p.id));

  return (
    <>
      <div className="backdrop" onClick={onClose} aria-label="Close wishlist" />
      <aside
        className="wishlist-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        style={{
          position: "fixed", top: 0, right: 0, height: "100%",
          background: "#fff", zIndex: 1200,
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          animation: "drawerIn .28s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #f0ede8" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1c1917", margin: 0 }}>Your Wishlist</h2>
            <p style={{ fontSize: 13, color: "#a8a29e", margin: "3px 0 0" }}>
              {wishlistedItems.length} items
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close wishlist">✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {wishlistedItems.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <p style={{ fontSize: 48, marginBottom: 10, opacity: 0.2 }}>❤️</p>
              <p style={{ fontSize: 15, color: "#a8a29e" }}>Your wishlist is empty</p>
            </div>
          ) : wishlistedItems.map(item => (
            <div key={item.id} className="wishlist-item">
              <div className="wishlist-item__thumb">
                <img
                  src={item.img} alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => e.target.style.display = "none"}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#1c1917", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#c47d2a", margin: "2px 0 0" }}>
                  {fmt(item.price)}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => { onAddToCart(item); onRemove(item); }}
                  style={{
                    background: "#f97316", color: "#fff",
                    border: "none", borderRadius: 4,
                    padding: "6px 10px", fontSize: 11, fontWeight: 700,
                    cursor: "pointer", textTransform: "uppercase"
                  }}
                >
                  + Cart
                </button>
                <button
                  onClick={() => onRemove(item)}
                  style={{ background: "none", border: "none", color: "#a8a29e", cursor: "pointer", fontSize: 11, padding: 0, textDecoration: "underline" }}
                >
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   OrderDrawer — slide-out panel for order history
   ========================================================= */
function OrderDrawer({ orders, onClose, onRetryOrder, onCancelOrder, onDeleteOrder }) {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleExpand = (id) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} aria-label="Close orders" />
      <aside
        className="order-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Order history"
        style={{
          position: "fixed", top: 0, right: 0, height: "100%",
          background: "#fff", zIndex: 1200,
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          animation: "drawerIn .28s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #f0ede8" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1c1917", margin: 0 }}>Order History</h2>
            <p style={{ fontSize: 13, color: "#a8a29e", margin: "3px 0 0" }}>
              {orders.length} orders on Arc Blockchain
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close orders">✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <p style={{ fontSize: 48, marginBottom: 10, opacity: 0.2 }}>📦</p>
              <p style={{ fontSize: 15, color: "#a8a29e" }}>No orders found</p>
            </div>
          ) : orders.map(order => {
            let bg = "#fef3c7", color = "#d97706";
            if (order.status === "success" || order.status === "confirmed") { bg = "#dcfce7"; color = "#15803d"; }
            if (order.status === "failed") { bg = "#fee2e2"; color = "#b91c1c"; }
            if (order.status === "cancelled" || order.status === "canceled") { bg = "#f5f5f4"; color = "#78716c"; }

            // ERC-8183 escrow state overrides display badge
            const escrowState = order.escrowStatus;
            let escrowBadge = null;
            if (order.escrow && order.jobId != null) {
              const escrowBadges = {
                funded:    { label: "🔒 Escrowed",   bg: "#eff6ff", color: "#1d4ed8" },
                submitted: { label: "📦 Processing",  bg: "#f0fdf4", color: "#15803d" },
                completed: { label: "✅ Settled",     bg: "#dcfce7", color: "#15803d" },
                rejected:  { label: "↩ Refunded",    bg: "#fee2e2", color: "#b91c1c" },
                expired:   { label: "⏱ Expired",     bg: "#fef3c7", color: "#d97706" },
              };
              escrowBadge = escrowBadges[escrowState] || null;
            }

            const isExpanded = !!expandedOrders[order.id];
            const itemCount = order.items ? order.items.reduce((s, i) => s + i.qty, 0) : 0;
            const isPlaceholderTx = order.status === "pending" && order.txHash && order.txHash.startsWith("pending_");

            return (
              <div
                key={order.id || order.txHash}
                style={{
                  border: order.escrow ? "1px solid #bfdbfe" : "1px solid #e7e4e0",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  background: order.escrow ? "#fafbff" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => toggleExpand(order.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#a8a29e" }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {order.escrow && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, letterSpacing: 0.5 }}>
                        ERC-8183
                      </span>
                    )}
                    <span className="order-status-badge" style={{ background: escrowBadge ? escrowBadge.bg : bg, color: escrowBadge ? escrowBadge.color : color, fontSize: 11, padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                      {escrowBadge ? escrowBadge.label
                        : order.status === "pending"
                        ? (isPlaceholderTx ? "⏳ Payment Pending" : "⏳ Confirming")
                        : (order.status === "success" || order.status === "confirmed")
                        ? "✓ Confirmed"
                        : (order.status === "cancelled" || order.status === "canceled")
                        ? "✕ Cancelled"
                        : "✕ Failed"}
                    </span>
                  </div>
                </div>


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#1c1917", fontWeight: 600 }}>
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                    <span style={{ fontSize: 12, color: "#a8a29e", marginLeft: 8 }}>· {fmt(order.total)}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#a8a29e", fontFamily: "var(--font-mono)" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {isExpanded && (
                  <div
                    style={{ borderTop: "1px solid #e7e4e0", marginTop: 12, paddingTop: 12 }}
                    onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking details
                  >
                    <div style={{ marginBottom: 12 }}>
                      {order.items && order.items.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#1c1917", margin: "4px 0" }}>
                          <span>{item.name} <span style={{ color: "#a8a29e" }}>×{item.qty}</span></span>
                          <span style={{ fontFamily: "var(--font-mono)", color: "#78716c" }}>{fmt(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* ERC-8183 escrow job info */}
                    {order.escrow && order.jobId != null && (
                      <div style={{
                        background: "#eff6ff", borderRadius: 8, padding: "10px 12px",
                        marginBottom: 12, border: "1px solid #bfdbfe",
                        fontSize: 11, color: "#1e40af",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700 }}>🔒 ERC-8183 Escrow</span>
                          <span style={{ fontFamily: "var(--font-mono)" }}>Job #{order.jobId}</span>
                        </div>
                        <div style={{ color: "#3b82f6", fontSize: 10 }}>
                          USDC held trustlessly on Arc · Released only after delivery confirmed
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      {isPlaceholderTx ? (
                        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                          <p style={{ fontSize: 11, color: "#d97706", margin: 0 }}>
                            ⚠️ Checkout wasn't completed (Insufficient balance or rejected).
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => onCancelOrder(order)}
                              style={{
                                flex: 1,
                                background: "#f5f3f0",
                                color: "#78716c",
                                border: "1px solid #e7e4e0",
                                borderRadius: 8,
                                padding: "6px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                textAlign: "center",
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = "#fee2e2";
                                e.currentTarget.style.color = "#b91c1c";
                                e.currentTarget.style.borderColor = "#fecaca";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "#f5f3f0";
                                e.currentTarget.style.color = "#78716c";
                                e.currentTarget.style.borderColor = "#e7e4e0";
                              }}
                            >
                              Cancel Order
                            </button>
                            <button
                              onClick={() => onRetryOrder(order)}
                              style={{
                                flex: 2,
                                background: "#f97316",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                padding: "6px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                textAlign: "center",
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#ea6c0a"}
                              onMouseLeave={e => e.currentTarget.style.background = "#f97316"}
                            >
                              Resume Checkout
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                          {order.txHash && !order.txHash.startsWith("pending_") ? (
                            <a
                              href={`https://testnet.arcscan.app/tx/${order.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 11, color: "#f97316", textDecoration: "underline", fontFamily: "var(--font-mono)" }}
                            >
                              ArcScan ↗
                            </a>
                          ) : <div />}
                          <div style={{ display: "flex", gap: 6 }}>
                            {(order.status === "failed" || order.status === "cancelled" || order.status === "canceled") && (
                              <button
                                onClick={() => onDeleteOrder(order)}
                                style={{
                                  background: "#fff",
                                  color: "#ef4444",
                                  border: "1px solid #fee2e2",
                                  borderRadius: 6,
                                  padding: "4px 10px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = "#fee2e2";
                                  e.currentTarget.style.borderColor = "#fecaca";
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = "#fff";
                                  e.currentTarget.style.borderColor = "#fee2e2";
                                }}
                              >
                                Delete
                              </button>
                            )}
                            <button
                              onClick={() => onRetryOrder(order)}
                              style={{
                                background: "#f5f3f0",
                                color: "#1c1917",
                                border: "1px solid #e7e4e0",
                                borderRadius: 6,
                                padding: "4px 10px",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#e7e4e0"}
                              onMouseLeave={e => e.currentTarget.style.background = "#f5f3f0"}
                            >
                              Buy Again
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   CombinedFooter component — merges blockchain banner & footer
   ========================================================= */
function CombinedFooter({ addToast }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      addToast("Please enter a valid email address.", "error");
      return;
    }
    addToast("✓ Subscribed successfully! Thank you for joining ArcWear.", "success");
    setEmail("");
  };

  return (
    <footer aria-label="Powered by Arc Blockchain and Footer" style={{
      background: "#1c1917",
      borderRadius: 16,
      padding: "32px 36px 24px",
      marginTop: 36,
      border: "1px solid #292524",
      fontFamily: "var(--font-sans)",
      color: "#e7e4e0",
    }}>
      {/* Top Section: Powered by Arc Blockchain Banner */}
      <div style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 24,
        paddingBottom: 28,
        borderBottom: "1px solid #292524",
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 700, color: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#c47d2a" }}>◎</span> Powered by Arc Blockchain
          </h3>
          <p style={{ fontSize: 13, color: "#87827b", lineHeight: 1.6, margin: 0 }}>
            AI shopping agent · USDC stablecoin · Circle&apos;s Arc L1 · Sub-second settlement · Non-custodial.
          </p>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {[
            ["◎", "AI Agent", "Autonomous"],
            ["⚡", "<1s", "Finality"],
            ["$", "USDC", "Stablecoin"],
            ["🔒", "Non", "Custodial"]
          ].map(([ic, a, b]) => (
            <div key={b} style={{ textAlign: "center", minWidth: 70 }}>
              <p style={{ fontSize: 20, marginBottom: 4, color: "#c47d2a", margin: 0 }} aria-hidden="true">{ic}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{a}</p>
              <p style={{ fontSize: 9, color: "#57534e", letterSpacing: 1, textTransform: "uppercase", marginTop: 2, margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Section: Connect & Newsletter */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 40,
        padding: "32px 0 24px",
      }}>
        {/* Connect & Social Links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
            Connect with ArcWear
          </h4>
          <p style={{ color: "#a8a29e", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Follow us to stay updated on web3 fashion, developer drops, and new AI capabilities.
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {[
              {
                name: "Twitter",
                url: "https://x.com/arcwear_",
                icon: (
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )
              },
              {
                name: "Instagram",
                url: "https://www.instagram.com/arcwear__",
                icon: (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                )
              },
              {
                name: "TikTok",
                url: "https://tiktok.com/@arcwear_",
                icon: (
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.72-.01 2.93-.01 5.85-.02 8.78-.1 1.78-.71 3.56-1.95 4.86-1.24 1.35-3.03 2.21-4.87 2.37-2.01.19-4.14-.3-5.71-1.63-1.65-1.37-2.52-3.56-2.31-5.7.13-2.18 1.31-4.22 3.19-5.32 1.34-.82 2.94-1.21 4.5-.96.01 1.39.01 2.78.01 4.17-1-.21-2.11-.08-3 .46-.77.47-1.29 1.33-1.34 2.25-.09.99.31 2.02 1.07 2.68.79.72 1.93.99 2.97.77 1.05-.2 2.01-.99 2.37-1.99.28-.75.24-1.57.26-2.37.01-4.29.01-8.58.01-12.87z" />
                  </svg>
                )
              }
            ].map(social => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
                style={{
                  color: "#a8a29e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid #292524",
                  background: "#171513",
                  transition: "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#c47d2a";
                  e.currentTarget.style.background = "#c47d2a";
                  e.currentTarget.style.transform = "scale(1.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#a8a29e";
                  e.currentTarget.style.borderColor = "#292524";
                  e.currentTarget.style.background = "#171513";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
            Subscribe to our Newsletter
          </h4>
          <p style={{ color: "#a8a29e", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            Get notifications on new fashion drops, exclusive collections, and AI shopping integrations.
          </p>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, maxWidth: 360, margin: 0 }}>
            <input
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                flex: 1,
                background: "#171513",
                color: "#fff",
                border: "1px solid #292524",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#f97316"}
              onBlur={e => e.currentTarget.style.borderColor = "#292524"}
            />
            <button
              type="submit"
              style={{
                background: "#f97316",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#ea6c0a"}
              onMouseLeave={e => e.currentTarget.style.background = "#f97316"}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div style={{
        borderTop: "1px solid #292524",
        paddingTop: 18,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        color: "#57534e",
        fontSize: 11,
      }}>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} ArcWear. All rights reserved.
        </p>
        <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
          Powered by <span style={{ color: "#c47d2a", fontWeight: 600 }}>Arc Blockchain</span>
        </p>
      </div>
    </footer>
  );
}

/* =========================================================
   ArcWear — Root Page Component
   ========================================================= */
export default function ArcWear() {
  const [section, setSection] = useState("men");
  const [activeCat, setActiveCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalAmount, setApprovalAmount] = useState(500);
  const [detailItem, setDetailItem] = useState(null);

  // ── Wishlist State ──
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("arcwear_wishlist") || "[]");
      const validIds = ALL_PRODUCTS.map(p => p.id);
      return Array.isArray(stored) ? stored.filter(id => validIds.includes(id)) : [];
    } catch {
      return [];
    }
  });
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Sync wishlist to localStorage
  useEffect(() => {
    localStorage.setItem("arcwear_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (item) => {
    if (!item || !item.id) return;
    const validIds = ALL_PRODUCTS.map(p => p.id);
    if (!validIds.includes(item.id)) return;
    setWishlist(prev => {
      const isWishlisted = prev.includes(item.id);
      if (isWishlisted) {
        addToast(`${item.name || "Item"} removed from wishlist`, "info");
        return prev.filter(id => id !== item.id);
      } else {
        addToast(`${item.name || "Item"} added to wishlist`, "success");
        return [...prev, item.id].filter(id => validIds.includes(id));
      }
    });
  };

  // ── Orders State & Syncing ──
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("arcwear_orders") || "[]");
    } catch {
      return [];
    }
  });
  const [ordersOpen, setOrdersOpen] = useState(false);

  // Sync orders to localStorage
  useEffect(() => {
    localStorage.setItem("arcwear_orders", JSON.stringify(orders));
  }, [orders]);

  // Load orders from API when wallet is connected
  const loadOrders = async (userWallet) => {
    if (!userWallet) return;
    try {
      const res = await fetch(`/api/orders?wallet=${userWallet}`);
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      }
    } catch (e) {
      console.error("Error loading orders from API:", e);
    }
  };

  useEffect(() => {
    if (wallet) {
      loadOrders(wallet);
    } else {
      setOrders([]);
    }
  }, [wallet]);

  // Function to save new order to API & local state
  const saveOrder = async (txHash, totalAmount, orderItems, extra = {}) => {
    const newOrderData = {
      userWallet: wallet || "0x0000000000000000000000000000000000000000",
      items: orderItems.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, img: i.img, size: i.size, color: i.color })),
      total: totalAmount,
      txHash: txHash,
      status: "pending",
      createdAt: new Date().toISOString(),
      jobId: extra.jobId ?? null,
      escrowStatus: extra.escrowStatus ?? (extra.escrow ? "completed" : null),
      escrow: extra.escrow ?? false
    };

    // Add locally immediately
    setOrders(prev => [newOrderData, ...prev]);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrderData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          // Replace local temp order with saved order containing its ID
          setOrders(prev => prev.map(o => o.txHash === txHash ? data.order : o));
          return data.order;
        }
      }
    } catch (e) {
      console.error("Error saving order:", e);
    }
    return newOrderData;
  };

  const updateOrderTxHash = async (orderId, realTxHash) => {
    // Update locally
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, txHash: realTxHash } : o));

    // Update DB
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, txHash: realTxHash })
      });
    } catch (e) {
      console.error("Error updating order txHash:", e);
    }
  };

  const handleRetryOrder = (order) => {
    if (order.items && order.items.length > 0) {
      setCart(order.items);
      setCheckout(true);
      setOrdersOpen(false);
      addToast("Resumed checkout for your pending order.", "info");
    }
  };

  const handleCancelOrder = async (order) => {
    // Update locally
    setOrders(prev => prev.map(o => {
      const match = (order.id && o.id === order.id) || (order.txHash && o.txHash === order.txHash);
      return match ? { ...o, status: "cancelled" } : o;
    }));

    // Update DB if the order has an ID
    if (order.id) {
      try {
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: order.id, status: "cancelled" })
        });
        addToast("Order cancelled successfully.", "success");
      } catch (e) {
        console.error("Error cancelling order:", e);
        addToast("Error updating order status in API", "error");
      }
    } else {
      addToast("Order cancelled locally.", "success");
    }
  };

  const handleDeleteOrder = async (order) => {
    // Update locally
    setOrders(prev => prev.filter(o => {
      const match = (order.id && o.id === order.id) || (order.txHash && o.txHash === order.txHash);
      return !match;
    }));

    // Update DB if the order has an ID
    if (order.id) {
      try {
        await fetch("/api/orders", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: order.id, wallet: wallet })
        });
        addToast("Order deleted from history.", "success");
      } catch (e) {
        console.error("Error deleting order:", e);
        addToast("Error deleting order from database.", "error");
      }
    } else {
      addToast("Order deleted locally.", "success");
    }
  };

  // Helper to query transaction receipt from Arc RPC
  const checkOnChainStatus = async (txHash) => {
    try {
      const res = await fetch("https://rpc.testnet.arc.network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionReceipt",
          params: [txHash]
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          return json.result.status === "0x1" ? "success" : "failed";
        }
      }
    } catch (e) {
      console.error("Error fetching transaction receipt:", e);
    }
    return "pending";
  };

  // Periodically check status of pending orders
  useEffect(() => {
    const pendingOrders = orders.filter(o => o.status === "pending" && o.id);
    if (pendingOrders.length === 0) return;

    const interval = setInterval(async () => {
      for (const order of pendingOrders) {
        const status = await checkOnChainStatus(order.txHash);
        if (status !== "pending") {
          // Update locally
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o));
          // Update DB
          try {
            await fetch("/api/orders", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: order.id, status })
            });
          } catch (e) {
            console.error("Error updating order status in API:", e);
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orders]);

  // ── Search & Filter State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");

  // ── Agent Allowance (ERC-20 approve/transferFrom) ─────────
  const { allowance, isApproved, approveAgent, refresh: refreshAllowance } = useAllowance(wallet);

  // Sticky nav shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check for already connected wallet on mount & listen for account switches/disconnects
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            setWallet(accounts[0]);
          }
        } catch (err) {
          console.error("Error checking wallet connection:", err);
        }
      }
    };
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts && accounts.length > 0) {
          setWallet(accounts[0]);
          addToast(`Wallet changed: ${trunc(accounts[0])}`, "info");
        } else {
          setWallet(null);
          addToast("Wallet disconnected", "info");
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  // Disable body scroll when any modal or drawer is open
  useEffect(() => {
    const isAnyModalOpen = agentOpen || cartOpen || checkout || !!editItem || approvalOpen || !!detailItem || wishlistOpen || ordersOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [agentOpen, cartOpen, checkout, editItem, approvalOpen, detailItem, wishlistOpen, ordersOpen]);

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    if (!walletDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".wallet-chip") && !e.target.closest(".wallet-dropdown")) {
        setWalletDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [walletDropdownOpen]);

  // Toast system
  const addToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  // Wallet connection
  const connectWallet = async () => {
    if (!window.ethereum) { addToast("Install Rabby or MetaMask", "error"); return; }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
      addToast(`Connected: ${trunc(accounts[0])}`, "success");
    } catch {
      addToast("Connection cancelled", "error");
    }
  };

  // ── Cart bounce + sparkle animation ──────────────────────
  const triggerCartBounce = (cartEl) => {
    cartEl.classList.remove("cart-btn-bounce");
    void cartEl.offsetWidth; // force reflow
    cartEl.classList.add("cart-btn-bounce");

    const rect = cartEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const colors = ["#f97316", "#fb923c", "#fde047", "#ffffff", "#c47d2a"];

    for (let i = 0; i < 8; i++) {
      const sparkle = document.createElement("div");
      sparkle.style.cssText = `position:fixed;left:${centerX}px;top:${centerY}px;border-radius:50%;z-index:99999;pointer-events:none;`;
      const size = Math.random() * 5 + 4;
      sparkle.style.width = `${size}px`;
      sparkle.style.height = `${size}px`;
      sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
      sparkle.style.boxShadow = `0 0 6px ${sparkle.style.background}`;
      document.body.appendChild(sparkle);

      const angle = (i * 45 + Math.random() * 20) * (Math.PI / 180);
      const distance = Math.random() * 30 + 35;
      const anim = sparkle.animate([
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px)) scale(0)`, opacity: 0 },
      ], { duration: Math.random() * 300 + 400, easing: "cubic-bezier(0.1, 0.8, 0.3, 1)" });
      anim.onfinish = () => sparkle.remove();
    }
  };

  // ── Fly-to-cart animation ─────────────────────────────────
  const animateFlyToCart = (item, event) => {
    let startX, startY;

    if (event && (event.clientX || event.touches)) {
      startX = event.clientX || event.touches[0].clientX;
      startY = event.clientY || event.touches[0].clientY;
    } else {
      const cardEl = document.querySelector(`[data-product-id="${item.id}"]`);
      if (cardEl) {
        const r = cardEl.getBoundingClientRect();
        startX = r.left + r.width / 2;
        startY = r.top + r.height / 2;
      } else {
        startX = window.innerWidth / 2;
        startY = window.innerHeight / 2;
      }
    }

    const desktopCart = document.getElementById("desktop-cart-btn");
    const mobileCart = document.getElementById("mobile-cart-btn");
    const targetEl = desktopCart?.getBoundingClientRect().width > 0 ? desktopCart
      : mobileCart?.getBoundingClientRect().width > 0 ? mobileCart
        : null;
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const destX = targetRect.left + targetRect.width / 2;
    const destY = targetRect.top + targetRect.height / 2;

    const flyer = document.createElement("div");
    flyer.style.cssText = `position:fixed;left:${startX - 20}px;top:${startY - 20}px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.98);border:2px solid #f97316;box-shadow:0 8px 24px rgba(249,115,22,.35);display:flex;align-items:center;justify-content:center;font-size:20px;z-index:99999;pointer-events:none;overflow:hidden;`;

    if (item.img) {
      const img = document.createElement("img");
      img.src = item.img;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      img.onerror = () => { img.style.display = "none"; flyer.innerText = item.emoji || "👕"; };
      flyer.appendChild(img);
    } else {
      flyer.innerText = item.emoji || "👕";
    }

    document.body.appendChild(flyer);

    const deltaX = destX - startX;
    const deltaY = destY - startY;
    const midX = deltaX * 0.45;
    const midY = Math.min(deltaY, -120) - 80;

    const anim = flyer.animate([
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${midX}px, ${midY}px) scale(1.25) rotate(180deg)`, opacity: 0.9, offset: 0.45 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.15) rotate(360deg)`, opacity: 0 },
    ], { duration: 800, easing: "cubic-bezier(0.12, 0.85, 0.3, 1)" });

    anim.onfinish = () => { flyer.remove(); triggerCartBounce(targetEl); };
  };

  // ── Cart actions ──────────────────────────────────────────
  const addToCart = (item, event) => {
    setCart(prev => {
      const ex = prev.find(x => x.id === item.id);
      if (ex) return prev.map(x => x.id === item.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...item, qty: 1 }];
    });
    addToast(`${item.name} added`, "success");
    animateFlyToCart(item, event);
  };

  const addToCartWithOptions = (item, event) => {
    setCart(prev => {
      const ex = prev.find(x => x.id === item.id && x.size === item.size && x.color === item.color);
      if (ex) return prev.map(x => x.id === item.id && x.size === item.size && x.color === item.color ? { ...x, qty: x.qty + item.qty } : x);
      return [...prev, item];
    });
    addToast(`${item.name} added`, "success");
    setEditItem(null);
  };

  // ── Derived values ────────────────────────────────────────
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const sec = CATALOGUE[section];
  const cats = Object.entries(sec.categories);

  // Filter and sort items per category based on search, price bounds, and sort dropdown
  const filteredCats = cats.map(([catKey, cat]) => {
    let filteredItems = cat.items.filter(item => {
      const matchesSearch = searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMinPrice = minPrice.trim() === "" || item.price >= Number(minPrice);
      const matchesMaxPrice = maxPrice.trim() === "" || item.price <= Number(maxPrice);

      return matchesSearch && matchesMinPrice && matchesMaxPrice;
    });

    if (sortBy === "price-asc") {
      filteredItems = [...filteredItems].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filteredItems = [...filteredItems].sort((a, b) => b.price - a.price);
    }

    return [catKey, { ...cat, items: filteredItems }];
  }).filter(([_, cat]) => cat.items.length > 0);

  const displayCats = activeCat ? filteredCats.filter(([k]) => k === activeCat) : filteredCats;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "var(--font-sans)" }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: "#1c1917", padding: "6px 0", textAlign: "center", overflow: "hidden", whiteSpace: "nowrap" }}>
        <p className="topbar-text" style={{ fontSize: 13, color: "#fde68a", letterSpacing: 0.5, display: "inline-block" }}>
          🎉 Free shipping on orders over 150 USDC · Pay with USDC on Arc Blockchain
        </p>
      </div>

      {/* ── NAVBAR ── */}
      <nav
        aria-label="Main navigation"
        style={{
          position: "sticky", top: 0, zIndex: 900,
          background: scrolled ? "rgba(255,255,255,0.97)" : "#fff",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: "1px solid #e7e4e0",
          boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.06)" : "none",
          transition: "all .3s",
        }}
      >
        <div
          className="nav-wrap"
          style={{ maxWidth: "100%", padding: "0 3%", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <LogoImage />
            <div className="desktop-only" style={{ flexDirection: "column" }}>
              <p style={{ fontSize: 9, color: "#c47d2a", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>

              </p>
            </div>
          </div>

          {/* Desktop section tabs */}
          <div
            className="nav-desktop"
            role="tablist"
            aria-label="Shop by gender"
            style={{ gap: 0, background: "#f5f3f0", borderRadius: 6, padding: 3, border: "1px solid #e7e4e0" }}
          >
            {["men", "women", "children"].map(k => {
              const s = CATALOGUE[k];
              const isActive = section === k;
              return (
                <button
                  key={k}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => { setSection(k); setActiveCat(null); }}
                  style={{
                    background: isActive ? "#1c1917" : "transparent",
                    color: isActive ? "#fff" : "#78716c",
                    border: "none", cursor: "pointer",
                    padding: "7px 18px", borderRadius: 4,
                    fontSize: 12, fontWeight: 600,
                    transition: "all .2s",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#e7e4e0"; e.currentTarget.style.color = "#1c1917"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#78716c"; } }}
                >
                  <span style={{ fontSize: 14 }}>{s.icon}</span>{s.label}
                </button>
              );
            })}
          </div>

          {/* Desktop search bar */}
          <div className="desktop-only search-bar-wrap" style={{ flex: 1, maxWidth: 320, margin: "0 16px" }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search products, categories.."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0 10px 0 0", fontSize: 13, color: "#a8a29e" }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>



            {/* Wallet chip / connect button */}
            {wallet ? (
              <div className="desktop-only" style={{ position: "relative" }}>
                <button
                  className="wallet-chip"
                  onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                  aria-label={`Wallet connected: ${trunc(wallet)}. Click to toggle menu.`}
                  aria-expanded={walletDropdownOpen}
                  aria-haspopup="true"
                  style={{
                    cursor: "pointer",
                    border: walletDropdownOpen ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    borderRadius: "var(--radius-sm)",
                    padding: "5px 10px",
                    outline: "none"
                  }}
                >
                  <div className="wallet-chip__dot" aria-hidden="true" />
                  <span className="wallet-chip__address">{trunc(wallet)}</span>
                  <span style={{ fontSize: 8, color: "#a8a29e", marginLeft: 2, display: "inline-block", transform: walletDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {walletDropdownOpen && (
                  <>
                    <style>{`
                      @keyframes walletDropdownIn {
                        from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
                        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                      }
                    `}</style>
                    <div
                      className="wallet-dropdown"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginTop: 10,
                        zIndex: 999,
                        animation: "walletDropdownIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))"
                      }}
                    >
                      {/* Triangle Arrow */}
                      <div style={{
                        position: "absolute",
                        top: -5,
                        left: "50%",
                        transform: "translateX(-50%) rotate(45deg)",
                        width: 10,
                        height: 10,
                        background: "#fff",
                        borderLeft: "1px solid var(--color-border)",
                        borderTop: "1px solid var(--color-border)",
                        zIndex: 1
                      }} />

                      {/* Inner Container */}
                      <div style={{
                        background: "#fff",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        minWidth: "155px",
                        position: "relative",
                        zIndex: 2,
                        overflow: "hidden"
                      }}>
                        <button
                          onClick={() => {
                            setWallet(null);
                            setWalletDropdownOpen(false);
                            addToast("Wallet disconnected", "info");
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px 16px",
                            fontSize: "11px",
                            color: "#c41e3a",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            transition: "background 0.15s, color 0.15s",
                            whiteSpace: "nowrap",
                            fontFamily: "inherit"
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "#fff5f5";
                            e.currentTarget.style.color = "#b91c1c";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.color = "#c41e3a";
                          }}
                        >
                          🔌 Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="desktop-only"
                style={{
                  background: "#fff", color: "#1c1917",
                  border: "1px solid #e7e4e0", borderRadius: 4,
                  padding: "5px 11px", fontSize: 10, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  transition: "all .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#7c4a1a"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#7c4a1a"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1c1917"; e.currentTarget.style.borderColor = "#e7e4e0"; }}
              >
                <span aria-hidden="true">◎</span> Connect Wallet
              </button>
            )}

            {/* Wishlist button */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="desktop-only"
              aria-label={`Open wishlist — ${wishlist.length} items`}
              style={{
                background: "#fff", color: "#1c1917",
                border: "1px solid #e7e4e0", borderRadius: 4,
                padding: "5px 12px", fontSize: 10, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f5f3f0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            >
              ❤️ Wishlist
              {wishlist.length > 0 && (
                <span style={{ background: "#c41e3a", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800 }}>
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Order History button */}
            <button
              onClick={() => setOrdersOpen(true)}
              className="desktop-only"
              aria-label={`Open order history — ${orders.length} orders`}
              style={{
                background: "#fff", color: "#1c1917",
                border: "1px solid #e7e4e0", borderRadius: 4,
                padding: "5px 12px", fontSize: 10, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f5f3f0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
            >
              📦 Orders
              {orders.length > 0 && (
                <span style={{ background: "#1c1917", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800 }}>
                  {orders.length}
                </span>
              )}
            </button>

            {/* Cart button */}
            <button
              id="desktop-cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart — ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
              style={{
                background: "#f97316", color: "#fff",
                border: "1px solid #f97316", borderRadius: 4,
                padding: "5px 12px", fontSize: 10, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#7c4a1a"; e.currentTarget.style.borderColor = "#7c4a1a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f97316"; e.currentTarget.style.borderColor = "#f97316"; }}
            >
              🛒 Cart
              {cartCount > 0 && (
                <span style={{ background: "#fff", color: "#f97316", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800 }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile section tabs */}
        <div
          className="nav-mobile-tabs"
          role="tablist"
          aria-label="Shop by gender"
          style={{ display: "none", gap: 6, overflowX: "auto", padding: "8px 12px 10px", borderTop: "1px solid #f0ede8" }}
        >
          {["men", "women", "children"].map(k => {
            const s = CATALOGUE[k];
            const isActive = section === k;
            return (
              <button
                key={k}
                role="tab"
                aria-selected={isActive}
                onClick={() => { setSection(k); setActiveCat(null); }}
                style={{
                  background: isActive ? "#1c1917" : "#f5f3f0",
                  color: isActive ? "#fff" : "#78716c",
                  border: "none", cursor: "pointer",
                  padding: "8px 18px", borderRadius: 20,
                  fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14 }}>{s.icon}</span>{s.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="hero-section"
        aria-label="Hero"
        style={{ background: "#1c1917", padding: "44px 5% 38px", position: "relative", overflow: "hidden" }}
      >
        {/* Background glow */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 15% 50%, rgba(196,125,42,0.15) 0%, transparent 55%), radial-gradient(circle at 85% 20%, rgba(249,115,22,0.08) 0%, transparent 50%)", pointerEvents: "none" }} aria-hidden="true" />

        <div style={{ maxWidth: "100%", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>

            {/* Copy */}
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 20, padding: "4px 12px", marginBottom: 14 }}>
                <div style={{ width: 5, height: 5, background: "#22c55e", borderRadius: "50%", animation: "pulse 2s infinite" }} aria-hidden="true" />
                <span style={{ fontSize: 9, color: "#fb923c", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>AI Agent · Live on Arc</span>
              </div>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,4vw,48px)", fontWeight: 700, color: "#fff", lineHeight: 1.15, marginBottom: 10 }}>
                Shop with ArcWear
              </h1>
              <p style={{ fontSize: 13, color: "#78716c", lineHeight: 1.65, marginBottom: 22 }}>
                {sec.label}&apos;s collection — shirts, trousers, belts, headwear &amp; footwear · Pay with USDC on Arc
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setAgentOpen(true)}
                  style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(249,115,22,0.3)", display: "flex", alignItems: "center", gap: 7 }}
                >
                  ◎ Shop with AI Agent
                </button>
                <button
                  onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ color: "#d4cfc8", border: "1px solid #44403c", background: "transparent", borderRadius: 10, padding: "11px 22px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Browse ↓
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="hero-stats" style={{ gap: 20, flexWrap: "wrap" }}>
              {[["5", "Categories"], ["25+", "Products"], ["USDC", "Payment"], ["Arc", "Blockchain"]].map(([v, l]) => (
                <div key={l} className="stat-item">
                  <p className="stat-item__value">{v}</p>
                  <p className="stat-item__label">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <div
        role="navigation"
        aria-label="Category filter"
        style={{ background: "#fff", borderBottom: "1px solid #e7e4e0", position: "sticky", top: 60, zIndex: 800 }}
      >
        <div
          className="filter-wrap"
          style={{ maxWidth: "100%", padding: "0 4%", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "4px 0" }} role="group" aria-label="Filter by category">
            {[["all", "All"], ["shirts", "Shirts"], ["trousers", "Trousers"], ["belts", "Belts"], ["caps", "Headwear"], ["shoes", "Footwear"]].map(([k, label]) => {
              const isActive = (k === "all" && !activeCat) || activeCat === k;
              return (
                <button
                  key={k}
                  className={`filter-pill${isActive ? " active" : ""}`}
                  onClick={() => setActiveCat(k === "all" ? null : k)}
                  aria-pressed={isActive}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
            {/* Price filters */}
            <div className="desktop-only" style={{ alignItems: "center", gap: 6, fontSize: 12, color: "#78716c" }}>
              <span>Price (USDC):</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                style={{
                  width: 56, height: 28, background: "#faf9f7",
                  border: "1px solid #e7e4e0", borderRadius: 4,
                  padding: "0 6px", outline: "none", fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <span>–</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                style={{
                  width: 56, height: 28, background: "#faf9f7",
                  border: "1px solid #e7e4e0", borderRadius: 4,
                  padding: "0 6px", outline: "none", fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
              />
            </div>

            {/* Sort by dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                height: 28, background: "#faf9f7",
                border: "1px solid #e7e4e0", borderRadius: 4,
                padding: "0 8px", outline: "none", fontSize: 11,
                color: "#44403c", fontWeight: 600, cursor: "pointer"
              }}
            >
              <option value="default">Default Sort</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            <p style={{ fontSize: 12, color: "#a8a29e", flexShrink: 0, marginLeft: 6 }}>
              {displayCats.reduce((s, [, c]) => s + c.items.length, 0)} items
            </p>
          </div>
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <main id="products" className="main-wrap" style={{ maxWidth: "100%", padding: "24px 4% 80px" }}>
        {displayCats.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🔍</p>
            <h3 style={{ fontSize: 19, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>No products found</h3>
            <p style={{ fontSize: 14, color: "#78716c" }}>Try checking your spelling or clearing filters.</p>
            <button
              onClick={() => { setSearchQuery(""); setMinPrice(""); setMaxPrice(""); setActiveCat(null); }}
              style={{
                marginTop: 16, background: "#1c1917", color: "#fff",
                border: "none", borderRadius: 8, padding: "8px 20px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                letterSpacing: 1, textTransform: "uppercase"
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : displayCats.map(([catKey, cat]) => (
          <section key={catKey} style={{ marginBottom: 36 }}>
            <div className="section-header section-header">
              <span style={{ fontSize: 22 }} aria-hidden="true">{cat.emoji}</span>
              <h2 className="section-header__title">{cat.label}</h2>
              <div className="section-header__divider" aria-hidden="true" />
              <span className="section-header__count">{cat.items.length} products</span>
            </div>
            <div className="product-grid" key={`${section}-${activeCat}-${catKey}`}>
              {cat.items.map(item => (
                <ProductCard
                  key={item.id}
                  item={{ ...item, categoryLabel: cat.label, sectionLabel: sec.label }}
                  onAdd={addToCart}
                  onEdit={setEditItem}
                  onViewDetail={(i) => setDetailItem({ ...i, categoryLabel: cat.label, sectionLabel: sec.label })}
                  agentPick={false}
                  wishlist={wishlist}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Combined Footer & Blockchain Banner */}
        <CombinedFooter addToast={addToast} />
      </main>

      {/* ── FLOATING ELEMENTS ── */}

      {/* Scroll-to-top */}
      {scrolled && (
        <button
          className="scroll-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll to top"
          style={{ position: "fixed", bottom: 28, left: 28, background: "#fff", color: "#1c1917", border: "1px solid #e7e4e0", borderRadius: "50%", width: 42, height: 42, fontSize: 18, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ↑
        </button>
      )}

      {/* AI Agent FAB */}
      {!agentOpen && (
        <button
          className="fab-agent"
          onClick={() => setAgentOpen(true)}
          aria-label="Open AI shopping agent"
          style={{ position: "fixed", bottom: 28, right: 28, background: "linear-gradient(135deg,#c47d2a,#f97316)", color: "#fff", border: "none", borderRadius: "50%", width: 52, height: 52, fontSize: 24, cursor: "pointer", boxShadow: "0 6px 20px rgba(249,115,22,0.4)", zIndex: 700, display: "flex", alignItems: "center", justifyContent: "center", animation: "glow 2.5s infinite" }}
        >
          ◎
        </button>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="mobile-bottom-nav"
        aria-label="Mobile navigation"
        style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e7e4e0", zIndex: 600, boxShadow: "0 -4px 16px rgba(0,0,0,0.08)" }}
      >
        {[
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
            label: "Home",
            id: "mobile-home-btn",
            action: () => window.scrollTo({ top: 0, behavior: "smooth" })
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M12 12h.01" />
                <path d="M16 9.5a2.5 2.5 0 0 1 0 5H2" />
              </svg>
            ),
            label: wallet ? "Disconnect" : "Wallet",
            id: "mobile-wallet-btn",
            action: wallet ? () => {
              setWallet(null);
              addToast("Wallet disconnected", "info");
            } : connectWallet
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            ),
            label: wishlist.length > 0 ? `Wishlist (${wishlist.length})` : "Wishlist",
            id: "mobile-wishlist-btn",
            action: () => setWishlistOpen(true)
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
            ),
            label: orders.length > 0 ? `Orders (${orders.length})` : "Orders",
            id: "mobile-orders-btn",
            action: () => setOrdersOpen(true)
          },
          {
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            ),
            label: cartCount > 0 ? `Cart (${cartCount})` : "Cart",
            id: "mobile-cart-btn",
            action: () => setCartOpen(true)
          },
        ].map(({ icon, label, id, action }) => (
          <button
            key={label}
            id={id}
            onClick={action}
            aria-label={label}
            style={{ flex: 1, background: "none", border: "none", padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#78716c", height: 24 }} aria-hidden="true">{icon}</span>
            <span style={{ fontSize: 11, color: "#78716c", fontWeight: 600, letterSpacing: 0.3 }}>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── OVERLAYS & PANELS ── */}
      {detailItem && (
        <ProductDetailPage
          item={detailItem}
          allProducts={ALL_PRODUCTS}
          onClose={() => setDetailItem(null)}
          onAdd={(item, e) => { addToCart(item, e); addToast(`${item.name} added`, "success"); }}
          onEdit={setEditItem}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
        />
      )}
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSave={addToCartWithOptions} />}
      {cartOpen && <CartDrawer cart={cart} onRemove={id => setCart(p => p.filter(x => x.id !== id))} onCheckout={() => { if (!wallet) { connectWallet(); return; } setCartOpen(false); setCheckout(true); }} onClose={() => setCartOpen(false)} wallet={wallet} />}
      {checkout && (
        <CheckoutModal
          cart={cart}
          wallet={wallet}
          onClose={() => setCheckout(false)}
          onTxSent={(hash) => {
            const saved = saveOrder(hash, cart.reduce((s, i) => s + i.price * i.qty, 0), cart);
            setCart([]);
            return saved;
          }}
          onTxHashUpdated={updateOrderTxHash}
          onSuccess={() => {
            setCheckout(false);
            setOrdersOpen(true);
          }}
          addToast={addToast}
        />
      )}
      {agentOpen && <AgentChat cart={cart} setCart={setCart} setActiveSection={setSection} setCheckoutOpen={setCheckout} addToast={addToast} onClose={() => setAgentOpen(false)} wallet={wallet} allowance={allowance} onRequestApproval={(amt) => { setApprovalAmount(amt); setApprovalOpen(true); }} onRefreshAllowance={refreshAllowance} onSaveOrder={saveOrder} wishlist={wishlist} onToggleWishlist={toggleWishlist} />}
      {approvalOpen && <ApprovalModal wallet={wallet} requestedAmount={approvalAmount} onApprove={async (amt) => { const hash = await approveAgent(amt); setApprovalOpen(false); addToast(`✓ Agent mode enabled — ${amt} USDC approved`, "success"); return hash; }} onClose={() => setApprovalOpen(false)} />}
      {wishlistOpen && <WishlistDrawer wishlist={wishlist} allProducts={ALL_PRODUCTS} onClose={() => setWishlistOpen(false)} onRemove={toggleWishlist} onAddToCart={addToCart} />}
      {ordersOpen && <OrderDrawer orders={orders} onClose={() => setOrdersOpen(false)} onRetryOrder={handleRetryOrder} onCancelOrder={handleCancelOrder} onDeleteOrder={handleDeleteOrder} />}

      <Toasts list={toasts} />
    </div>
  );
}