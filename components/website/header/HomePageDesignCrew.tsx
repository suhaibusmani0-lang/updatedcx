import React from "react";
import Link from "next/link";
import Image from "next/image";

interface HomePageDesignCrewProps {
  imageSrc?: string;   // optional – if not provided, shows a placeholder
  imageAlt?: string;
}

const HomePageDesignCrew = ({
  imageSrc = "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800&q=80", // fallback
  imageAlt = "Design Crew",
}: HomePageDesignCrewProps) => {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 bg-gray-100/80 px-4 py-1.5 rounded-full mb-4">
              DESIGN CREW
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                Let Us Bring Your Vision to Life
              </span>
            </h2>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
              You have the dream and we have the expert advice. Together, we'll
              make home your favorite destination.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/book-appointment"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-full transition duration-300 shadow-sm hover:shadow-md"
              >
                BOOK AN APPOINTMENT
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-transparent hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-300 transition duration-300"
              >
                Quick Question? Let's Chat
              </Link>
            </div>
          </div>

          {/* Right side – dynamic image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-square  overflow-hidden">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePageDesignCrew;