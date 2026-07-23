export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: "New" | "Sale";
};

export type Category = {
  id: string;
  name: string;
  image: string;
  href: string;
};

export const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export const categories: Category[] = [
  { id: "1", name: "Women", image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80", href: "/women" },
  { id: "2", name: "Men", image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&q=80", href: "/men" },
  { id: "3", name: "Living", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80", href: "/living" },
  { id: "4", name: "Bedroom", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80", href: "/bedroom" },
  { id: "5", name: "Accessories", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80", href: "/accessories" },
  { id: "6", name: "Kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", href: "/kitchen" },
];

export const products: Product[] = [
  { id: "1", name: "Linen Blazer", category: "Women", price: 7990, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80", badge: "New" },
  { id: "2", name: "Merino Crewneck", category: "Men", price: 5490, image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=600&q=80", badge: "New" },
  { id: "3", name: "Ceramic Vase Set", category: "Living", price: 3290, originalPrice: 4490, image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&q=80", badge: "Sale" },
  { id: "4", name: "Linen Cushion Cover", category: "Bedroom", price: 1890, image: "https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600&q=80", badge: "New" },
  { id: "5", name: "Leather Tote", category: "Accessories", price: 9990, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80" },
  { id: "6", name: "Cotton Midi Dress", category: "Women", price: 4990, originalPrice: 6490, image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80", badge: "Sale" },
  { id: "7", name: "Slim Chinos", category: "Men", price: 3990, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80", badge: "New" },
  { id: "8", name: "Wooden Serving Board", category: "Kitchen", price: 2490, image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80" },
];
