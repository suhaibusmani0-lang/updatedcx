import React from 'react'
import Marquee from "react-fast-marquee";
const TopBar = () => {
  return (
    
    <>
    <div className="hidden sm:block bg-[#e2e2e2] text-black py-1.5">
      <Marquee speed={50} gradient={false}>
        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Complimentary Shipping on Orders Over ₹1,499 · Hassle-Free 7-Day Returns
        </span>

        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Enjoy Flat 10% Off on All Prepaid Orders · Seamless 7-Day Returns
        </span>
        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Complimentary Shipping on Orders Over ₹1,499 · Hassle-Free 7-Day Returns
        </span>
      </Marquee>
    </div>

    </>
  )
}

export default TopBar