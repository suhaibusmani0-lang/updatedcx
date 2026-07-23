// components/footer/LinkSection.tsx
import { footerLinks } from "@/data/footerData";

export function LinkSection({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-[10px] sm:text-xs tracking-widest uppercase font-semibold mb-3 sm:mb-4 text-[#1A1A1A]">
        {title}
      </p>
      <ul className="space-y-2 sm:space-y-2.5">
        {links.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              className="text-xs sm:text-sm text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
