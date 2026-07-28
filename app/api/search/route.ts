import { NextResponse } from "next/server";
import { connectDB } from "@/lib/databaseConnection";
import ProductModel from "@/models/Product.model";
import CategoryModel from "@/models/Category.model";

type SearchItem = {
  title: string;
  description?: string;
  href: string;
  image?: string;
  price?: number;
};

const pageItems: SearchItem[] = [
  { title: "Home", description: "Visit the homepage", href: "/" },
  { title: "Products", description: "Browse the full product catalog", href: "/products" },
  { title: "About", description: "Learn more about us", href: "/about" },
  { title: "Contact", description: "Get in touch with the team", href: "/contact" },
  { title: "My Account", description: "Manage your account", href: "/my-account" },
  { title: "Checkout", description: "Review your cart and checkout", href: "/checkout" },
];

const linkItems: SearchItem[] = [
  { title: "Shop All Products", description: "Explore our full catalog", href: "/products" },
  { title: "Track Your Order", description: "Track your recent purchase", href: "/track-order" },
  { title: "Privacy Policy", description: "Read our privacy policy", href: "/privacy-policy" },
  { title: "Terms of Service", description: "Read our terms of service", href: "/terms-of-service" },
];

const blogItems: SearchItem[] = [
  { title: "Interior Styling Tips", description: "Fresh ideas for beautiful spaces", href: "/blog/interior-styling-tips" },
  { title: "Seasonal Decor Ideas", description: "Get inspired with the latest decor themes", href: "/blog/seasonal-decor-ideas" },
  { title: "Gift Guide", description: "Find thoughtful gifts for every occasion", href: "/blog/gift-guide" },
];

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function filterItems(items: SearchItem[], query: string) {
  return items.filter((item) => {
    const haystack = [item.title, item.description, item.href].filter(Boolean).join(" ");
    return matchesQuery(haystack, query);
  });
}

export async function GET(request: Request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({
      products: [],
      categories: [],
      pages: [],
      links: [],
      blogs: [],
    });
  }

  const regex = { $regex: q, $options: "i" };

  const products = await ProductModel.find({
    $or: [
      { name: regex },
      { slug: regex },
      { sku: regex },
      { description: regex },
      { shortDescription: regex },
    ],
  })
    .limit(8)
    .lean();

  const categories = await CategoryModel.find({
    $or: [{ name: regex }, { slug: regex }, { description: regex }],
  })
    .limit(8)
    .lean();

  const normalizedProductImages = (product: any) =>
    (product.images || [])
      .map((image: any) => (typeof image === "string" ? image : image?.url))
      .filter(Boolean);

  return NextResponse.json({
    products: products.map((product: any) => {
      const images = normalizedProductImages(product);
      return {
        _id: product._id?.toString(),
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: images[0] || "",
        images,
        description: product.description,
        href: `/product/${product.slug}`,
      };
    }),
    categories: categories.map((category: any) => ({
      _id: category._id?.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      href: `/category/${category.slug}`,
    })),
    pages: filterItems(pageItems, q),
    links: filterItems(linkItems, q),
    blogs: filterItems(blogItems, q),
  });
}
