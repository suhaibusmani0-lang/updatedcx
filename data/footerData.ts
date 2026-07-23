// data/footerData.ts

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  icon: string; // or React component type
  href: string;
  label: string;
}

export const footerLinks: FooterSection[] = [
  {
    title: "Shop",
    links: [
      { label: "New", href: "/category/New" },
      { label: "Decor", href: "/category/Decor" },
      { label: "Home Fragrance", href: "/category/Home Fragrance" },
      { label: "Bakhoor & Incense", href: "/category/bakhoor-incense" },
      { label: "Tabletop", href: "/category/tabletop-bar" },
      { label: "Outdoor", href: "/category/outdoor" },
    ],
  },
  {
    title: "CUSTOMER SERVICE",
    links: [
      { label: "Purchase Policy", href: "/purchase-policy" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Frequently Asked Questions", href: "/faqs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Business To Business", href: "/business-to-business" },
      { label: "Track Order", href: "https://panel.shipmozo.com/track-order" }
    ],
  },
];

export const socialLinks = [
  { icon: "FaInstagram", href: "https://instagram.com", label: "Instagram" },
  { icon: "FaXTwitter", href: "https://twitter.com", label: "Twitter" },
  { icon: "FaFacebookF", href: "https://facebook.com", label: "Facebook" },
];

export const legalLinks = [
       { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      
];

export const footerConfig = {
  brandName: "Cosmopolitan Xccessories",
  brandDescription: "A  curated blend of fashion and home — crafted for the way you live.A  curated blend of fashion and home — crafted for the way you live.A  curated blend of fashion and home — crafted for the way you live.",
  newsletterTitle: "Stay in the Loop",
  newsletterDescription: "New arrivals, exclusive offers — straight to your inbox.",
  newsletterPlaceholder: "Your email address",
};