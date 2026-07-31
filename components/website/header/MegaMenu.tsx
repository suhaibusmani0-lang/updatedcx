// components/MegaMenu.tsx
"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import type { MenuItem } from "@/data/menuData";

export default function MegaMenu({ menuData }: { menuData: MenuItem[] }) {
  return (
    <div className="hidden lg:block text-[#000]">
      <div className="max-w-[1600px] mx-auto ">
        <NavigationMenu className="max-w-full">
          <NavigationMenuList className="flex items-center justify-right text-[#000] text-bold gap-4">
            {menuData.map((item) => (
              <NavigationMenuItem key={item.label}>
                {item.categories.length > 0 ? (
                  <>
                    <NavigationMenuTrigger
                      className="
                        bg-transparent
                        hover:bg-transparent
                        focus:bg-transparent
                        data-[state=open]:bg-transparent
                        text-black
                        font-bold
                        hover:text-[#000]
                        text-[11px]
                        uppercase
                        tracking-[2px]
                        font-normal
                        px-0
                      "
                    ><Link
                    href={item.href}
                  >
                      {item.label}
                    </Link>
                    </NavigationMenuTrigger>

                    <NavigationMenuContent>
                      <div className="w-[900px] bg-white shadow-2xl p-10">
                        <div className="grid grid-cols-3 gap-x-16 gap-y-10">
                          {item.categories.map((category) => (
                            <div key={category.title}>
                              <Link
                                href={category.href}
                                className="text-black font-semibold mb-4 block hover:text-gray-600 transition"
                              >
                                {category.title}
                              </Link>

                              <ul className="space-y-2">
                                {category.links.map((link) => (
                                  <li key={link.label}>
                                    <Link
                                      href={link.href}
                                      className="
                                        text-sm
                                        text-gray-600
                                        hover:text-black
                                        transition
                                      "
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="
                      text-black
                      hover:text-black
                      text-[11px]
                      uppercase
                      tracking-[2px]
                      transition
                    "
                  >
                    {item.label}
                  </Link>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}