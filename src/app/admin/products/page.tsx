"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  X,
  Filter
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Products Catalog</h1>
          <p className="text-slate-400">View, add, edit, or remove B2B products.</p>
        </div>
        <Button 
          onClick={handleAddClick}
          className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium shadow-md shadow-violet-500/10"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-violet-500"
          />
        </div>
        
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={dimensionFilter} onValueChange={(val) => setDimensionFilter(val || "all")}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
              <SelectValue placeholder="All Dimensions" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem value="all">All Dimensions</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="count">Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
            <p className="text-slate-400 text-sm">Fetching catalog products...</p>
          </div>
        ) : productsList.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            No products found matching the criteria.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-900/50 border-b border-slate-800 text-slate-300">
              <TableRow className="border-b border-slate-800 hover:bg-slate-900/30">
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Dimension</TableHead>
                <TableHead className="font-semibold">Base Unit</TableHead>
                <TableHead className="font-semibold">Price per Base Unit</TableHead>
                <TableHead className="font-semibold">Stock Qty</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-slate-300">
              {productsList.map((product) => (
                <TableRow key={product.id} className="border-b border-slate-800 hover:bg-slate-900/30 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-violet-400">{product.sku}</TableCell>
                  <TableCell className="font-medium text-white">{product.name}</TableCell>
                  <TableCell>
                    {product.categoryName ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
                        {product.categoryName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">None</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize text-xs text-slate-400">{product.dimension}</TableCell>
                  <TableCell className="font-mono text-xs">{product.baseUnit}</TableCell>
                  <TableCell className="font-semibold text-white">
                    {formatINR(Number(product.basePrice))}/{product.baseUnit}
                  </TableCell>
                  <TableCell>
                    <span className={Number(product.stockQuantity) === 0 ? "text-red-400 font-bold" : ""}>
                      {Number(product.stockQuantity).toLocaleString("en-IN")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(product)}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(product.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Slide-over Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-slate-900 border-l border-slate-800 text-white w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="space-y-1 mb-6">
            <SheetTitle className="text-xl font-bold text-white">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </SheetTitle>
            <SheetDescription className="text-slate-400 text-sm">
              {editingProduct 
                ? "Update product specifications and values." 
                : "Create a new product listing for the catalog."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-950/50 p-3 text-sm text-red-400 border border-red-800/50 font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="prodName" className="text-slate-300">Product Name</Label>
              <Input
                id="prodName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white focus:border-violet-500"
                placeholder="Product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodSku" className="text-slate-300">SKU (Stock Keeping Unit)</Label>
              <Input
                id="prodSku"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white focus:border-violet-500 font-mono"
                placeholder="CHEM-ETH-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodDesc" className="text-slate-300">Description</Label>
              <Input
                id="prodDesc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white focus:border-violet-500"
                placeholder="Product description"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Category</Label>
              <Select value={formCategory} onValueChange={(val) => setFormCategory(val || "none")}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="none">None</SelectItem>
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Dimension</Label>
                <Select value={formDimension} onValueChange={(val) => setFormDimension(val || "weight")}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                    <SelectValue placeholder="Dimension" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Base Unit (Auto)</Label>
                <Input
                  value={computedBaseUnit}
                  disabled
                  className="bg-slate-950 border-slate-800 text-slate-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodPrice" className="text-slate-300">Base Price (INR per Base Unit)</Label>
              <Input
                id="prodPrice"
                type="number"
                step="0.000001"
                value={formBasePrice}
                onChange={(e) => setFormBasePrice(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white focus:border-violet-500"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prodStock" className="text-slate-300">Stock Qty</Label>
                <Input
                  id="prodStock"
                  type="number"
                  step="0.000001"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-white focus:border-violet-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prodMinOrder" className="text-slate-300">Min Order Qty</Label>
                <Input
                  id="prodMinOrder"
                  type="number"
                  step="0.000001"
                  value={formMinOrder}
                  onChange={(e) => setFormMinOrder(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-white focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="prodActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-900"
              />
              <Label htmlFor="prodActive" className="text-slate-300 font-normal">Product is active and visible</Label>
            </div>

            <SheetFooter className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitLoading}
                className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium transition-all"
              >
                {isSubmitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Product"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
