import React from "react";
import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen w-full flex overflow-hidden">

      {/* Left side (Form) */}
      <div className="w-full md:w-1/2 h-full flex items-center justify-center p-6 bg-white overflow-hidden">
        {children}
      </div>

      {/* Right side (Image) */}
      <div className="hidden md:flex w-1/2 h-full relative overflow-hidden">
        <Image
          src="/assets/images/login-image.jpg"
          alt="Login visual"
          fill
          className="object-cover"
          sizes="50vw"
          priority
        />
      </div>

    </div>
  );
};

export default Layout;