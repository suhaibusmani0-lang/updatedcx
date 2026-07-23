// Admin Sidebar icons.
import { AiOutlineDashboard } from "react-icons/ai";
import { BiCategory } from "react-icons/bi";
import { IoShirtOutline } from "react-icons/io5";
import { MdOutlineShoppingBag, MdOutlinePermMedia } from "react-icons/md";
import { LuUserRound } from "react-icons/lu";
import { IoMdStarOutline } from "react-icons/io";
import { RiCoupon2Line } from "react-icons/ri";
import {
  ADMIN_DASHBOARD,
  ADMIN_CATEGORIES,
  ADMIN_ADD_CATEGORY,
  ADMIN_PRODUCTS,
  ADMIN_ADD_PRODUCT,
  ADMIN_CUSTOMERS,
  ADMIN_REVIEWS,
  ADMIN_COUPONS,
  ADMIN_ORDERS,
  ADMIN_MEDIA_SHOW,
} from "@/routes/adminPanelRoutes";

export const AdminSideBarMenu = {
  dashboard: { title: "Dashboard", icon: <AiOutlineDashboard />, url: ADMIN_DASHBOARD },
  categories: {
    title: "Categories",
    icon: <BiCategory />,
    url: "#",
    submenu: [
      { title: "All Categories", url: ADMIN_CATEGORIES },
      { title: "Add Category", url: ADMIN_ADD_CATEGORY },
    ],
  },
  products: {
    title: "Products",
    icon: <IoShirtOutline />,
    url: "#",
    submenu: [
      { title: "All Products", url: ADMIN_PRODUCTS },
      { title: "Add Product", url: ADMIN_ADD_PRODUCT },
    ],
  },
  coupons: {
    title: "Coupons",
    icon: <RiCoupon2Line />,
    url: ADMIN_COUPONS,
  },
  orders: { title: "Orders", icon: <MdOutlineShoppingBag />, url: ADMIN_ORDERS },
  customers: { title: "Customers", icon: <LuUserRound />, url: ADMIN_CUSTOMERS },
  reviews: { title: "Reviews", icon: <IoMdStarOutline />, url: ADMIN_REVIEWS },
  media: { title: "Media", icon: <MdOutlinePermMedia />, url: ADMIN_MEDIA_SHOW },
};
