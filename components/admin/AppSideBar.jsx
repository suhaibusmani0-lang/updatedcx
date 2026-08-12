"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { LuChevronRight } from "react-icons/lu";
import { IoMdClose } from "react-icons/io";
import { AdminSideBarMenu } from "@/lib/AdminSideBarMenu";

export const AppSideBar = () => {
  const menuItems = Object.values(AdminSideBarMenu);
  const { toggleSidebar, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  // Always close the mobile drawer after navigation. This keeps the existing
  // sidebar design intact while preventing the drawer from staying open
  // after a menu item is selected.
  React.useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const closeMobileSidebar = () => setOpenMobile(false);

  const handleNavigationCapture = (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("a[href]")) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <SidebarHeader className="h-24 border-b border-gray-100 bg-white p-0 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex h-full items-center justify-between px-4">
          <Image src="/assets/images/logo-black1.png" alt="Cosmopolitan Xccessories" width={170} height={70} className="block h-auto w-[170px] object-contain dark:hidden" />
          <Image src="/assets/images/logo-white.png" alt="Cosmopolitan Xccessories" width={170} height={70} className="hidden h-auto w-[170px] object-contain dark:block" />
          <Button onClick={toggleSidebar} type="button" size="icon" className="md:hidden" aria-label="Close admin menu" title="Close menu">
            <IoMdClose />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4" onClickCapture={handleNavigationCapture}>
        <SidebarMenu>
          {menuItems.map((menu, index) => (
            <Collapsible key={index} className="group/collapsible">

              {/* Item with no submenu — render as Link */}
              {!menu.submenu?.length ? (
                <Link
                  href={menu.url}
                  onClick={closeMobileSidebar}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-900 ${
                    pathname === menu.url ? "bg-gray-100 dark:bg-gray-800 font-semibold" : ""
                  }`}
                >
                  <span>{menu.icon}</span>
                  <span>{menu.title}</span>
                </Link>
              ) : (
                /* Item with submenu — render as collapsible trigger */
                <>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer w-full">
                      <span>{menu.icon}</span>
                      <span>{menu.title}</span>
                      <LuChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {menu.submenu.map((subMenuItem, subMenuIndex) => (
                        <SidebarMenuSubItem key={subMenuIndex}>
                          <SidebarMenuSubButton asChild>
                            <Link
                              href={subMenuItem.url}
                              onClick={closeMobileSidebar}
                              className={`flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                pathname === subMenuItem.url ? "bg-gray-100 dark:bg-gray-800 font-semibold" : ""
                              }`}
                            >
                              {subMenuItem.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              )}
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
