import HeroSlider from "@/components/website/HeroSlider";
import PromiseStrip from "@/components/website/PromiseStrip";
import CategoryGrid from "@/components/website/CategoryGrid";
import HomePageCenterItem from "@/components/website/HomePageCenterItem";
import ProductGrid from "@/components/website/ProductGrid";
import HomeAdPopup from "@/components/website/HomeAdPopup";

export const dynamic = "force-dynamic";

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