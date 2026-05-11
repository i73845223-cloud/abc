"use client";

import { useEffect } from "react";

export function SoftoffersClickTracker() {
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };

    const clickId = getCookie("partnerClickId");
    const promoCode = getCookie("promo_code");
    const alreadyFired = getCookie("softoffers_click_fired");

    if (clickId && promoCode && !alreadyFired) {
      fetch("/api/softoffers/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode }),
      });
    }
  }, []);

  return null;
}