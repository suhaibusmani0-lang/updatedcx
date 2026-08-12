"use client";

import { useEffect, useRef } from "react";
import { trackEcommerceEvent } from "@/lib/analytics";

interface ProductPageAnalyticsProps {
  id: string;
  name: string;
  price: number;
  category?: string;
  variant?: string;
  brand?: string;
}

export default function ProductPageAnalytics({
  id,
  name,
  price,
  category,
  variant,
  brand = "Cosmopolitan Xccessories",
}: ProductPageAnalyticsProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current || !id) return;
    tracked.current = true;

    trackEcommerceEvent(
      "view_item",
      [
        {
          item_id: id,
          item_name: name,
          item_category: category,
          item_variant: variant,
          item_brand: brand,
          price,
          quantity: 1,
        },
      ],
      { value: price }
    );
  }, [id, name, price, category, variant, brand]);

  return null;
}
