"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatINR } from "@/lib/units";

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

export default function AdminProductsPage() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState("all");
  
  // Sheet states
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form states
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("none");
  const [formDimension, setFormDimension] = useState("weight");
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formStock, setFormStock] = useState("0");
  const [formMinOrder, setFormMinOrder] = useState("1");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-computed base unit based on dimension
  const computedBaseUnit = React.useMemo(() => {
    switch (formDimension) {
      case "weight": return "g";
      case "volume": return "mL";
      case "count": return "unit";
      default: return "unit";
    }
  }, [formDimension]);

  // Fetch products and categories
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
        const pData = await productsRes.json();
        const cData = await categoriesRes.json();
        setProductsList(pData);
        setCategoriesList(cData);
      }
    } catch (err) {
      console.error("Error loading products data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, dimensionFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Sheet for creation
  const handleAddClick = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku("");
    setFormDescription("");
    setFormCategory("none");
    setFormDimension("weight");
    setFormBasePrice("");
    setFormStock("0");
    setFormMinOrder("1");
    setFormIsActive(true);
    setFormError(null);
    setIsSheetOpen(true);
  };

  // Open Sheet for editing
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormDescription(product.description || "");
    setFormCategory(product.categoryId || "none");
    setFormDimension(product.dimension);
    setFormBasePrice(Number(product.basePrice).toString());
    setFormStock(Number(product.stockQuantity).toString());
    setFormMinOrder(Number(product.minOrderQuantity).toString());
    setFormIsActive(product.isActive);
    setFormError(null);
    setIsSheetOpen(true);
  };

  // Delete product
  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete product.");
      }
    } catch (err) {
      alert("An error occurred while deleting the product.");
    }
  };

  // Form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitLoading(true);

    const priceNum = parseFloat(formBasePrice);
    const stockNum = parseFloat(formStock);
    const minOrderNum = parseFloat(formMinOrder);

    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Base price must be a valid positive number.");
      setIsSubmitLoading(false);
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("Stock quantity must be a valid positive number.");
      setIsSubmitLoading(false);
      return;
    }

    if (isNaN(minOrderNum) || minOrderNum < 0) {
      setFormError("Minimum order quantity must be a valid positive number.");
      setIsSubmitLoading(false);
      return;
    }

    const payload = {
      name: formName.trim(),
      sku: formSku.trim().toUpperCase(),
      description: formDescription.trim(),
      categoryId: formCategory === "none" ? null : formCategory,
      dimension: formDimension,
      baseUnit: computedBaseUnit,
      basePrice: priceNum,
      stockQuantity: stockNum,
      minOrderQuantity: minOrderNum,
      isActive: formIsActive,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsSheetOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        setFormError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setFormError("Failed to save product. Please try again.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-8 bg-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-medium text-gray-900">Products</h1>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 h-9 border border-gray-200 text-[13px] bg-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-none"
          />
          
          <Select value={dimensionFilter} onValueChange={(val) => setDimensionFilter(val || "all")}>
            <SelectTrigger className="w-40 h-9 border border-gray-200 text-[13px] text-gray-900 bg-white rounded-md shadow-none">
              <SelectValue placeholder="All Dimensions" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200">
              <SelectItem value="all">All Dimensions</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="count">Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-[13px] font-medium rounded-md shadow-none"
        >
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-gray-500 text-sm">Fetching catalog products...</p>
          </div>
        ) : productsList.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-[13px] bg-white">
            No products found matching the criteria.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-white border-b border-gray-200 text-gray-500 text-[11px] font-medium uppercase tracking-widest">
              <TableRow className="border-b border-gray-200 hover:bg-white">
                <TableHead className="font-medium">ORDER ID</TableHead>
                <TableHead className="font-medium">SKU</TableHead>
                <TableHead className="font-medium">NAME</TableHead>
                <TableHead className="font-medium">CATEGORY</TableHead>
                <TableHead className="font-medium">DIMENSION</TableHead>
                <TableHead className="font-medium">BASE UNIT</TableHead>
                <TableHead className="font-medium text-right">₹/UNIT</TableHead>
                <TableHead className="font-medium text-right">STOCK</TableHead>
                <TableHead className="font-medium text-center">STATUS</TableHead>
                <TableHead className="font-medium text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[13px] text-gray-700">
              {productsList.map((product, idx) => (
                <TableRow 
                  key={product.id} 
                  className={`h-11 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-[13px] text-gray-400">—</td>
                  <td className="px-4 py-2 font-mono text-[13px] text-gray-900">{product.sku}</td>
                  <td className="px-4 py-2 font-medium text-gray-950">{product.name}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {product.categoryName || "None"}
                  </td>
                  <td className="px-4 py-2 capitalize text-gray-500">{product.dimension}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">{product.baseUnit}</td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums text-gray-900">
                    {formatINR(Number(product.basePrice))}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <span className={Number(product.stockQuantity) === 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                      {Number(product.stockQuantity).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {product.isActive ? (
                      <span className="bg-green-100 text-green-800 text-[11px] px-2 py-0.5 rounded-full font-medium">
                        active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full font-medium">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3 text-[13px]">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Slide-over Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-white border-l border-gray-200 text-gray-900 w-[400px] sm:max-w-[400px] p-8 overflow-y-auto shadow-none">
          <SheetHeader className="p-0 mb-6 space-y-1">
            <SheetTitle className="text-[18px] font-medium text-gray-900">
              {editingProduct ? "Edit Product" : "Add Product"}
            </SheetTitle>
            <SheetDescription className="text-gray-500 text-xs">
              Fill in the details to specify chemical catalog properties.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 p-3 text-[13px] text-red-600 border border-red-200 font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="prodName" className="text-[12px] font-medium text-gray-700">Name</Label>
              <Input
                id="prodName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="h-9 border border-gray-200 rounded-md text-[13px] text-gray-900 bg-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 shadow-none"
                placeholder="Product name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prodSku" className="text-[12px] font-medium text-gray-700">SKU</Label>
              <Input
                id="prodSku"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                required
                className="h-9 border border-gray-200 rounded-md text-[13px] text-gray-900 bg-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 font-mono shadow-none"
                placeholder="CHEM-ETH-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prodDesc" className="text-[12px] font-medium text-gray-700">Description</Label>
              <textarea
                id="prodDesc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full min-h-[80px] p-2 border border-gray-200 rounded-md text-[13px] text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-none"
                placeholder="Product description"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-gray-700">Category</Label>
              <Select value={formCategory} onValueChange={(val) => setFormCategory(val || "none")}>
                <SelectTrigger className="h-9 border border-gray-200 text-[13px] text-gray-900 bg-white rounded-md shadow-none">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="none">None</SelectItem>
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-gray-700">Dimension</Label>
                <Select value={formDimension} onValueChange={(val) => setFormDimension(val || "weight")}>
                  <SelectTrigger className="h-9 border border-gray-200 text-[13px] text-gray-900 bg-white rounded-md shadow-none">
                    <SelectValue placeholder="Dimension" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="weight">weight</SelectItem>
                    <SelectItem value="volume">volume</SelectItem>
                    <SelectItem value="count">count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-gray-700">Base Unit</Label>
                <Input
                  value={computedBaseUnit}
                  disabled
                  readOnly
                  className="h-9 border border-gray-200 rounded-md text-[13px] text-gray-500 bg-gray-50 font-mono shadow-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prodPrice" className="text-[12px] font-medium text-gray-700">Base Price</Label>
              <div className="flex items-center h-9 border border-gray-200 rounded-md bg-white overflow-hidden">
                <span className="px-3 text-gray-500 border-r border-gray-200 bg-gray-50 h-full flex items-center text-[13px] select-none">₹</span>
                <Input
                  id="prodPrice"
                  type="number"
                  step="0.000001"
                  value={formBasePrice}
                  onChange={(e) => setFormBasePrice(e.target.value)}
                  required
                  className="border-0 focus:ring-0 focus:border-0 rounded-none h-full text-[13px] text-gray-900 bg-transparent flex-1 shadow-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prodStock" className="text-[12px] font-medium text-gray-700">Stock Quantity</Label>
                <Input
                  id="prodStock"
                  type="number"
                  step="0.000001"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  required
                  className="h-9 border border-gray-200 rounded-md text-[13px] text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prodMinOrder" className="text-[12px] font-medium text-gray-700">Min Order Quantity</Label>
                <Input
                  id="prodMinOrder"
                  type="number"
                  step="0.000001"
                  value={formMinOrder}
                  onChange={(e) => setFormMinOrder(e.target.value)}
                  required
                  className="h-9 border border-gray-200 rounded-md text-[13px] text-gray-900 bg-white focus:ring-blue-500 focus:border-blue-500 shadow-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="prodActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="prodActive" className="text-[13px] font-normal text-gray-700 select-none">Product is active and visible</Label>
            </div>

            <SheetFooter className="p-0 pt-4 mt-6">
              <Button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-[13px] font-medium rounded-md shadow-none"
              >
                {isSubmitLoading ? "Saving..." : "Save Product"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
