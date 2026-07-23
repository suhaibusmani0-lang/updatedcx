import React from 'react'
import Marquee from "react-fast-marquee";
const TopBar = () => {
  return (
    
    <>
    <div className="hidden sm:block bg-[#e2e2e2] text-black py-1.5">
      <Marquee speed={50} gradient={false}>
        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Free shipping on orders above ₹2,999 · Easy 30-day returns
        </span>

        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Free shipping on orders above 20% off · Easy 30-day returns
        </span>
        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Free shipping on orders above 50% off · Easy 30-day returns
        </span>
      </Marquee>
    </div>

    </>
  )
}

export default TopBar