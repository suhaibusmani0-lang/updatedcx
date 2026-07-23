import React from "react";
import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left side (Image - 50%) */}
      <div className="hidden md:flex w-1/2 h-screen relative overflow-hidden">
      <Image
        src="/assets/images/login-image.jpg"
        alt="Login visual"
        fill
        className="object-cover object-center"
        sizes="50vw"
        priority
      />
    </div>

      {/* Right side (Form - 50%) */}
      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Layout;