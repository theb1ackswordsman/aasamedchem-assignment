"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUnitsForDimension, convertToBase, formatINR, Dimension, Unit } from "@/lib/units";

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  dimension: string;
  baseUnit: string;
  basePrice: string;
  stockQuantity: string;
  minOrderQuantity: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function SellerBrowsePage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Track cart item IDs for UI feedback (showing checkmark if added)
  const [cartItemIds, setCartItemIds] = useState<string[]>([]);

  // Sync added items from localStorage on mount
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItemIds(cart.map((item: any) => item.productId));
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pUrl = `/api/products?search=${encodeURIComponent(searchQuery)}` + 
                   (dimensionFilter !== "all" ? `&dimension=${dimensionFilter}` : "");
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(pUrl),
        fetch("/api/categories")
      ]);

      if (productsRes.ok && categoriesRes.ok) {
        let pData: Product[] = await productsRes.json();
        const cData = await categoriesRes.json();
        
        // Filter by category client-side if selected
        if (categoryFilter !== "all") {
          pData = pData.filter(p => p.categoryId === categoryFilter);
        }
        
        // Only show active products to sellers
        setProductsList(pData.filter(p => p.isActive));
        setCategoriesList(cData);
      }
    } catch (err) {
      console.error("Error loading browse products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, dimensionFilter, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToQuote = (product: Product) => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const alreadyInCart = existingCart.some((item: any) => item.productId === product.id);

    if (alreadyInCart) {
      return; // Already added
    }

    const newItem = {
      productId: product.id,
      name: product.name,
      dimension: product.dimension,
      base_unit: product.baseUnit,
      base_price: Number(product.basePrice),
      stock_quantity: Number(product.stockQuantity)
    };

    const newCart = [...existingCart, newItem];
    localStorage.setItem("cart", JSON.stringify(newCart));
    setCartItemIds(newCart.map((item: any) => item.productId));
    
    // Dispatch custom event to update layouts
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <div className="space-y-8 bg-white">
      <div>
        <h1 className="text-[22px] font-medium text-gray-900">Chemical Catalog</h1>
      </div>

      {/* Filter Row & Search */}
      <div className="space-y-4">
        <div>
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 border border-gray-200 text-[13px] bg-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-none"
          />
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 pb-px">
          {/* Dimension filter pills */}
          <div className="flex gap-6">
            {["all", "weight", "volume", "count"].map((dim) => {
              const isActive = dimensionFilter === dim;
              return (
                <button
                  key={dim}
                  onClick={() => setDimensionFilter(dim)}
                  className={`pb-2 text-[13px] font-medium capitalize border-b-2 transition-colors -mb-px ${
                    isActive
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-950"
                  }`}
                >
                  {dim === "all" ? "All" : dim}
                </button>
              );
            })}
          </div>

          {/* Category Filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-8 border border-gray-200 text-[12px] text-gray-700 bg-white rounded-md focus:ring-blue-500 px-2 outline-none"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-gray-500 text-sm">Loading product catalog...</p>
        </div>
      ) : productsList.length === 0 ? (
        <div className="py-20 text-center text-gray-500 text-[13px] bg-white">
          No products found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {productsList.map((product) => {
            const isAdded = cartItemIds.includes(product.id);
            const validUnits = getUnitsForDimension(product.dimension as Dimension);
            
            const stockVal = Number(product.stockQuantity);
            const minOrderVal = Number(product.minOrderQuantity);
            const isLow = stockVal < minOrderVal * 5;

            // Formatted price line: e.g. "₹0.46 / g  ·  ₹460.00 / kg"
            const priceParts = validUnits.map((unit: Unit) => {
              const price = convertToBase(1, unit) * Number(product.basePrice);
              return `₹${price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${unit}`;
            });
            const priceLine = priceParts.join("  ·  ");

            // Formatted stock line
            const stockLine = isLow
              ? `LOW STOCK: ${stockVal.toLocaleString("en-IN")} ${product.baseUnit}`
              : `${stockVal.toLocaleString("en-IN")} ${product.baseUnit} available`;

            return (
              <div 
                key={product.id} 
                className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col justify-between shadow-none text-left"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-[15px] font-medium text-gray-900 leading-snug">{product.name}</h3>
                    {product.categoryName && (
                      <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0">
                        {product.categoryName}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[13px] font-mono text-gray-500 mt-2">{priceLine}</p>
                </div>

                <div className="mt-4">
                  <p className={`text-[12px] ${isLow ? "text-red-600 font-medium" : "text-gray-400"}`}>
                    {stockLine}
                  </p>
                  
                  <div className="border-t border-gray-100 mt-4" />
                  
                  <Button
                    onClick={() => handleAddToQuote(product)}
                    disabled={isAdded}
                    className={`w-full h-8 text-[13px] mt-3 rounded-md shadow-none transition-colors border border-gray-200 ${
                      isAdded
                        ? "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-50"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {isAdded ? "Added to Quote" : "Add to Quote"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
