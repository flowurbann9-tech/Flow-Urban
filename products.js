export const STORE = {
  name: "Flow Urban",
  slogan: "Authentic store",

  // ECUADOR: 593 + tu número SIN el 0, sin +, sin espacios
  whatsappSales1: "593987771119",
  whatsappSales2: "593962722395",

  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",

  currency: "USD",
};

// IMPORTANTE:
// mediaType: "image" o "video"
// media: ruta del archivo (ej: "assets/products/miFoto.jpg" o "assets/videos/miVideo.mp4")
// Si no tienes media todavía, déjalo vacío "" y saldrá un cuadro placeholder (para “insertar foto”).
export const PRODUCTS = [
  {
    id: "FU-001",
    name: "Camiseta Oversize 'Neon Flow'",
    category: "Camisetas",
    price: 19.99,
    badge: "Nuevo",
    sizes: ["S", "M", "L", "XL"],
    desc: "Corte oversize, suave y pesada. Vibra street con flow.",
    mediaType: "image",
    media: "", // <-- pon tu foto aquí
  },
  {
    id: "FU-002",
    name: "Hoodie 'Midnight Urban'",
    category: "Hoodies",
    price: 39.99,
    badge: "Top",
    sizes: ["S", "M", "L", "XL"],
    desc: "Hoodie premium. Ideal para noches frías y looks duros.",
    mediaType: "video",
    media: "", // <-- o un video .mp4
  },
  {
    id: "FU-003",
    name: "Jogger 'Street Fit'",
    category: "Pantalones",
    price: 29.99,
    badge: "",
    sizes: ["S", "M", "L", "XL"],
    desc: "Jogger cómodo, fit street, combina con todo.",
    mediaType: "image",
    media: "",
  },
  {
    id: "FU-004",
    name: "Gorra 'Logo Classic'",
    category: "Accesorios",
    price: 14.99,
    badge: "",
    sizes: ["U"],
    desc: "Básico premium, logo al frente.",
    mediaType: "image",
    media: "",
  },
];
