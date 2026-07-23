// data/menuData.ts

export interface MenuLink {
  label: string;
  href: string;
}

export interface Category {
  title: string;
  href: string;
  links: MenuLink[];
}

export interface MenuItem {
  label: string;
  href: string;
  categories: Category[];
}

export interface CategoryApiItem {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  parent?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
}

export const buildMegaMenuData = (categories: CategoryApiItem[]): MenuItem[] => {
  const rootCategories = categories.filter((category) => !category.parent);

  const dynamicMenuItems = rootCategories
    .map((category) => {
      const categoryId = category._id || category.id || category.slug;

      // immediate children of root
      const childCategories = categories.filter(
        (child) => child.parent && String(child.parent) === String(categoryId)
      );

      // for each child, collect its children (grandchildren)
      const menuCategories = childCategories.length > 0
        ? childCategories.map((child) => {
            const childId = child._id || child.id || child.slug;
            const grandChildren = categories.filter(
              (g) => g.parent && String(g.parent) === String(childId)
            );

            const links = grandChildren.length > 0
              ? grandChildren.map((g) => ({ label: g.name, href: `/category/${g.slug}` }))
              : [];

            return {
              title: child.name,
              href: `/category/${child.slug}`,
              links,
            };
          })
        : [
            {
              title: category.name,
              href: `/category/${category.slug}`,
              links: [],
            },
          ];

      return {
        label: category.name,
        href: `/category/${category.slug}`,
        categories: menuCategories,
      };
    })
    .filter((item) => Boolean(item.label));

  return [
    ...dynamicMenuItems,
    {
      label: "Contact Us",
      href: "/contact",
      categories: [],
    },
  ];
};

export const megaMenuData: MenuItem[] = [
  {
    label: "New",
    href: "/category/new",
    categories: [
      {
        title: "New Arrivals",
        href: "/new/new-arrivals",
        links: [
          { label: "Candles", href: "/new/new-arrivals/candles" },
        ],
      },
      {
        title: "Trending",
        href: "/new/trending",
        links: [
          { label: "Best Sellers", href: "/new/trending/best-sellers" },
          { label: "Featured", href: "/new/trending/featured" },
          { label: "Limited Edition", href: "/new/trending/limited-edition" },
        ],
      },
      {
        title: "Collections",
        href: "/new/collections",
        links: [
          { label: "Luxury", href: "/new/collections/luxury" },
          { label: "Modern", href: "/new/collections/modern" },
          { label: "Classic", href: "/new/collections/classic" },
        ],
      },
      {
        title: "Seasonal",
        href: "/new/seasonal",
        links: [
          { label: "Summer", href: "/new/seasonal/summer" },
          { label: "Winter", href: "/new/seasonal/winter" },
          { label: "Festive", href: "/new/seasonal/festive" },
        ],
      },
      {
        title: "Shop By Room",
        href: "/new/shop-by-room",
        links: [
          { label: "Living Room", href: "/new/shop-by-room/living-room" },
          { label: "Bedroom", href: "/new/shop-by-room/bedroom" },
          { label: "Dining Room", href: "/new/shop-by-room/dining-room" },
        ],
      },
      {
        title: "Accessories",
        href: "/new/accessories",
        links: [
          { label: "Trays", href: "/new/accessories/trays" },
          { label: "Vases", href: "/new/accessories/vases" },
          { label: "Decor Objects", href: "/new/accessories/decor-objects" },
        ],
      },
      {
        title: "Offers",
        href: "/new/offers",
        links: [
          { label: "Sale", href: "/new/offers/sale" },
          { label: "Bundles", href: "/new/offers/bundles" },
          { label: "Clearance", href: "/new/offers/clearance" },
        ],
      },
      {
        title: "Brands",
        href: "/new/brands",
        links: [
          { label: "Brand A", href: "/new/brands/brand-a" },
          { label: "Brand B", href: "/new/brands/brand-b" },
          { label: "Brand C", href: "/new/brands/brand-c" },
        ],
      },
      {
        title: "Explore",
        href: "/new/explore",
        links: [
          { label: "Lookbook", href: "/new/explore/lookbook" },
          { label: "Gift Guide", href: "/new/explore/gift-guide" },
          { label: "Inspiration", href: "/new/explore/inspiration" },
        ],
      },
    ],
  },
  {
    label: "Decor",
    href: "/category/decor",
    categories: [
      {
        title: "Wall Decor",
        href: "/decor/wall-decor",
        links: [
          { label: "Mirrors", href: "/decor/wall-decor/mirrors" },
          { label: "Frames", href: "/decor/wall-decor/frames" },
          { label: "Artwork", href: "/decor/wall-decor/artwork" },
        ],
      },
      {
        title: "Lighting",
        href: "/decor/lighting",
        links: [
          { label: "Lamps", href: "/decor/lighting/lamps" },
          { label: "Lanterns", href: "/decor/lighting/lanterns" },
          { label: "Candle Holders", href: "/decor/lighting/candle-holders" },
        ],
      },
      {
        title: "Furniture",
        href: "/decor/furniture",
        links: [
          { label: "Tables", href: "/decor/furniture/tables" },
          { label: "Chairs", href: "/decor/furniture/chairs" },
          { label: "Stools", href: "/decor/furniture/stools" },
        ],
      },
      {
        title: "Textiles",
        href: "/decor/textiles",
        links: [
          { label: "Cushions", href: "/decor/textiles/cushions" },
          { label: "Throws", href: "/decor/textiles/throws" },
          { label: "Rugs", href: "/decor/textiles/rugs" },
        ],
      },
      {
        title: "Storage",
        href: "/decor/storage",
        links: [
          { label: "Boxes", href: "/decor/storage/boxes" },
          { label: "Baskets", href: "/decor/storage/baskets" },
          { label: "Shelves", href: "/decor/storage/shelves" },
        ],
      },
      {
        title: "Luxury Decor",
        href: "/decor/luxury-decor",
        links: [
          { label: "Gold", href: "/decor/luxury-decor/gold" },
          { label: "Silver", href: "/decor/luxury-decor/silver" },
          { label: "Marble", href: "/decor/luxury-decor/marble" },
        ],
      },
      {
        title: "Modern",
        href: "/decor/modern",
        links: [
          { label: "Minimal", href: "/decor/modern/minimal" },
          { label: "Contemporary", href: "/decor/modern/contemporary" },
          { label: "Scandinavian", href: "/decor/modern/scandinavian" },
        ],
      },
      {
        title: "Collections",
        href: "/decor/collections",
        links: [
          { label: "Premium", href: "/decor/collections/premium" },
          { label: "Popular", href: "/decor/collections/popular" },
          { label: "New", href: "/decor/collections/new" },
        ],
      },
      {
        title: "Accessories",
        href: "/decor/accessories",
        links: [
          { label: "Bowls", href: "/decor/accessories/bowls" },
          { label: "Vases", href: "/decor/accessories/vases" },
          { label: "Objects", href: "/decor/accessories/objects" },
        ],
      },
    ],
  },
  {
    label: "Home Fragrance",
    href: "/category/home-fragrance",
    categories: [
      {
        title: "Candles",
        href: "/home-fragrance/candles",
        links: [
          { label: "Scented", href: "/home-fragrance/candles/scented" },
          { label: "Luxury", href: "/home-fragrance/candles/luxury" },
          { label: "Gift Sets", href: "/home-fragrance/candles/gift-sets" },
        ],
      },
      {
        title: "Diffusers",
        href: "/home-fragrance/diffusers",
        links: [
          { label: "Reed", href: "/home-fragrance/diffusers/reed" },
          { label: "Electric", href: "/home-fragrance/diffusers/electric" },
          { label: "Premium", href: "/home-fragrance/diffusers/premium" },
        ],
      },
      {
        title: "Room Sprays",
        href: "/home-fragrance/room-sprays",
        links: [
          { label: "Floral", href: "/home-fragrance/room-sprays/floral" },
          { label: "Oud", href: "/home-fragrance/room-sprays/oud" },
          { label: "Fresh", href: "/home-fragrance/room-sprays/fresh" },
        ],
      },
      {
        title: "Incense",
        href: "/home-fragrance/incense",
        links: [
          { label: "Sticks", href: "/home-fragrance/incense/sticks" },
          { label: "Cones", href: "/home-fragrance/incense/cones" },
          { label: "Premium", href: "/home-fragrance/incense/premium" },
        ],
      },
      {
        title: "Essential Oils",
        href: "/home-fragrance/essential-oils",
        links: [
          { label: "Relax", href: "/home-fragrance/essential-oils/relax" },
          { label: "Focus", href: "/home-fragrance/essential-oils/focus" },
          { label: "Sleep", href: "/home-fragrance/essential-oils/sleep" },
        ],
      },
      {
        title: "Gift Sets",
        href: "/home-fragrance/gift-sets",
        links: [
          { label: "Luxury", href: "/home-fragrance/gift-sets/luxury" },
          { label: "Premium", href: "/home-fragrance/gift-sets/premium" },
          { label: "Holiday", href: "/home-fragrance/gift-sets/holiday" },
        ],
      },
      {
        title: "Collections",
        href: "/home-fragrance/collections",
        links: [
          { label: "Best Sellers", href: "/home-fragrance/collections/best-sellers" },
          { label: "New", href: "/home-fragrance/collections/new" },
          { label: "Exclusive", href: "/home-fragrance/collections/exclusive" },
        ],
      },
      {
        title: "Shop By Mood",
        href: "/home-fragrance/shop-by-mood",
        links: [
          { label: "Relaxing", href: "/home-fragrance/shop-by-mood/relaxing" },
          { label: "Fresh", href: "/home-fragrance/shop-by-mood/fresh" },
          { label: "Warm", href: "/home-fragrance/shop-by-mood/warm" },
        ],
      },
      {
        title: "Brands",
        href: "/home-fragrance/brands",
        links: [
          { label: "Brand A", href: "/home-fragrance/brands/brand-a" },
          { label: "Brand B", href: "/home-fragrance/brands/brand-b" },
          { label: "Brand C", href: "/home-fragrance/brands/brand-c" },
        ],
      },
    ],
  },
  {
    label: "Bakhoor & Incense",
    href: "/category/bakhoor-incense",
    categories: [
      {
        title: "Bakhoor",
        href: "/bakhoor-incense/bakhoor",
        links: [
          { label: "Traditional", href: "/bakhoor-incense/bakhoor/traditional" },
          { label: "Premium", href: "/bakhoor-incense/bakhoor/premium" },
          { label: "Luxury", href: "/bakhoor-incense/bakhoor/luxury" },
        ],
      },
      {
        title: "Incense",
        href: "/bakhoor-incense/incense",
        links: [
          { label: "Sticks", href: "/bakhoor-incense/incense/sticks" },
          { label: "Cones", href: "/bakhoor-incense/incense/cones" },
          { label: "Resins", href: "/bakhoor-incense/incense/resins" },
        ],
      },
      {
        title: "Burners",
        href: "/bakhoor-incense/burners",
        links: [
          { label: "Electric", href: "/bakhoor-incense/burners/electric" },
          { label: "Wood", href: "/bakhoor-incense/burners/wood" },
          { label: "Metal", href: "/bakhoor-incense/burners/metal" },
        ],
      },
      {
        title: "Accessories",
        href: "/bakhoor-incense/accessories",
        links: [
          { label: "Tongs", href: "/bakhoor-incense/accessories/tongs" },
          { label: "Charcoal", href: "/bakhoor-incense/accessories/charcoal" },
          { label: "Pouches", href: "/bakhoor-incense/accessories/pouches" },
        ],
      },
      {
        title: "Oud",
        href: "/bakhoor-incense/oud",
        links: [
          { label: "Pure Oud", href: "/bakhoor-incense/oud/pure-oud" },
          { label: "Blends", href: "/bakhoor-incense/oud/blends" },
          { label: "Gift Sets", href: "/bakhoor-incense/oud/gift-sets" },
        ],
      },
      {
        title: "Collections",
        href: "/bakhoor-incense/collections",
        links: [
          { label: "New", href: "/bakhoor-incense/collections/new" },
          { label: "Best Sellers", href: "/bakhoor-incense/collections/best-sellers" },
          { label: "Exclusive", href: "/bakhoor-incense/collections/exclusive" },
        ],
      },
      {
        title: "Shop By Fragrance",
        href: "/bakhoor-incense/shop-by-fragrance",
        links: [
          { label: "Woody", href: "/bakhoor-incense/shop-by-fragrance/woody" },
          { label: "Floral", href: "/bakhoor-incense/shop-by-fragrance/floral" },
          { label: "Oriental", href: "/bakhoor-incense/shop-by-fragrance/oriental" },
        ],
      },
      {
        title: "Premium",
        href: "/bakhoor-incense/premium",
        links: [
          { label: "Gold", href: "/bakhoor-incense/premium/gold" },
          { label: "Luxury", href: "/bakhoor-incense/premium/luxury" },
          { label: "Limited", href: "/bakhoor-incense/premium/limited" },
        ],
      },
      {
        title: "Brands",
        href: "/bakhoor-incense/brands",
        links: [
          { label: "Brand A", href: "/bakhoor-incense/brands/brand-a" },
          { label: "Brand B", href: "/bakhoor-incense/brands/brand-b" },
          { label: "Brand C", href: "/bakhoor-incense/brands/brand-c" },
        ],
      },
    ],
  },
  {
    label: "Tabletop",
    href: "/category/tabletop-bar",
    categories: [
      {
        title: "Dinnerware",
        href: "/tabletop-bar/dinnerware",
        links: [
          { label: "Plates", href: "/tabletop-bar/dinnerware/plates" },
          { label: "Bowls", href: "/tabletop-bar/dinnerware/bowls" },
          { label: "Serving", href: "/tabletop-bar/dinnerware/serving" },
        ],
      },
      {
        title: "Glassware",
        href: "/tabletop-bar/glassware",
        links: [
          { label: "Wine", href: "/tabletop-bar/glassware/wine" },
          { label: "Cocktail", href: "/tabletop-bar/glassware/cocktail" },
          { label: "Water", href: "/tabletop-bar/glassware/water" },
        ],
      },
      {
        title: "Bar Tools",
        href: "/tabletop-bar/bar-tools",
        links: [
          { label: "Shakers", href: "/tabletop-bar/bar-tools/shakers" },
          { label: "Openers", href: "/tabletop-bar/bar-tools/openers" },
          { label: "Accessories", href: "/tabletop-bar/bar-tools/accessories" },
        ],
      },
      {
        title: "Table Decor",
        href: "/tabletop-bar/table-decor",
        links: [
          { label: "Centerpieces", href: "/tabletop-bar/table-decor/centerpieces" },
          { label: "Candles", href: "/tabletop-bar/table-decor/candles" },
          { label: "Linen", href: "/tabletop-bar/table-decor/linen" },
        ],
      },
      {
        title: "Serving",
        href: "/tabletop-bar/serving",
        links: [
          { label: "Trays", href: "/tabletop-bar/serving/trays" },
          { label: "Boards", href: "/tabletop-bar/serving/boards" },
          { label: "Platters", href: "/tabletop-bar/serving/platters" },
        ],
      },
      {
        title: "Luxury",
        href: "/tabletop-bar/luxury",
        links: [
          { label: "Gold", href: "/tabletop-bar/luxury/gold" },
          { label: "Crystal", href: "/tabletop-bar/luxury/crystal" },
          { label: "Premium", href: "/tabletop-bar/luxury/premium" },
        ],
      },
      {
        title: "Collections",
        href: "/tabletop-bar/collections",
        links: [
          { label: "New", href: "/tabletop-bar/collections/new" },
          { label: "Popular", href: "/tabletop-bar/collections/popular" },
          { label: "Exclusive", href: "/tabletop-bar/collections/exclusive" },
        ],
      },
      {
        title: "Entertaining",
        href: "/tabletop-bar/entertaining",
        links: [
          { label: "Party", href: "/tabletop-bar/entertaining/party" },
          { label: "Dining", href: "/tabletop-bar/entertaining/dining" },
          { label: "Hosting", href: "/tabletop-bar/entertaining/hosting" },
        ],
      },
      {
        title: "Gift Sets",
        href: "/tabletop-bar/gift-sets",
        links: [
          { label: "Wine", href: "/tabletop-bar/gift-sets/wine" },
          { label: "Dining", href: "/tabletop-bar/gift-sets/dining" },
          { label: "Premium", href: "/tabletop-bar/gift-sets/premium" },
        ],
      },
    ],
  },
  {
    label: "Outdoor",
    href: "/category/outdoor",
    categories: [
      {
        title: "Furniture",
        href: "/outdoor/furniture",
        links: [
          { label: "Chairs", href: "/outdoor/furniture/chairs" },
          { label: "Tables", href: "/outdoor/furniture/tables" },
          { label: "Loungers", href: "/outdoor/furniture/loungers" },
        ],
      },
      {
        title: "Lighting",
        href: "/outdoor/lighting",
        links: [
          { label: "Lanterns", href: "/outdoor/lighting/lanterns" },
          { label: "Solar", href: "/outdoor/lighting/solar" },
          { label: "Decor", href: "/outdoor/lighting/decor" },
        ],
      },
      {
        title: "Garden",
        href: "/outdoor/garden",
        links: [
          { label: "Planters", href: "/outdoor/garden/planters" },
          { label: "Decor", href: "/outdoor/garden/decor" },
          { label: "Accessories", href: "/outdoor/garden/accessories" },
        ],
      },
      {
        title: "Dining",
        href: "/outdoor/dining",
        links: [
          { label: "Outdoor Sets", href: "/outdoor/dining/outdoor-sets" },
          { label: "Serveware", href: "/outdoor/dining/serveware" },
          { label: "Bar", href: "/outdoor/dining/bar" },
        ],
      },
      {
        title: "Decor",
        href: "/outdoor/decor",
        links: [
          { label: "Statues", href: "/outdoor/decor/statues" },
          { label: "Water Features", href: "/outdoor/decor/water-features" },
          { label: "Art", href: "/outdoor/decor/art" },
        ],
      },
      {
        title: "Textiles",
        href: "/outdoor/textiles",
        links: [
          { label: "Cushions", href: "/outdoor/textiles/cushions" },
          { label: "Rugs", href: "/outdoor/textiles/rugs" },
          { label: "Throws", href: "/outdoor/textiles/throws" },
        ],
      },
      {
        title: "Collections",
        href: "/outdoor/collections",
        links: [
          { label: "Summer", href: "/outdoor/collections/summer" },
          { label: "Luxury", href: "/outdoor/collections/luxury" },
          { label: "New", href: "/outdoor/collections/new" },
        ],
      },
      {
        title: "Accessories",
        href: "/outdoor/accessories",
        links: [
          { label: "Storage", href: "/outdoor/accessories/storage" },
          { label: "Covers", href: "/outdoor/accessories/covers" },
          { label: "Tools", href: "/outdoor/accessories/tools" },
        ],
      },
      {
        title: "Brands",
        href: "/outdoor/brands",
        links: [
          { label: "Brand A", href: "/outdoor/brands/brand-a" },
          { label: "Brand B", href: "/outdoor/brands/brand-b" },
          { label: "Brand C", href: "/outdoor/brands/brand-c" },
        ],
      },
    ],
  },
  {
    label: "Gifts",
    href: "/category/gifts",
    categories: [
      {
        title: "For Her",
        href: "/gifts/for-her",
        links: [
          { label: "Candles", href: "/gifts/for-her/candles" },
          { label: "Decor", href: "/gifts/for-her/decor" },
          { label: "Luxury", href: "/gifts/for-her/luxury" },
        ],
      },
      {
        title: "For Him",
        href: "/gifts/for-him",
        links: [
          { label: "Barware", href: "/gifts/for-him/barware" },
          { label: "Fragrance", href: "/gifts/for-him/fragrance" },
          { label: "Accessories", href: "/gifts/for-him/accessories" },
        ],
      },
      {
        title: "Corporate",
        href: "/gifts/corporate",
        links: [
          { label: "Premium", href: "/gifts/corporate/premium" },
          { label: "Luxury", href: "/gifts/corporate/luxury" },
          { label: "Sets", href: "/gifts/corporate/sets" },
        ],
      },
      {
        title: "Wedding",
        href: "/gifts/wedding",
        links: [
          { label: "Decor", href: "/gifts/wedding/decor" },
          { label: "Luxury", href: "/gifts/wedding/luxury" },
          { label: "Gift Sets", href: "/gifts/wedding/gift-sets" },
        ],
      },
      {
        title: "Birthday",
        href: "/gifts/birthday",
        links: [
          { label: "Popular", href: "/gifts/birthday/popular" },
          { label: "Premium", href: "/gifts/birthday/premium" },
          { label: "Bundles", href: "/gifts/birthday/bundles" },
        ],
      },
      {
        title: "Holiday Gifts",
        href: "/gifts/holiday-gifts",
        links: [
          { label: "Festive", href: "/gifts/holiday-gifts/festive" },
          { label: "Luxury", href: "/gifts/holiday-gifts/luxury" },
          { label: "Family", href: "/gifts/holiday-gifts/family" },
        ],
      },
      {
        title: "Under $50",
        href: "/gifts/under-50",
        links: [
          { label: "Candles", href: "/gifts/under-50/candles" },
          { label: "Decor", href: "/gifts/under-50/decor" },
          { label: "Accessories", href: "/gifts/under-50/accessories" },
        ],
      },
      {
        title: "Under $100",
        href: "/gifts/under-100",
        links: [
          { label: "Gift Sets", href: "/gifts/under-100/gift-sets" },
          { label: "Premium", href: "/gifts/under-100/premium" },
          { label: "Luxury", href: "/gifts/under-100/luxury" },
        ],
      },
      {
        title: "Gift Cards",
        href: "/gifts/gift-cards",
        links: [
          { label: "Digital", href: "/gifts/gift-cards/digital" },
          { label: "Physical", href: "/gifts/gift-cards/physical" },
          { label: "Corporate", href: "/gifts/gift-cards/corporate" },
        ],
      },
    ],
  },
  // {
  //   label: "Holidays",
  //   href: "/category/holidays",
  //   categories: [
  //     {
  //       title: "Christmas",
  //       href: "/holidays/christmas",
  //       links: [
  //         { label: "Decor", href: "/holidays/christmas/decor" },
  //         { label: "Gifts", href: "/holidays/christmas/gifts" },
  //         { label: "Tabletop", href: "/holidays/christmas/tabletop" },
  //       ],
  //     },
  //     {
  //       title: "Eid",
  //       href: "/holidays/eid",
  //       links: [
  //         { label: "Bakhoor", href: "/holidays/eid/bakhoor" },
  //         { label: "Decor", href: "/holidays/eid/decor" },
  //         { label: "Gifts", href: "/holidays/eid/gifts" },
  //       ],
  //     },
  //     {
  //       title: "Ramadan",
  //       href: "/holidays/ramadan",
  //       links: [
  //         { label: "Lanterns", href: "/holidays/ramadan/lanterns" },
  //         { label: "Decor", href: "/holidays/ramadan/decor" },
  //         { label: "Gift Sets", href: "/holidays/ramadan/gift-sets" },
  //       ],
  //     },
  //     {
  //       title: "New Year",
  //       href: "/holidays/new-year",
  //       links: [
  //         { label: "Party", href: "/holidays/new-year/party" },
  //         { label: "Barware", href: "/holidays/new-year/barware" },
  //         { label: "Decor", href: "/holidays/new-year/decor" },
  //       ],
  //     },
  //     {
  //       title: "Valentine",
  //       href: "/holidays/valentine",
  //       links: [
  //         { label: "Candles", href: "/holidays/valentine/candles" },
  //         { label: "Gifts", href: "/holidays/valentine/gifts" },
  //         { label: "Luxury", href: "/holidays/valentine/luxury" },
  //       ],
  //     },
  //     {
  //       title: "Seasonal",
  //       href: "/holidays/seasonal",
  //       links: [
  //         { label: "Summer", href: "/holidays/seasonal/summer" },
  //         { label: "Winter", href: "/holidays/seasonal/winter" },
  //         { label: "Festive", href: "/holidays/seasonal/festive" },
  //       ],
  //     },
  //     {
  //       title: "Collections",
  //       href: "/holidays/collections",
  //       links: [
  //         { label: "Premium", href: "/holidays/collections/premium" },
  //         { label: "Exclusive", href: "/holidays/collections/exclusive" },
  //         { label: "New", href: "/holidays/collections/new" },
  //       ],
  //     },
  //     {
  //       title: "Gift Ideas",
  //       href: "/holidays/gift-ideas",
  //       links: [
  //         { label: "Family", href: "/holidays/gift-ideas/family" },
  //         { label: "Friends", href: "/holidays/gift-ideas/friends" },
  //         { label: "Corporate", href: "/holidays/gift-ideas/corporate" },
  //       ],
  //     },
  //     {
  //       title: "Special Events",
  //       href: "/holidays/special-events",
  //       links: [
  //         { label: "Wedding", href: "/holidays/special-events/wedding" },
  //         { label: "Birthday", href: "/holidays/special-events/birthday" },
  //         { label: "Celebration", href: "/holidays/special-events/celebration" },
  //       ],
  //     },
  //   ],
  // },
  {
    label: "Contact Us",
    href: "/contact",
    categories: [],
  },
];

