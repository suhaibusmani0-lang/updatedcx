import { connectDB } from "@/lib/databaseConnection";
import CategoryModel from "@/models/Category.model";
import CategoryCarousel from "./CategoryCarousel"; // 🔥 Naya component yahan import kiya

// Define proper types[cite: 1]
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

  // Handle empty state[cite: 1]
  if (!categories || categories.length === 0) {
    return (
      <section className="bg-[#FAF7F2] py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
          <div className="mb-8 sm:mb-10 text-center">
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
    <section className="bg-[#FAF7F2] py-1 sm:py-1 md:py-2 lg:py-2 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Header section[cite: 1] */}
        <div className="mb-2 sm:mb-2 flex items-center justify-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A]">Shop by Category</h2>
        </div>

        {/* 🔥 Carousel yahan render ho raha hai jisme aapka exactly same styling aur layout hai */}
        <CategoryCarousel categories={categories} />

      </div>
    </section>
  );
}