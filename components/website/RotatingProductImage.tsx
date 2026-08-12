"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
interface Props { images:{url:string}[]; alt:string; sizes:string; priority?:boolean; }
const TRANSITIONS=["translate-x","translate-y","scale","rotate"] as const;
export default function RotatingProductImage({images,alt,sizes,priority=false}:Props){
 const validImages=images?.filter(image=>Boolean(image?.url))||[];
 const [index,setIndex]=useState(0); const [transition,setTransition]=useState(0);
 useEffect(()=>{if(validImages.length<=1)return;const id=window.setInterval(()=>{setTransition(current=>(current+1)%TRANSITIONS.length);setIndex(current=>(current+1)%validImages.length);},4000);return()=>window.clearInterval(id);},[validImages.length]);
 if(!validImages.length)return <div className="absolute inset-0 flex items-center justify-center bg-[#D4C4B0]"><span className="text-2xl text-[#8B6F52] font-semibold">{alt.charAt(0).toUpperCase()}</span></div>;
 const getClassName=(imageIndex:number)=>{if(imageIndex===index)return "translate-x-0 translate-y-0 scale-100 rotate-0 opacity-100";const previousIndex=(index-1+validImages.length)%validImages.length;if(imageIndex!==previousIndex)return "translate-x-full translate-y-0 scale-100 rotate-0 opacity-0";switch(TRANSITIONS[transition]){case "translate-y":return "translate-x-0 -translate-y-full scale-100 rotate-0 opacity-0";case "scale":return "translate-x-0 translate-y-0 scale-110 rotate-0 opacity-0";case "rotate":return "translate-x-0 translate-y-0 scale-100 rotate-3 opacity-0";default:return "-translate-x-full translate-y-0 scale-100 rotate-0 opacity-0";}};
 return <div className="absolute inset-0 overflow-hidden">{validImages.map((image,imageIndex)=><div key={`${image.url}-${imageIndex}`} className={`absolute inset-0 transition-all duration-1000 ease-in-out motion-reduce:transition-none ${getClassName(imageIndex)}`} aria-hidden={imageIndex!==index}><Image src={image.url} alt={imageIndex===index?alt:""} fill sizes={sizes} priority={priority&&imageIndex===0} loading={priority&&imageIndex===0?undefined:"lazy"} className="object-cover"/></div>)}</div>;
}
