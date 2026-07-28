"use client";

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
      "Serving customers since 2010 with a commitment to excellence and customer satisfaction.",
  },
  {
    icon: <Rocket size={30} />,
    title: "Innovative Designs",
    description:
      "Combining traditional elegance with modern aesthetics to create unique décor solutions.",
  },
  {
    icon: <Briefcase size={30} />,
    title: "Customer Support",
    description:
      "Dedicated assistance to ensure a seamless and enjoyable shopping experience.",
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

const team = [
  {
    name: "Founder",
    role: "Visionary Leader",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
  },
  {
    name: "Design Team",
    role: "Creative Experts",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  },
  {
    name: "Support Team",
    role: "Customer Success",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#000] via-black/80 to-[#e2e2e2] text-white">
        <div className="container mx-auto px-6 py-28">
          <div className="max-w-4xl">
            <span className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm mb-6">
              About Cosmopolitan Xccessories
            </span>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Crafting Elegance For Modern Living
            </h1>

            <p className="text-lg md:text-xl text-[#f3d8c8] max-w-2xl mb-8">
              Discover premium Bakhoor, luxury incense burners, and elegant
              home décor collections designed to bring beauty, warmth, and
              sophistication to every space.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="bg-white text-[#000] px-6 py-3 rounded-xl font-semibold hover:scale-105 transition">
                Explore Collection
              </button>

              <button className="border border-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-[#000] transition">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
                alt="Cosmopolitan Xccessories"
                className="rounded-3xl shadow-2xl w-full"
              />
            </div>

            <div>
              <span className="text-[#000] font-semibold uppercase tracking-wider">
                Our Story
              </span>

              <h2 className="text-4xl font-bold mt-4 mb-6">
                Cosmopolitan Xccessories – Crafting Elegance Since 2010
              </h2>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Since 2010, Cosmopolitan Xccessories has been dedicated to
                creating premium Bakhoor, luxury incense burners, and
                distinctive home décor collections. Renowned for quality
                craftsmanship and customer-centric service, we have built a
                trusted reputation among customers who value elegance,
                authenticity, and superior design.
              </p>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Our extensive collection includes luxury incense burners,
                decorative home accents, spiritual décor, Bakhoor accessories,
                and thoughtfully designed home décor articles. Every product is
                crafted with meticulous attention to detail, ensuring
                exceptional quality, durability, and timeless aesthetic appeal.
              </p>

              <p className="text-gray-600 leading-relaxed">
                Quality remains at the heart of everything we do. We carefully
                select premium materials and maintain strict manufacturing
                standards to ensure every product exceeds customer expectations.
                Our commitment extends beyond products as we build long-term
                relationships through trust, consistency, and outstanding
                customer service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 text-center shadow-md hover:shadow-xl transition"
              >
                <h3 className="text-5xl font-bold text-[#000] mb-3">
                  {item.number}
                </h3>
                <p className="text-gray-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-gray-600">
              Combining craftsmanship, innovation, and premium quality to
              deliver exceptional products.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item, index) => (
              <div
                key={index}
                className="group bg-white border rounded-3xl p-8 hover:bg-[#000] hover:text-white transition-all duration-300 shadow-md"
              >
                <div className="mb-6 text-[#000] group-hover:text-white">
                  {item.icon}
                </div>

                <h3 className="font-bold text-xl mb-4">{item.title}</h3>

                <p className="text-gray-600 group-hover:text-white">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="border rounded-3xl p-8 hover:shadow-xl transition"
              >
                <CheckCircle
                  className="text-[#000] mb-4"
                  size={30}
                />
                <h3 className="font-bold text-xl">{value}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-slate-50 py-24 hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl overflow-hidden shadow-lg hover:-translate-y-2 transition"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-80 object-cover"
                />

                <div className="p-6">
                  <h3 className="font-bold text-2xl">{member.name}</h3>

                  <p className="text-[#000] mt-2">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#000] to-[#8b5a3c] rounded-3xl p-12 text-white text-center">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={22} fill="white" />
              ))}
            </div>

            <p className="text-2xl leading-relaxed mb-8">
              "Exceptional craftsmanship, premium quality, and outstanding
              service. Cosmopolitan Xccessories has transformed our living
              spaces with elegance and sophistication."
            </p>

            <h4 className="font-bold text-xl">Happy Customer</h4>
            <p>Premium Home Décor Collection</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-24">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-5xl font-bold mb-6">
            Elevate Your Space With Elegance
          </h2>

          <p className="text-slate-300 text-lg mb-10">
            Explore our premium collection of Bakhoor, incense burners, and
            luxury home décor products.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <button className="bg-[#000] px-8 py-4 rounded-xl font-semibold flex items-center gap-2">
              Explore Collection
              <ArrowRight size={18} />
            </button>

            <button className="border border-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2">
              <Phone size={18} />
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}