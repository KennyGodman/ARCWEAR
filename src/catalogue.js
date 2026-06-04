export const CATALOGUE = {
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
          { id: "m-t5", name: "Relaxed Linen Pants", price: 65, oldPrice: 85, desc: "Drawstring waist, breathable fabric", img: "https://images.unsplash.com/photo-1517567820964-36dc4c790db4?w=400&q=80" },
          { id: "m-t6", name: "Dress Trouser", price: 85, oldPrice: 105, desc: "Wool-blend, flat-front cut", img: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=400&q=80" },
          { id: "m-t7", name: "Tailored Corduroy", price: 78, oldPrice: 98, desc: "Fine-wale corduroy, comfortable stretch", img: "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=400&q=80" },
        ],
      },
      belts: {
        label: "Belts", emoji: "🪢", items: [
          { id: "m-b1", name: "Leather Classic", price: 35, oldPrice: 45, desc: "Full-grain Italian leather", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80" },
          { id: "m-b2", name: "Woven Canvas Belt", price: 22, oldPrice: 30, desc: "Military-style, brass buckle", img: "https://images.unsplash.com/photo-1625496492751-47e1f4a25c15?w=400&q=80" },
          { id: "m-b3", name: "Suede Dress Belt", price: 38, oldPrice: 52, desc: "Genuine brushed suede, brushed steel buckle", img: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&q=80" },
          { id: "m-b4", name: "Braided Leather Belt", price: 42, oldPrice: 55, desc: "Intricately hand-woven leather cords", img: "https://images.unsplash.com/photo-1627252874187-dc26d338be2a?w=400&q=80" },
          { id: "m-b5", name: "Reversible Smooth Belt", price: 45, oldPrice: 60, desc: "Dual-sided black/brown sleek leather", img: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400&q=80" },
          { id: "m-b6", name: "Suede Dress Belt", price: 38, oldPrice: 52, desc: "Genuine brushed suede, brushed steel buckle", img: "https://images.unsplash.com/photo-1598150490543-de5e00345f0f?w=400&q=80" },
          { id: "m-b7", name: "Braided Leather Belt", price: 42, oldPrice: 55, desc: "Intricately hand-woven leather cords", img: "https://images.unsplash.com/photo-1593726891001-74b81d748530?w=400&q=80" },
        ],
      },
      caps: {
        label: "Headwear", emoji: "🧢", items: [
          { id: "m-c1", name: "Snapback Cap", price: 25, oldPrice: 32, desc: "6-panel, structured brim", img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80" },
          { id: "m-c2", name: "Bucket Hat", price: 20, oldPrice: 28, desc: "Waxed cotton, packable", img: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400&q=80" },
          { id: "m-c3", name: "Beanie Knit", price: 18, oldPrice: 25, desc: "Merino wool, ribbed cuff", img: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&q=80" },
          { id: "m-c4", name: "Merino Wool Beanie", price: 24, oldPrice: 32, desc: "Ultra-soft merino, dynamic thermal weave", img: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&q=80" },
          { id: "m-c5", name: "Classic Fedora", price: 45, oldPrice: 60, desc: "Stiff wool felt, leather band accent", img: "https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400&q=80" },
          { id: "m-c6", name: "Beanie Knit", price: 18, oldPrice: 25, desc: "Merino wool, ribbed cuff", img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80" },
          { id: "m-c7", name: "Merino Wool Beanie", price: 24, oldPrice: 32, desc: "Ultra-soft merino, dynamic thermal weave", img: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80" },
        ],
      },
      shoes: {
        label: "Footwear", emoji: "👟", items: [
          { id: "m-sh1", name: "White Leather Sneaker", price: 110, oldPrice: 140, desc: "Tumbled leather, cupsole", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80" },
          { id: "m-sh2", name: "Chelsea Boot", price: 145, oldPrice: 180, desc: "Suede upper, elastic gusset", img: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&q=80" },
          { id: "m-sh3", name: "Loafer Slip-On", price: 98, oldPrice: 120, desc: "Horsebit detail, leather lining", img: "https://images.unsplash.com/photo-1631984564919-1f6e59f72f73?w=400&q=80" },
          { id: "m-sh4", name: "Suede Desert Boot", price: 125, oldPrice: 160, desc: "Crepe sole, water-repellent suede upper", img: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=400&q=80" },
          { id: "m-sh5", name: "Double Monk Strap", price: 135, oldPrice: 170, desc: "Burnished calfskin, silver buckle details", img: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&q=80" },
          { id: "m-sh6", name: "Loafer Slip-On", price: 98, oldPrice: 120, desc: "Horsebit detail, leather lining", img: "https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=400&q=80" },
          { id: "m-sh7", name: "Suede Desert Boot", price: 125, oldPrice: 160, desc: "Crepe sole, water-repellent suede upper", img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80" },
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
          { id: "w-b1", name: "Gold Chain Belt", price: 38, oldPrice: 50, desc: "Brass links, adjustable fit", img: "https://images.unsplash.com/photo-1624623278313-a930126a11c3?w=400&q=80" },
          { id: "w-b2", name: "Slim Patent", price: 30, oldPrice: 40, desc: "Patent leather, pin buckle", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80" },
          { id: "w-b3", name: "Studded Suede Belt", price: 35, oldPrice: 48, desc: "Gold-tone studs, rich suede strap", img: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400&q=80" },
          { id: "w-b4", name: "Wide Leather Waist Cinch", price: 48, oldPrice: 65, desc: "Premium smooth leather, statement buckle", img: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&q=80" },
          { id: "w-b5", name: "Woven Raffia Belt", price: 26, oldPrice: 38, desc: "Natural straw weave, round wooden buckle", img: "https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80" },
          { id: "w-b6", name: "Studded Suede Belt", price: 35, oldPrice: 48, desc: "Gold-tone studs, rich suede strap", img: "https://images.unsplash.com/photo-1624222247344-550fb8ecf7db?w=400&q=80" },
          { id: "w-b7", name: "Wide Leather Waist Cinch", price: 48, oldPrice: 65, desc: "Premium smooth leather, statement buckle", img: "https://images.unsplash.com/photo-1598150490543-de5e00345f0f?w=400&q=80" },
        ],
      },
      caps: {
        label: "Headwear", emoji: "🎩", items: [
          { id: "w-c1", name: "Wide Brim Sun Hat", price: 40, oldPrice: 52, desc: "Raffia weave, ribbon band", img: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&q=80" },
          { id: "w-c2", name: "Classic Beret", price: 28, oldPrice: 36, desc: "Felted wool, French-style", img: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80" },
          { id: "w-c3", name: "Knit Pom Beanie", price: 22, oldPrice: 30, desc: "Chunky knit, removable pom", img: "https://images.unsplash.com/photo-1510598155236-d3e2e31d3e0c?w=400&q=80" },
          { id: "w-c4", name: "Angora Cable Beanie", price: 32, oldPrice: 45, desc: "Warm angora blend, delicate cable knit", img: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&q=80" },
          { id: "w-c5", name: "Felted Panama Hat", price: 52, oldPrice: 70, desc: "Sleek teardrop crown, raw-edge brim", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80" },
          { id: "w-c6", name: "Knit Pom Beanie", price: 22, oldPrice: 30, desc: "Chunky knit, removable pom", img: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=400&q=80" },
          { id: "w-c7", name: "Angora Cable Beanie", price: 32, oldPrice: 45, desc: "Warm angora blend, delicate cable knit", img: "https://images.unsplash.com/photo-1605497746444-ac9db140efe9?w=400&q=80" },
        ],
      },
      shoes: {
        label: "Footwear", emoji: "👠", items: [
          { id: "w-sh1", name: "Block Heel Mule", price: 120, oldPrice: 150, desc: "Suede upper, 7cm block heel", img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80" },
          { id: "w-sh2", name: "Platform Sneaker", price: 95, oldPrice: 120, desc: "Leather & canvas, 4cm platform", img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80" },
          { id: "w-sh3", name: "Kitten Heel Pump", price: 138, oldPrice: 170, desc: "Satin finish, pointed toe", img: "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=400&q=80" },
          { id: "w-sh4", name: "Pointed Toe Flat", price: 88, oldPrice: 110, desc: "Soft glove leather, cushioned insole", img: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=400&q=80" },
          { id: "w-sh5", name: "Ankle Strap Sandal", price: 115, oldPrice: 145, desc: "Block heel, gold buckle closure", img: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80" },
          { id: "w-sh6", name: "Kitten Heel Pump", price: 138, oldPrice: 170, desc: "Satin finish, pointed toe", img: "https://images.unsplash.com/photo-1579338559194-a162d19bf7ee?w=400&q=80" },
          { id: "w-sh7", name: "Pointed Toe Flat", price: 88, oldPrice: 110, desc: "Soft glove leather, cushioned insole", img: "https://images.unsplash.com/photo-1515490088941-98170e7e1c3a?w=400&q=80" },
        ],
      },
    },
  },
  children: {
    label: "Children", icon: "🧒", categories: {
      shirts: {
        label: "Tops & Tees", emoji: "👕", items: [
          { id: "k-s1", name: "Dino Print Tee", price: 18, oldPrice: 25, desc: "100% organic cotton, crew neck", img: "https://images.unsplash.com/photo-1519278409-1f56ab241a7d?w=400&q=80" },
          { id: "k-s2", name: "Rainbow Hoodie", price: 32, oldPrice: 42, desc: "Brushed fleece, kangaroo pocket", img: "https://images.unsplash.com/photo-1503944168849-8bf86875bbd8?w=400&q=80" },
          { id: "k-s3", name: "Striped Long Sleeve", price: 22, oldPrice: 30, desc: "Soft jersey, ribbed cuffs", img: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&q=80" },
          { id: "k-s4", name: "Flannel Plaid Shirt", price: 25, oldPrice: 35, desc: "Soft organic flannel, button-up front", img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80" },
          { id: "k-s5", name: "Embroidered Knit Top", price: 28, oldPrice: 38, desc: "Cute floral accents, scalloped collar", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80" },
          { id: "k-s6", name: "Striped Long Sleeve", price: 22, oldPrice: 30, desc: "Soft jersey, ribbed cuffs", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&q=80" },
          { id: "k-s7", name: "Flannel Plaid Shirt", price: 25, oldPrice: 35, desc: "Soft organic flannel, button-up front", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=80" },
        ],
      },
      trousers: {
        label: "Bottoms", emoji: "👖", items: [
          { id: "k-t1", name: "Elastic Joggers", price: 25, oldPrice: 32, desc: "French terry, elastic waist", img: "https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=400&q=80" },
          { id: "k-t2", name: "Denim Shortalls", price: 40, oldPrice: 52, desc: "Stretch denim, adjustable straps", img: "https://images.unsplash.com/photo-1468820153901-27f1c5dcafd4?w=400&q=80" },
          { id: "k-t3", name: "Cargo Shorts", price: 28, oldPrice: 36, desc: "Ripstop, velcro side pockets", img: "https://images.unsplash.com/photo-1577253313708-cab167d2c474?w=400&q=80" },
          { id: "k-t4", name: "Corduroy Overall Dress", price: 35, oldPrice: 48, desc: "Adjustable straps, front pouch pocket", img: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&q=80" },
          { id: "k-t5", name: "Chino Work Shorts", price: 22, oldPrice: 30, desc: "Durable twill, elastic button adjusters", img: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&q=80" },
          { id: "k-t6", name: "Cargo Shorts", price: 28, oldPrice: 36, desc: "Ripstop, velcro side pockets", img: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80" },
          { id: "k-t7", name: "Corduroy Overall Dress", price: 35, oldPrice: 48, desc: "Adjustable straps, front pouch pocket", img: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&q=80" },
        ],
      },
      belts: {
        label: "Belts", emoji: "🪢", items: [
          { id: "k-b1", name: "Cartoon Buckle Belt", price: 12, oldPrice: 18, desc: "Woven, fun character buckle", img: "https://images.unsplash.com/photo-1566454825481-4e48f76b5d7e?w=400&q=80" },
          { id: "k-b2", name: "Glitter Elastic Belt", price: 14, oldPrice: 20, desc: "Sparkly elastic webbing, heart-shape clasp", img: "https://images.unsplash.com/photo-1503919005314-30d93d07d823?w=400&q=80" },
          { id: "k-b3", name: "Braided Cotton Belt", price: 15, oldPrice: 22, desc: "Colorful cotton cord, brass hardware", img: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&q=80" },
          { id: "k-b4", name: "Reversible Casual Belt", price: 16, oldPrice: 24, desc: "Two-tone webbed strap, steel buckle", img: "https://images.unsplash.com/photo-1519689680058-324335c77ebe?w=400&q=80" },
          { id: "k-b5", name: "Classic Toddler Suspenders", price: 18, oldPrice: 26, desc: "Y-back elastic strap, heavy-duty clips", img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&q=80" },
          { id: "k-b6", name: "Braided Cotton Belt", price: 15, oldPrice: 22, desc: "Colorful cotton cord, brass hardware", img: "https://images.unsplash.com/photo-1516624683217-fb350018f257?w=400&q=80" },
          { id: "k-b7", name: "Reversible Casual Belt", price: 16, oldPrice: 24, desc: "Two-tone webbed strap, steel buckle", img: "https://images.unsplash.com/photo-1537678122166-41639d7ef2aa?w=400&q=80" },
        ],
      },
      caps: {
        label: "Headwear", emoji: "🧢", items: [
          { id: "k-c1", name: "Dino Baseball Cap", price: 15, oldPrice: 22, desc: "Cotton twill, embroidered dino", img: "https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=400&q=80" },
          { id: "k-c2", name: "Sun Protection Hat", price: 20, oldPrice: 28, desc: "UPF 50+, wide brim", img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80" },
          { id: "k-c3", name: "Cozy Knit Ear Hat", price: 18, oldPrice: 25, desc: "Soft fleece lining, cute bear ear details", img: "https://images.unsplash.com/photo-1545601445-4d6a5a04d9e6?w=400&q=80" },
          { id: "k-c4", name: "Straw Sun Visor", price: 16, oldPrice: 24, desc: "Open-top weave, velcro strap back", img: "https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?w=400&q=80" },
          { id: "k-c5", name: "Waterproof Rain Hat", price: 22, oldPrice: 30, desc: "Wide brim, toggle drawstring chin strap", img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80" },
          { id: "k-c6", name: "Cozy Knit Ear Hat", price: 18, oldPrice: 25, desc: "Soft fleece lining, cute bear ear details", img: "https://images.unsplash.com/photo-1604949506655-64402b535805?w=400&q=80" },
          { id: "k-c7", name: "Straw Sun Visor", price: 16, oldPrice: 24, desc: "Open-top weave, velcro strap back", img: "https://images.unsplash.com/photo-1565463934784-d90b8f1f0057?w=400&q=80" },
        ],
      },
      shoes: {
        label: "Footwear", emoji: "👟", items: [
          { id: "k-sh1", name: "Light-Up Sneakers", price: 55, oldPrice: 70, desc: "LED outsole, velcro close", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
          { id: "k-sh2", name: "Velcro Sandals", price: 38, oldPrice: 50, desc: "Quick-dry, adjustable strap", img: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&q=80" },
          { id: "k-sh3", name: "Rain Boots", price: 42, oldPrice: 55, desc: "Natural rubber, easy-pull tab", img: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&q=80" },
          { id: "k-sh4", name: "Canvas Slip-On Loafer", price: 35, oldPrice: 46, desc: "Breathable canvas upper, flexible outsole", img: "https://images.unsplash.com/photo-1514989940723-e8e5163ccbe8?w=400&q=80" },
          { id: "k-sh5", name: "Classic High-Top Sneaker", price: 48, oldPrice: 62, desc: "Lace closure with side zipper for easy on/off", img: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&q=80" },
          { id: "k-sh6", name: "Rain Boots", price: 42, oldPrice: 55, desc: "Natural rubber, easy-pull tab", img: "https://images.unsplash.com/photo-1510832427230-67c254546089?w=400&q=80" },
          { id: "k-sh7", name: "Canvas Slip-On Loafer", price: 35, oldPrice: 46, desc: "Breathable canvas upper, flexible outsole", img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&q=80" },
        ],
      },
    },
  },
};

// Flatten catalogue into a searchable array
export const ALL_PRODUCTS = [];
for (const [sk, sec] of Object.entries(CATALOGUE))
  for (const [ck, cat] of Object.entries(sec.categories))
    for (const item of cat.items)
      ALL_PRODUCTS.push({ ...item, section: sk, sectionLabel: sec.label, category: ck, categoryLabel: cat.label, emoji: cat.emoji });

export const AGENT_TOOLS = [
  {
    name: "search_products",
    description: "Search catalogue by section, category, price or keywords.",
    input_schema: {
      type: "object",
      properties: {
        section: { type: "string", enum: ["men", "women", "children", "all"] },
        category: { type: "string" },
        maxPrice: { type: "number" },
        minPrice: { type: "number" },
        keywords: { type: "array", items: { type: "string" } },
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
        quantity: { type: "number" },
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
    description: "Open the USDC checkout flow on Arc.",
    input_schema: { type: "object", properties: {} },
  },
];
