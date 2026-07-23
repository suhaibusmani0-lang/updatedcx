"use client";

import Link from "next/link";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  MapPin,
  Package,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/reducer/authReducer";
import { usePathname, useRouter } from "next/navigation";
import { persistor } from "@/store/store";
import type { RootState } from "@/store/store";

import TopBar from "./TopBar";
import MegaMenu from "./MegaMenu";
import { buildMegaMenuData, megaMenuData as fallbackMegaMenuData } from "@/data/menuData";
import type { MenuItem } from "@/data/menuData";
import CartDrawer from "../CartDrawer";
import SearchBar from "./Search";
import SignInPopup from "@/components/SignInPopup";

export default function Header() {
  interface MobileProduct {
    _id: string;
    slug: string;
    name: string;
    price?: number;
    salePrice?: number;
    images?: { url: string }[];
  }

  interface MobileCategoryResult {
    _id: string;
    slug: string;
    name: string;
  }

  const [mobileMenu, setMobileMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [expandedSubMenu, setExpandedSubMenu] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchLoading, setMobileSearchLoading] = useState(false);
  const [mobileSearchProducts, setMobileSearchProducts] = useState<MobileProduct[]>([]);
  const [mobileSearchCategories, setMobileSearchCategories] = useState<MobileCategoryResult[]>([]);
  const [menuData, setMenuData] = useState<MenuItem[]>(fallbackMegaMenuData);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const auth = useSelector((state: RootState) => state.authStore.auth) as any;
  const cartCount = useSelector((state: RootState) =>
    state.cart.items.reduce((sum, item) => sum + item.qty, 0)
  );

  // Lock scroll when drawers are open
  useEffect(() => {
    document.body.style.overflow = mobileMenu || cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu, cartOpen]);

  // Shadow on scroll for sticky header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    const closeSearch = () => setMobileSearchOpen(false);
    window.addEventListener("scroll", closeSearch);
    return () => window.removeEventListener("scroll", closeSearch);
  }, []);

  useEffect(() => {
    if (!mobileSearchQuery.trim()) {
      setMobileSearchProducts([]);
      setMobileSearchCategories([]);
      setMobileSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setMobileSearchLoading(true);

        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(mobileSearchQuery)}&limit=8`),
          fetch(`/api/categories?search=${encodeURIComponent(mobileSearchQuery)}`),
        ]);

        const productsData = await productsRes.json().catch(() => ({}));
        const categoriesData = await categoriesRes.json().catch(() => ({}));

        setMobileSearchProducts(productsData.products || productsData.data?.products || []);
        setMobileSearchCategories(categoriesData.data || categoriesData.categories || []);
      } catch (err) {
        console.error(err);
      } finally {
        setMobileSearchLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [mobileSearchQuery]);

  useEffect(() => {
    let isMounted = true;

    const fetchMenuData = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");

        const payload = await res.json().catch(() => ({}));
        const categories = Array.isArray(payload?.data) ? payload.data : [];

        if (isMounted) {
          setMenuData(buildMegaMenuData(categories));
        }
      } catch (error) {
        console.error("Failed to load mega menu categories", error);
        if (isMounted) {
          setMenuData(fallbackMegaMenuData);
        }
      }
    };

    fetchMenuData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchWishlistCount = async () => {
      if (!auth) {
        setWishlistCount(0);
        return;
      }

      try {
        const res = await fetch("/api/wishlist");
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        setWishlistCount(data.data?.items?.length || 0);
      } catch (error) {
        console.error("Failed to load wishlist count", error);
      }
    };

    fetchWishlistCount();
  }, [auth, pathname]);

  useEffect(() => {
    const updateCount = () => {
      if (!auth) {
        setWishlistCount(0);
        return;
      }
      fetch("/api/wishlist")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setWishlistCount(data?.data?.items?.length || 0))
        .catch(() => setWishlistCount(0));
    };

    window.addEventListener("wishlist:updated", updateCount);
    return () => window.removeEventListener("wishlist:updated", updateCount);
  }, [auth]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    dispatch(logout());
    await persistor.purge();
  };

  // Handle mobile search
  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileSearchOpen(false);
      setMobileSearchQuery("");
      setMobileSearchProducts([]);
      setMobileSearchCategories([]);
    }
  };

  // Toggle mobile search
  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
    if (!mobileSearchOpen) {
      setMobileSearchQuery("");
      setMobileSearchProducts([]);
      setMobileSearchCategories([]);
    }
  };

  return (
    <>
      {/* Top Header */}
      <div className="border-b bg-white hidden">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center px-4 sm:px-5 py-2 text-[12px] sm:text-[13px]">
          <div className="flex gap-4 sm:gap-8 hidden">
            <Link href="/brands" className="hidden sm:inline">Brands</Link>
            <Link href="/gift-cards" className="hidden sm:inline">Gift Cards</Link>
            <Link href="/careers" className="hidden sm:inline">Careers</Link>
          </div>

          <div className="hidden md:flex gap-6 lg:gap-8 hidden">
            <Link
              href="/stores"
              className="flex items-center gap-2 hover:text-gray-600 hidden"
            >
              <MapPin size={14} />
              <span className="hidden lg:inline">Find A Store</span>
              <span className="lg:hidden">Store</span>
            </Link>

            <Link
              href="/track-order"
              className="flex items-center gap-2 hover:text-gray-600"
            >
              <Package size={14} />
              <span className="hidden lg:inline">Track Order</span>
              <span className="lg:hidden">Track</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Announcement Bar */}
      <TopBar />

      {/* Main Header – sticky with shadow */}
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 py-4 sm:py-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-7 md:gap-8">
            {/* Left: Hamburger + Mobile Search Toggle */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenu(true)}
                className="lg:hidden mr-3"
                aria-label="Open Menu"
              >
                <Menu size={26} />
              </button>

              {/* Mobile Search Toggle Button */}
              <button
                onClick={toggleMobileSearch}
                className="lg:hidden"
                aria-label="Toggle Search"
              >
                <Search size={22} />
              </button>

              {/* Desktop Search */}
              <div className="hidden lg:block">
                <SearchBar />
              </div>
            </div>

            {/* Center: Logo */}
            <div className="text-center">
              <Link href="/" className="inline-block">
                <span className="block w-min mx-auto sm:w-auto text-center text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.15em] text-gray-700 mt-0.5 sm:mt-1">
                  Cosmopolitan Xccessories
                </span>
              </Link>
            </div>

            {/* Right: Account, Wishlist, Cart */}
            <div className="flex justify-end items-center gap-3 sm:gap-6 md:gap-8">
              {/* Auth / Account */}
              {auth ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href={auth.role === "admin" ? "/admin/dashboard" : "/my-account"}
                    className="text-[10px] sm:text-xs hover:text-gray-600 flex flex-col items-center"
                  >
                    <User size={20} className="sm:w-[22px] sm:h-[22px]" />
                    <span className="mt-1 hidden sm:inline">
                      {auth.name?.split(" ")[0]}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Logout"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                  e.preventDefault();
                  (window as any).showSignInPopup?.();
                  }}         
                  className="hidden sm:flex flex-col items-center text-[10px] sm:text-xs hover:text-gray-600"
                >
                  <User size={20} className="sm:w-[22px] sm:h-[22px]" />
                  <span className="mt-1 hidden sm:inline">Sign In</span>
                </a>
              )}

              {/* Mobile account icon */}
              <Link
                href={auth ? (auth.role === "admin" ? "/admin/dashboard" : "/my-account") : "/auth/login"}
                className="sm:hidden flex flex-col items-center text-[10px] hover:text-gray-600"
              >
                <User size={20} />
                <span className="mt-1">{auth ? "Account" : "Login"}</span>
              </Link>

              {/* Wishlist (tablet+) */}
              <Link
                href="/wishlist"
                className={`hidden sm:flex flex-col items-center text-[10px] sm:text-xs hover:text-gray-600 relative ${
                  wishlistCount > 0 ? "text-[#C17A56]" : "text-gray-700"
                }`}
              >
                <Heart
                  size={20}
                  className={`sm:w-[22px] sm:h-[22px] transition-colors ${
                    wishlistCount > 0 ? "text-[#C17A56]" : "text-gray-700"
                  }`}
                  fill={wishlistCount > 0 ? "#C17A56" : "none"}
                />
                <span className="mt-1 hidden sm:inline">Wishlist</span>
                <span
                  className={`absolute -top-1 -right-2 sm:-right-3 ${
                    wishlistCount > 0 ? "bg-[#C17A56] text-white" : "bg-gray-100 text-gray-700"
                  } text-[9px] rounded-full min-w-3.5 h-3.5 px-1 flex items-center justify-center font-bold`}
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              </Link>

              {/* Cart with live count */}
              <button
                onClick={() => setCartOpen(true)}
                className="flex flex-col items-center text-[10px] sm:text-xs hover:text-gray-600 relative"
                aria-label="Cart"
              >
                <ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px]" />
                <span className="mt-1">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 sm:-right-3 bg-[#C17A56] text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar - positioned below the header row */}
          <div
            className={`lg:hidden transition-all duration-300 ease-in-out ${
              mobileSearchOpen
                ? "max-h-[400px] opacity-100 mt-3"
                : "max-h-0 opacity-0 mt-0"
            }`}
          >
            <form onSubmit={handleMobileSearch} className="w-full relative">
              <div className="flex items-center border-2 border-gray-300 rounded-lg bg-white px-3 focus-within:border-[#C17A56] transition-colors">
                {/* Error fix: mobileSearchQuery || "" */}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={mobileSearchQuery || ""}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="flex-1 py-3 outline-none text-sm bg-transparent"
                  aria-label="Mobile search"
                />
                <button
                  type="submit"
                  className="p-2 hover:text-[#C17A56] transition-colors"
                  aria-label="Submit search"
                >
                  <Search size={20} />
                </button>
              </div>

              {(mobileSearchOpen && (mobileSearchLoading || mobileSearchProducts.length > 0 || mobileSearchCategories.length > 0)) && (
                <div className="absolute left-0 right-0 top-full mt-2 z-[120] bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden">
                  {mobileSearchLoading ? (
                    <div className="p-4 text-sm text-gray-600">Searching...</div>
                  ) : (
                    <>
                      {mobileSearchCategories.length > 0 && (
                        <div className="border-b border-gray-200 p-3">
                          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                            Categories
                          </div>
                          {mobileSearchCategories.slice(0, 5).map((category) => (
                            <Link
                              href={`/category/${category.slug}`}
                              key={category._id}
                              onClick={() => {
                                setMobileSearchOpen(false);
                                setMobileSearchQuery("");
                                setMobileSearchProducts([]);
                                setMobileSearchCategories([]);
                              }}
                              className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      )}

                      {mobileSearchProducts.length > 0 && (
                        <div className="p-3">
                          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">
                            Products
                          </div>
                          {mobileSearchProducts.slice(0, 5).map((item) => (
                            <Link
                              href={`/product/${item.slug}`}
                              key={item._id}
                              onClick={() => {
                                setMobileSearchOpen(false);
                                setMobileSearchQuery("");
                                setMobileSearchProducts([]);
                                setMobileSearchCategories([]);
                              }}
                              className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 truncate"
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Navigation – MegaMenu on large screens */}
        <div className="border-t border-gray-200 text-[#000]">
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 xl:gap-12 my-2 mx-2 text-xs sm:text-sm md:text-[14px] xl:text-[15px]">
              <MegaMenu menuData={menuData} />
            </div>
          </div>
        </div>
      </header>

      {/* Overlay for mobile menu */}
      <div
        onClick={() => setMobileMenu(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-all duration-300 ${
          mobileMenu ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 overflow-x-auto ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h3 className="text-lg font-semibold">Menu</h3>
          <button onClick={() => setMobileMenu(false)}>
            <X />
          </button>
        </div>

        {/* Search inside drawer is hidden */}

        {/* Menu links with expandable sub-categories */}
        <nav className="flex flex-col">
          {menuData.map((item) => {
            const isContactUs = item.label.toLowerCase() === "contact us";
            const displayLabel = isContactUs ? "Customer Support" : item.label;
            const hasCategories = (item.categories && item.categories.length > 0) || isContactUs;
            const isExpanded = expandedMenu === item.label;

            return (
              <div
                key={item.label}
                className="border-b"
                data-testid={`mobile-menu-item-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <div className="flex items-center">
                  <Link
                    href={isContactUs ? "#" : item.href}
                    onClick={(e) => {
                      if (isContactUs) {
                        e.preventDefault();
                        setExpandedMenu(isExpanded ? null : item.label);
                        setExpandedSubMenu(null);
                      } else if (!hasCategories) {
                        setMobileMenu(false);
                      }
                    }}
                    className="flex-1 px-5 py-4 text-base hover:bg-gray-50"
                  >
                    {displayLabel}
                  </Link>
                  {hasCategories && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedMenu(isExpanded ? null : item.label);
                        setExpandedSubMenu(null);
                      }}
                      className="px-5 py-4 hover:bg-gray-50"
                      aria-label={`Toggle ${displayLabel} sub-menu`}
                      data-testid={`mobile-menu-toggle-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  )}
                </div>

                {hasCategories && isExpanded && (
                  <div
                    className="bg-gray-50 pb-2"
                    data-testid={`mobile-submenu-${item.label.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {isContactUs ? (
                      /* Customer Support 3 Custom Options */
                      <ul className="bg-white">
                        <li>
                          <a
                            href="mailto:support@cosmoxs.com"
                            onClick={() => setMobileMenu(false)}
                            className="flex items-center gap-3 px-8 py-3 text-sm text-gray-700 hover:text-black hover:bg-gray-50"
                          >
                            <Mail size={16} />
                            Email Us
                          </a>
                        </li>
                        <li>
                          <a
                            href="tel:+918595124718"
                            onClick={() => setMobileMenu(false)}
                            className="flex items-center gap-3 px-8 py-3 text-sm text-gray-700 hover:text-black hover:bg-gray-50"
                          >
                            <Phone size={16} />
                            Call Us
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://wa.me/918595124718"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileMenu(false)}
                            className="flex items-center gap-3 px-8 py-3 text-sm text-gray-700 hover:text-black hover:bg-gray-50"
                          >
                            <MessageCircle size={16} />
                            Need help Fast? Chat now
                          </a>
                        </li>
                      </ul>
                    ) : (
                      item.categories?.map((cat) => {
                        const subKey = `${item.label}::${cat.title}`;
                        const subExpanded = expandedSubMenu === subKey;
                        const hasSubLinks = cat.links && cat.links.length > 0;
                        return (
                          <div key={cat.title}>
                            <div className="flex items-center">
                              <Link
                                href={cat.href}
                                onClick={() => setMobileMenu(false)}
                                className="flex-1 px-8 py-3 text-sm font-medium text-gray-800 hover:bg-white"
                              >
                                {cat.title}
                              </Link>
                              {hasSubLinks && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSubMenu(subExpanded ? null : subKey)
                                  }
                                  className="px-5 py-3 hover:bg-white"
                                  aria-label={`Toggle ${cat.title} sub-links`}
                                >
                                  {subExpanded ? (
                                    <ChevronDown size={14} />
                                  ) : (
                                    <ChevronRight size={14} />
                                  )}
                                </button>
                              )}
                            </div>
                            {hasSubLinks && subExpanded && (
                              <ul className="bg-white">
                                {cat.links.map((link) => (
                                  <li key={link.href}>
                                    <Link
                                      href={link.href}
                                      onClick={() => setMobileMenu(false)}
                                      className="block px-12 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50"
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="mt-auto border-t p-5 flex flex-col gap-4">
          <Link
            href="/stores"
            onClick={() => setMobileMenu(false)}
            className="flex items-center gap-2 hidden"
          >
            <MapPin size={18} />
            Find A Store
          </Link>

          <Link
            href="/track-order"
            onClick={() => setMobileMenu(false)}
            className="flex items-center gap-2 hidden"
          >
            <Package size={18} />
            Track Order
          </Link>

          {auth ? (
            <Link
              href={auth.role === "admin" ? "/admin/dashboard" : "/my-account"}
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2"
            >
              <User size={18} />
              My Account
            </Link>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenu(false);
                (window as any).showSignInPopup?.();
              }}
              className="flex items-center gap-2"
            >
              <User size={18} />
              Sign In
            </a>
          )}

          <Link
            href="/wishlist"
            onClick={() => setMobileMenu(false)}
            className={`flex items-center justify-between ${
              wishlistCount > 0 ? "text-[#C17A56]" : "text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart
                size={18}
                className={wishlistCount > 0 ? "text-[#C17A56]" : "text-gray-700"}
                fill={wishlistCount > 0 ? "#C17A56" : "none"}
              />
              Wishlist
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                wishlistCount > 0
                  ? "bg-[#C17A56] text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {wishlistCount > 9 ? "9+" : wishlistCount}
            </span>
          </Link>

          <Link
            href="/cart"
            onClick={() => setMobileMenu(false)}
            className="flex items-center gap-2"
          >
            <ShoppingBag size={18} />
            Cart
          </Link>

          {auth && (
            <button
              onClick={() => {
                handleLogout();
                setMobileMenu(false);
              }}
              className="flex items-center gap-2 text-left text-red-600 hover:text-red-800"
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      <SignInPopup />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}