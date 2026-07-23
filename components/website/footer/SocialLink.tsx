import Link from "next/link";
import {
  FaInstagram,
  FaFacebookF,
  FaPinterest,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IconType } from "react-icons";

interface SocialLink {
  icon: IconType;
  href: string;
  label: string;
}

const socialLinks: SocialLink[] = [
  {
    icon: FaInstagram,
    href: "https://www.instagram.com/cosmopolitanxccessories?igsh=d3p5MHA4eTV1bWNr",
    label: "Instagram",
  },
  {
    icon: FaFacebookF,
    href: "https://www.facebook.com/share/1D2MFNpEFd/",
    label: "Facebook",
  },
  {
    icon: FaXTwitter,
    href: "https://x.com/CosmopolitanXc",
    label: "X",
  },
  {
    icon: FaPinterest,
    href: "https://pin.it/KLpdIKRWn",
    label: "Pinterest",
  },
  {
    icon: FaYoutube,
    href: "https://www.youtube.com/@Cosmopolitanxccessories",
    label: "YouTube",
  },
];

const SocailLink = () => {
  return (
    <div className="flex items-center gap-3">
      {socialLinks.map((social) => {
        const Icon = social.icon;

        return (
          <Link
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="w-10 h-10 rounded-full border border-[#1A1A1A]/30 flex items-center justify-center text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
          >
            <Icon size={18} />
          </Link>
        );
      })}
    </div>
  );
};

export default SocailLink;