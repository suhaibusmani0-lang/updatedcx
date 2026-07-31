import React from 'react'
import Marquee from "react-fast-marquee";

const TopBar = () => {
  return (
    <>
    <div className="bg-[#AEAA9B] text-black py-1.5 font-sans">
      <Marquee speed={50} gradient={false}>
        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Free Shipping on All Orders · Hassle-Free 7-Day Returns
        </span>

        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Enjoy Flat 10% Off on All Prepaid Orders · Seamless 7-Day Returns
        </span>
        
        
        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Premium Gift Wrapping Also Available 
        </span>
        
        <span className="mx-8 text-[10px] sm:text-xs tracking-widest uppercase">
          Free Shipping on All Orders · Hassle-Free 7-Day Returns
        </span>
      </Marquee>
    </div>
    </>
  )
}

export default TopBar