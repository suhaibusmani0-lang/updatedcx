"use client";

import Link from "next/link";
import {
  Award,
  Users,
  Briefcase,
  Rocket,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
} from "lucide-react";

const stats = [
  { number: "15+", label: "Years Experience" },
  { number: "1000+", label: "Products Delivered" },
  { number: "500+", label: "Happy Customers" },
  { number: "50+", label: "Premium Collections" },
];

const features = [
  {
    icon: <Award size={30} />,
    title: "Premium Quality",
    description:
      "Every product is crafted with exceptional attention to detail and superior quality materials.",
  },
  {
    icon: <Users size={30} />,
    title: "Trusted Brand",
    description:
      "Serving customers with a commitment to excellence, thoughtful design, and customer satisfaction.",
  },
  {
    icon: <Rocket size={30} />,
    title: "Innovative Designs",
    description:
      "Combining timeless elegance with modern aesthetics to create distinctive décor solutions.",
  },
  {
    icon: <Briefcase size={30} />,
    title: "Customer Support",
    description:
      "Dedicated assistance to help make every shopping experience simple and enjoyable.",
  },
];

const values = [
  "Quality Craftsmanship",
  "Customer Satisfaction",
  "Innovation",
  "Integrity",
  "Excellence",
  "Trust",
];

export default function AboutPage() {
  return (
    <main className="bg-[#FAF7F2] text-[#1A1A1A]">
      {/* Hero */}
      <section className="border-b border-[#E3D9C9] bg-[#F1EBE1]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24 lg:px-10">
          <div className="max-w-4xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8B6F52]">
              About Cosmopolitan Xccessories
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Crafting Elegance For Modern Living
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f5a52] sm:text-lg">
              Discover premium Bakhoor, luxury incense burners, fragrances and
              elegant home décor collections designed to bring warmth,
              character and sophistication to every space.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[#1A1A1A] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#8B6F52]"
              >
                Explore Collection <ArrowRight size={17} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-[#1A1A1A] bg-transparent px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#1A1A1A] transition hover:bg-[#1A1A1A] hover:text-white"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div className="overflow-hidden border border-[#E3D9C9] bg-[#F1EBE1]">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
              alt="Cosmopolitan Xccessories collection"
              className="block h-full min-h-[360px] w-full object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B6F52]">
              Our Story
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Cosmopolitan Xccessories — Crafting Elegance Since 2010
            </h2>
            <div className="mt-6 space-y-5 text-[15px] leading-7 text-[#625d55]">
              <p>
                Cosmopolitan Xccessories is dedicated to premium Bakhoor,
                luxury incense burners and distinctive home décor collections.
                Our approach brings together thoughtful design, quality
                materials and an appreciation for timeless interiors.
              </p>
              <p>
                From statement décor pieces to everyday accents, each collection
                is selected to add warmth, character and sophistication to modern
                living spaces.
              </p>
              <p>
                Quality remains at the heart of everything we do. We focus on
                dependable products, clear service and a customer experience
                built around trust and consistency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[#E3D9C9] bg-[#F1EBE1] py-14 sm:py-18">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden border border-[#E3D9C9] bg-[#E3D9C9] px-5 sm:px-8 lg:grid-cols-4 lg:px-10">
          {stats.map((item) => (
            <div key={item.label} className="bg-[#FAF7F2] px-5 py-8 text-center sm:py-10">
              <h3 className="text-4xl font-bold sm:text-5xl">{item.number}</h3>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#777067]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B6F52]">
              The Cosmopolitan Standard
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Why Choose Us</h2>
            <p className="mt-4 leading-7 text-[#625d55]">
              Combining craftsmanship, thoughtful design and premium quality to
              deliver products made for beautiful spaces.
            </p>
          </div>

          <div className="grid gap-px border border-[#E3D9C9] bg-[#E3D9C9] md:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <div
                key={item.title}
                className="group bg-[#FAF7F2] p-7 transition-colors hover:bg-[#1A1A1A] hover:text-white sm:p-8"
              >
                <div className="mb-6 text-[#8B6F52] transition-colors group-hover:text-[#F1EBE1]">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[#6b655d] transition-colors group-hover:text-white/75">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-[#E3D9C9] bg-[#F1EBE1] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8B6F52]">
              What We Stand For
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Our Core Values</h2>
          </div>
          <div className="grid gap-px border border-[#E3D9C9] bg-[#E3D9C9] sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div key={value} className="flex items-center gap-4 bg-[#FAF7F2] p-6">
                <CheckCircle className="shrink-0 text-[#8B6F52]" size={24} />
                <h3 className="font-semibold">{value}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
          <div className="border border-[#E3D9C9] bg-[#1A1A1A] p-8 text-center text-white sm:p-12 lg:p-16">
            <div className="mb-6 flex justify-center gap-1 text-[#F1EBE1]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={19} fill="currentColor" />
              ))}
            </div>
            <p className="mx-auto max-w-3xl text-xl leading-8 sm:text-2xl">
              “Exceptional craftsmanship, premium quality and outstanding
              service — made for customers who appreciate elegance and detail.”
            </p>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[#D8D1C7]">
              Cosmopolitan Xccessories
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E3D9C9] bg-[#F1EBE1] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Elevate Your Space With Elegance
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#625d55]">
            Explore our premium collection of Bakhoor, incense burners and
            luxury home décor products.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#1A1A1A] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#8B6F52]"
            >
              Explore Collection <ArrowRight size={17} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-[#1A1A1A] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] hover:bg-[#1A1A1A] hover:text-white"
            >
              <Phone size={17} /> Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
