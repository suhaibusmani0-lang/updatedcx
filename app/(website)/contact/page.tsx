"use client";

import {
  Phone,
  Mail,
  Clock,
  Send,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";

const contactCards = [
  { icon: Phone, title: "Call Us", value: "+91 8595124718" },
  { icon: Mail, title: "Email Us", value: "support@cosmoxs.com" },
  { icon: Clock, title: "Working Hours", value: "Mon - Sat : 10AM - 6PM" },
];

const socialLinks = [
  ["Facebook", "https://www.facebook.com/share/1D2MFNpEFd/", FaFacebookF],
  ["Instagram", "https://www.instagram.com/cosmopolitanxccessories?igsh=d3p5MHA4eTV1bWNr", FaInstagram],
  ["YouTube", "https://www.youtube.com/@Cosmopolitanxccessories", FaYoutube],
  ["X", "https://x.com/CosmopolitanXc", FaXTwitter],
  ["Pinterest", "https://pin.it/KLpdIKRWn", FaPinterestP],
] as const;

export default function ContactPage() {
  return (
    <main className="bg-[#FAF7F2] text-[#1A1A1A]">
      {/* Hero */}
      <section className="border-b border-[#E3D9C9] bg-[#F1EBE1]">
        <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 md:py-24 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B6F52]">
            Contact Us
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Let&apos;s Start A Conversation
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#625d55] sm:text-lg">
            Have a question about an order, product or collection? We&apos;re
            here to help and make your Cosmopolitan Xccessories experience
            simple.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-px border border-[#E3D9C9] bg-[#E3D9C9] px-5 sm:px-8 md:grid-cols-3 lg:px-10">
          {contactCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-[#FAF7F2] p-7 sm:p-8">
                <Icon className="mb-6 text-[#8B6F52]" size={27} />
                <h2 className="text-xl font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#625d55]">{item.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-16 sm:pb-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1.25fr_.75fr] lg:px-10">
          <div className="border border-[#E3D9C9] bg-white p-6 sm:p-9 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B6F52]">
              Send Message
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Get In Touch</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#625d55]">
              Send us your question and our team will get back to you as soon
              as possible.
            </p>

            <form className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full border border-[#D9D1C5] bg-[#FAF7F2] px-4 py-3.5 text-sm outline-none placeholder:text-[#918a80] focus:border-[#8B6F52]"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full border border-[#D9D1C5] bg-[#FAF7F2] px-4 py-3.5 text-sm outline-none placeholder:text-[#918a80] focus:border-[#8B6F52]"
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                className="w-full border border-[#D9D1C5] bg-[#FAF7F2] px-4 py-3.5 text-sm outline-none placeholder:text-[#918a80] focus:border-[#8B6F52]"
              />
              <textarea
                rows={6}
                placeholder="Write Your Message..."
                className="w-full resize-y border border-[#D9D1C5] bg-[#FAF7F2] px-4 py-3.5 text-sm outline-none placeholder:text-[#918a80] focus:border-[#8B6F52]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#1A1A1A] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#8B6F52]"
              >
                Send Message <Send size={17} />
              </button>
            </form>
          </div>

          <aside className="border border-[#E3D9C9] bg-[#1A1A1A] p-7 text-white sm:p-9 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D8D1C7]">
              Customer Support
            </p>
            <h2 className="mt-3 text-3xl font-bold">Contact Information</h2>
            <p className="mt-5 text-sm leading-7 text-white/70">
              Whether you&apos;re looking for premium Bakhoor, luxury incense
              burners or elegant home décor, our team is ready to assist you.
            </p>

            <div className="mt-9 space-y-6 border-t border-white/15 pt-7">
              <div className="flex gap-4">
                <Phone className="mt-0.5 shrink-0 text-[#D8D1C7]" size={21} />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="mt-1 text-sm text-white/70">+91 8595124718</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Mail className="mt-0.5 shrink-0 text-[#D8D1C7]" size={21} />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="mt-1 text-sm text-white/70">support@cosmoxs.com</p>
                </div>
              </div>
            </div>

            <div className="mt-9 border-t border-white/15 pt-7">
              <h3 className="font-semibold">Follow Us</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {socialLinks.map(([label, href, Icon]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center border border-white/25 text-white transition hover:border-white hover:bg-white hover:text-[#1A1A1A]"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
