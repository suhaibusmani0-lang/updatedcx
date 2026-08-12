import React from "react";
import Image from "next/image";
import Link from "next/link";

const HomePageTrending = () => {
  // ---------- Static product data (replace with your own) ----------
  const trendingProducts = [
    {
      id: "1",
      name: "Women",
      image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&q=80",
      href: "/women",
    },
    {
      id: "2",
      name: "Men",
      image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&q=80",
      href: "/men",
    },
    {
      id: "3",
      name: "Living",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
      href: "/living",
    },
    {
      id: "4",
      name: "Bedroom",
      image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&q=80",
      href: "/bedroom",
    },
    {
      id: "5",
      name: "Accessories",
      image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
      href: "/accessories",
    },
    
  ];

  // ---------- Optional: fetch data dynamically (uncomment to use) ----------
  // const [products, setProducts] = React.useState([]);
  // React.useEffect(() => {
  //   fetch('/api/trending')
  //     .then(res => res.json())
  //     .then(data => setProducts(data))
  //     .catch(err => console.error('Failed to fetch trending products:', err));
  // }, []);
  // const trendingProducts = products.length ? products : staticFallback;

  return (
    <section className="bg-gray-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
          <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
            Trending Now
          </span>
        </h2>
        <div className="w-16 h-1 bg-gradient-to-r from-gray-400 to-gray-600 mx-auto mb-10 rounded-full" />

        {/* Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {trendingProducts.map((product) => (
            <Link href={product.href} key={product.id} passHref>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                <div className="relative w-full h-40 sm:h-48 md:h-52">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base leading-tight">
                    {product.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomePageTrending;