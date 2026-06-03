"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SellerBrowsePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/seller/products");
  }, [router]);

  return null;
}
