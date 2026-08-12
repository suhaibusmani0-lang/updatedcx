import HeroSlider from "@/components/website/HeroSlider";
import PromiseStrip from "@/components/website/PromiseStrip";
import CategoryGrid from "@/components/website/CategoryGrid";
import HomePageCenterItem from "@/components/website/HomePageCenterItem";
import ProductGrid from "@/components/website/ProductGrid";

import HomeAdPopup from "@/components/website/HomeAdPopup";

// 🚀 SPEED OPTIMIZATION: ISR Caching (1 Hour)
export const revalidate = 3600; 

export default function Home() {
  return (
    <>
      <HomeAdPopup />
      <HeroSlider />
      <PromiseStrip />
      <CategoryGrid />
      <HomePageCenterItem />
      <ProductGrid />
    </>
  );
}