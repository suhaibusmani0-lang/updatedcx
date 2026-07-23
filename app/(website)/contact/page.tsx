"use client";

import {
  Phone,
  Mail,
  MapPin,
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

export default function ContactPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#000] via-black/80 to-[#e2e2e2] text-white">
        <div className="container mx-auto px-6 py-28 text-center">
          <span className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm mb-6">
            Contact Us
          </span>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Let's Start A Conversation
          </h1>

          <p className="max-w-3xl mx-auto text-lg md:text-xl text-[#f3d8c8]">
            We're here to answer your questions and help you find the perfect
            products for your home and lifestyle.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Phone size={28} />,
                title: "Call Us",
                value: "+91 8595124718",
              },
              {
                icon: <Mail size={28} />,
                title: "Email Us",
                value: "support@cosmoxs.com",
              },
              // {
              //   icon: <MapPin size={28} />,
              //   title: "Visit Us",
              //   value: "Dubai, UAE",
              // },
              {
                icon: <Clock size={28} />,
                title: "Working Hours",
                value: "Mon - Sat : 9AM - 7PM",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white border rounded-4xl p-8 text-center shadow-md hover:shadow-xl transition"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#000]/10 flex items-center justify-center text-[#000]">
                  {item.icon}
                </div>

                <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="pb-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-3xl shadow-xl p-10 border">
              <span className="text-[#000] font-semibold uppercase tracking-wider">
                Send Message
              </span>

              <h2 className="text-4xl font-bold mt-4 mb-8">
                Get In Touch
              </h2>

              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#000]"
                  />

                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#000]"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Subject"
                  className="w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#000]"
                />

                <textarea
                  rows={6}
                  placeholder="Write Your Message..."
                  className="w-full border rounded-xl px-5 py-4 focus:outline-none focus:border-[#000]"
                />

                <button
                  type="submit"
                  className="bg-[#000] text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2"
                >
                  Send Message
                  <Send size={18} />
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-[#000] to-[#000] rounded-3xl p-10 text-white">
              <h2 className="text-4xl font-bold mb-6">
                Contact Information
              </h2>

              <p className="text-white/90 leading-relaxed mb-10">
                Whether you're looking for premium Bakhoor, luxury incense
                burners, or elegant home décor solutions, our team is ready
                to assist you.
              </p>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <Phone />
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <p>+91 8595124718</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Mail />
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p>support@cosmoxs.com</p>
                  </div>
                </div>

                <div className="flex gap-4 hidden">
                  <MapPin />
                  <div>
                    <h4 className="font-semibold">Location</h4>
                    <p>Dubai, UAE</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="border-t border-white/20 mt-10 pt-8">
                <h4 className="font-semibold mb-4">Follow Us</h4>

                <div className="flex gap-4 flex-wrap">
                  <a
                    href="https://www.facebook.com/share/1D2MFNpEFd/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#000] transition"
                  >
                    <FaFacebookF />
                  </a>

                  <a
                    href="https://www.instagram.com/cosmopolitanxccessories?igsh=d3p5MHA4eTV1bWNr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#000] transition"
                  >
                    <FaInstagram />
                  </a>

                  <a
                    href="https://www.youtube.com/@Cosmopolitanxccessories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#000] transition"
                  >
                    <FaYoutube />
                  </a>

                  <a
                    href="https://x.com/CosmopolitanXc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#000] transition"
                  >
                    <FaXTwitter />
                  </a>

                  <a
                    href="https://pin.it/KLpdIKRWn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-[#000] transition"
                  >
                    <FaPinterestP />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}