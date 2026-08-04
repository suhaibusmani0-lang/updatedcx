import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/databaseConnection";
import CategoryModel from "@/models/Category.model";

// Define proper types
interface CategoryImage {
  url: string;
  alt?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: CategoryImage;
  description?: string;
}

async function getCategories(): Promise<Category[]> {
  const timeoutPromise = new Promise<Category[]>((resolve) =>
    setTimeout(() => resolve([]), 10000)
  );
  
  const fetchPromise = (async () => {
    try {
      await connectDB();
      
      const categories = await CategoryModel.find({ 
        isActive: true, 
        isDeleted: false,
        parent: null 
      })
        .sort({ createdAt: -1 })
        .lean();
        
      return JSON.parse(JSON.stringify(categories)) as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [] as Category[];
    }
  })();

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return [];
  }
}

export default async function CategoryGrid() {
  const categories = await getCategories();

  // Handle empty state
  if (!categories || categories.length === 0) {
    return (
      <section className="bg-[#FAF7F2] py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A]">Shop by Category</h2>
          </div>
          <div className="text-center py-12">
            <p className="text-[#8B6F52]">No categories available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#FAF7F2] py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Header section */}
        <div className="mb-6 sm:mb-10 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A]">Shop by Category</h2>
        </div>

        {/* gap-[2px] for ultra-thin magazine style spacing */}
        <div className="flex overflow-x-auto gap-[2px] pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat: Category) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              // Sharp corners (no rounding) & perfect 4-column sizing on desktop
              className="group relative bg-[#1A1A1A] flex-none w-[85vw] sm:w-[48vw] md:w-[32vw] lg:w-[calc(25%-1.5px)] aspect-[4/5] snap-start overflow-hidden"
            >
              {/* Image Section */}
              {cat.image?.url ? (
                <div className="relative w-full h-full opacity-90 transition-opacity duration-500 group-hover:opacity-100">
                  <Image
                    src={cat.image.url}
                    alt={cat.image.alt || cat.name}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 48vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#D4C4B0]">
                  <span className="text-3xl text-[#8B6F52] font-semibold">
                    {cat.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* 🔥 MAGIC 1 FIXED: Inner White Border NOW ONLY SHOWS ON HOVER */}
              {/* Pehle border visible tha, ab `opacity-0` hai aur hover par `group-hover:opacity-100` hota hai */}
              <div className="absolute inset-4 sm:inset-5 border border-white z-10 pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* 🔥 MAGIC 2 FIXED: Clean Solid White Box WITHOUT hover color change */}
              {/* Yahan se maine hover properties hata di hain taaki text/box color same rahe */}
              <div className="absolute bottom-8 sm:bottom-12 inset-x-0 flex justify-center z-20">
                <div className="bg-white text-[#1A1A1A] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] px-8 py-2.5 sm:px-10 sm:py-3 shadow-sm">
                  {cat.name}
                </div>
              </div>
            </Link>
          ))}
          
          {/* Spacer for mobile to not stick to the edge */}
          <div className="flex-none w-[2vw] sm:hidden"></div>
        </div>

      </div>
    </section>
  );
}