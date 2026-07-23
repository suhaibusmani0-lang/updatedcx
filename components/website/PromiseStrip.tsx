import { Truck, RotateCcw, Leaf, ShieldCheck } from "lucide-react";

interface PromiseItem {
  icon: React.ElementType;
  title: string;
  sub: string;
}

const promises: PromiseItem[] = [
  { icon: Truck, title: "Free Shipping", sub: "On orders above ₹2,999" },
  { icon: RotateCcw, title: "Easy Returns", sub: "30-day hassle-free returns" },
  { icon: Leaf, title: "Sustainably Made", sub: "Responsible sourcing always" },
  { icon: ShieldCheck, title: "Secure Checkout", sub: "256-bit SSL encryption" },
];

export default function PromiseStrip() {
  return (
    <section className="bg-[#F1EBE1] border-y border-[#E3D9C9]" aria-label="Store promises and guarantees">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-5 sm:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {promises.map(({ icon: Icon, title, sub }) => (
            <div 
              key={title} 
              className="flex items-center gap-2 sm:gap-3 group"
            >
              <div className="flex-shrink-0 bg-[#e2e2e2]/10 rounded-full p-1.5 sm:p-2 transition-colors group-hover:bg-[#e2e2e2]/20">
                <Icon 
                  size={18} 
                  className="text-[#e2e2e2] sm:w-[22px] sm:h-[22px]" 
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs tracking-widest uppercase font-semibold text-[#1A1A1A] truncate">
                  {title}
                </p>
                <p className="text-[10px] sm:text-xs text-[#8B6F52] mt-0.5 leading-tight truncate sm:whitespace-normal">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
