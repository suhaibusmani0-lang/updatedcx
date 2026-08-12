"use client";

import { useEffect, useRef } from "react";
import { trackEcommerceEvent, type AnalyticsItem } from "@/lib/analytics";

export default function ProductListAnalytics({
  listName,
  items,
}: {
  listName: string;
  items: AnalyticsItem[];
}) {
  const trackedKey = useRef("");

  useEffect(() => {
    if (!items.length) return;
    const key = `${listName}:${items.map((item) => item.item_id).join(",")}`;
    if (trackedKey.current === key) return;
    trackedKey.current = key;

    trackEcommerceEvent("view_item_list", items, {
      listName,
      value: items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0),
      sendMetaServer: false,
    });
  }, [items, listName]);

  return null;
}
