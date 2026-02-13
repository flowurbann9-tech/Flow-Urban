export const STORE = {
  name: "Flow Urban",
  slogan: "Authentic store",

  // ECUADOR: 593 + tu número SIN el 0, sin +, sin espacios
  // Ventas 1 y Ventas 2 (YA CONFIGURADOS)
  whatsappSales1: "593962722395", // 0987771119
  whatsappSales2: "593987771119", // 0962722395

  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",

  // Envío fijo (si no quieres fijo, déjalo en 0 y confirmas por WhatsApp)
  shippingFlat: 0,

  // Ecuador usa USD
  currency: "USD",
};

export const PRODUCTS = [
  {
    id: "FU-001",
    name: "Camiseta Oversize 'Neon Flow'",
    category: "Camisetas",
    price: 19.99,
    badge: "Nuevo",
    sizes: ["S", "M", "L", "XL"],
    desc: "Corte oversize, suave y pesada. Vibra street con flow.",
    image: "assets/products/prod1.jpg",
  },
  {
    id: "FU-002",
    name: "Hoodie 'Midnight Urban'",
    category: "Hoodies",
    price: 39.99,
    badge: "Top",
    sizes: ["S", "M", "L", "XL"],
    desc: "Hoodie premium. Ideal para noches frías y looks duros.",
    image: "assets/products/prod2.jpg",
  },
  {
    id: "FU-003",
    name: "Jogger 'Street Fit'",
    category: "Pantalones",
    price: 29.99,
    badge: "",
    sizes: ["S", "M", "L", "XL"],
    desc: "Jogger cómodo con vibra urbana. Perfecto para daily wear.",
    image: "assets/products/prod3.jpg",
  },
  {
    id: "FU-004",
    name: "Gorra 'FU Classic'",
    category: "Accesorios",
    price: 14.99,
    badge: "",
    sizes: ["Única"],
    desc: "Ajustable. Básico que combina con todo.",
    image: "assets/products/prod4.jpg",
  }
    {
    id: "FU-005",
    name: "Gorra 'FU Classic'",
    category: "Accesorios",
    price: 14.99,
    badge: "",
    sizes: ["Única"],
    desc: "Ajustable. Básico que combina con todo.",
    image: "assets/products/prod5.jpg",
      }
];
document.getElementById("btnVentas1")?.addEventListener("click", () => {
  alert("Ventas 1");
});

document.getElementById("btnVentas2")?.addEventListener("click", () => {
  alert("Ventas 2");
});
