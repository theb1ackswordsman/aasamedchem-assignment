"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUnitsForDimension, calculatePrice, formatINR, Dimension, Unit } from "@/lib/units";

interface CartItem {
  productId: string;
  name: string;
  dimension: string;
  base_unit: string;
  base_price: number;
  stock_quantity: number;
  // Local state extensions
  quantity?: number;
  unit?: Unit;
}

export default function QuotationBuilderPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load cart items on mount
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    // Hydrate each item with default quantity (1) and default unit (base_unit)
    const hydratedCart = storedCart.map((item: CartItem) => ({
      ...item,
      quantity: item.quantity || 1,
      unit: item.unit || (item.base_unit as Unit)
    }));
    setCart(hydratedCart);
  }, []);

  // Update localStorage helper
  const saveCartToStorage = (updatedCart: CartItem[]) => {
    // Strip state extensions before saving to localStorage to keep it clean
    const cleanCart = updatedCart.map(({ productId, name, dimension, base_unit, base_price, stock_quantity }) => ({
      productId,
      name,
      dimension,
      base_unit,
      base_price,
      stock_quantity
    }));
    localStorage.setItem("cart", JSON.stringify(cleanCart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string) => {
    const updated = cart.filter((item) => item.productId !== productId);
    setCart(updated);
    saveCartToStorage(updated);
  };

  // Update quantity handler
  const handleQuantityChange = (productId: string, valStr: string) => {
    const qty = parseFloat(valStr);
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: isNaN(qty) ? 0 : qty };
      }
      return item;
    });
    setCart(updated);
  };

  // Update unit handler
  const handleUnitChange = (productId: string, unit: Unit) => {
    const updated = cart.map((item) => {
      if (item.productId === productId) {
        return { ...item, unit };
      }
      return item;
    });
    setCart(updated);
  };

  // Calculate live Grand Total
  const grandTotal = React.useMemo(() => {
    return cart.reduce((sum, item) => {
      const qty = item.quantity || 0;
      const unit = item.unit || (item.base_unit as Unit);
      const lineTotal = calculatePrice(qty, unit, item.base_price);
      return sum + lineTotal;
    }, 0);
  }, [cart]);

  // Submit order request
  const handleSubmitQuotation = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    // Validate quantities
    for (const item of cart) {
      if (!item.quantity || item.quantity <= 0) {
        setErrorMessage(`Please enter a valid quantity for ${item.name}`);
        setIsSubmitting(false);
        return;
      }
    }

    const payload = {
      notes: orderNotes.trim(),
      items: cart.map((item) => ({
        productId: item.productId,
        orderedQuantity: item.quantity,
        orderedUnit: item.unit
      }))
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Clear quotation cart from storage and state
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cart-updated"));
        setCart([]);
        
        // Redirect to orders history
        router.push("/seller/orders");
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Failed to submit quotation order.");
      }
    } catch (err) {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 bg-white max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => router.push("/seller/products")}
            className="text-blue-600 hover:underline text-[13px] font-medium flex items-center gap-1 mb-2"
          >
            ← Back to Products
          </button>
          <h1 className="text-[22px] font-medium text-gray-900">Quotation Builder</h1>
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="border border-gray-200 rounded-lg bg-white p-12 text-center text-gray-500">
          <p className="text-[14px] mb-4">Your quotation sheet is currently empty.</p>
          <Button 
            onClick={() => router.push("/seller/products")}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-[13px] font-medium rounded-md shadow-none"
          >
            Browse Catalog
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-10 gap-6 items-start text-left">
          {/* LEFT PANEL (60%) */}
          <div className="col-span-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50/50">
              <span className="text-[11px] font-medium uppercase tracking-widest text-gray-500">ITEM DETAILS</span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-gray-500">EST. PRICE</span>
            </div>

            <div className="divide-y divide-gray-100">
              {cart.map((item) => {
                const units = getUnitsForDimension(item.dimension as Dimension);
                const currentQty = item.quantity || 0;
                const currentUnit = item.unit || (item.base_unit as Unit);
                const lineTotal = calculatePrice(currentQty, currentUnit, item.base_price);

                return (
                  <div key={item.productId} className="p-4 flex justify-between items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div>
                        <h3 className="text-[14px] font-medium text-gray-900 leading-tight">{item.name}</h3>
                        <p className="text-[12px] text-gray-500 mt-0.5 font-mono">
                          Base: {item.base_unit} @ {formatINR(item.base_price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                          className="w-20 h-8 border border-gray-200 text-[13px] text-gray-900 bg-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-none px-2"
                        />
                        
                        <select
                          value={currentUnit} 
                          onChange={(e) => handleUnitChange(item.productId, e.target.value as Unit)}
                          className="h-8 border border-gray-200 text-[12px] text-gray-700 bg-white rounded-md focus:ring-blue-500 px-2 outline-none"
                        >
                          {units.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-gray-400 hover:text-red-600 text-[12px] font-medium ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right font-medium text-[14px] tabular-nums text-gray-900 shrink-0">
                      {formatINR(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL (40%) */}
          <div className="col-span-4 bg-white border border-gray-200 rounded-lg p-6 sticky top-8 space-y-4">
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-gray-500 mb-2">ORDER SUMMARY</h2>

            {errorMessage && (
              <div className="rounded-md bg-red-50 p-3 text-[13px] text-red-600 border border-red-200 font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2 divide-y divide-gray-100">
              {cart.map((item) => {
                const currentQty = item.quantity || 0;
                const currentUnit = item.unit || (item.base_unit as Unit);
                const lineTotal = calculatePrice(currentQty, currentUnit, item.base_price);
                return (
                  <div key={item.productId} className="flex justify-between items-start text-[13px] py-2 text-gray-700 first:pt-0">
                    <span className="font-medium text-gray-950 flex-1 pr-4 truncate">{item.name}</span>
                    <span className="tabular-nums text-right text-gray-500 shrink-0">
                      {currentQty} {currentUnit} · {formatINR(lineTotal)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 pt-4" />

            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-gray-900">Grand Total</span>
              <span className="text-[24px] font-medium tabular-nums text-blue-600">
                {formatINR(grandTotal)}
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label htmlFor="orderNotes" className="text-[12px] font-medium text-gray-700">Quotation Notes</Label>
              <textarea
                id="orderNotes"
                rows={3}
                placeholder="Enter handling or delivery instructions..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full min-h-[70px] border border-gray-200 rounded-md p-2.5 text-[13px] text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-none"
              />
            </div>

            <Button
              onClick={handleSubmitQuotation}
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 mt-4 text-[13px] font-medium rounded-md shadow-none animate-none"
            >
              {isSubmitting ? "Submitting..." : "Submit Quotation"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
