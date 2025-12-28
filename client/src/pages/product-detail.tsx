import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ShoppingCart, Minus, Plus, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { ProductCard } from "@/components/client/product-card";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithCategory, ProductVariation } from "@shared/schema";

export default function ProductDetailPage() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<ProductWithCategory>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: relatedProducts } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products", "active"],
  });

  const isVariable = product?.productType === "variable";
  const variations = product?.variations || [];

  const parsedAttributes = useMemo(() => {
    if (!isVariable || variations.length === 0) return {};
    
    const attrs: Record<string, Set<string>> = {};
    
    variations.forEach(v => {
      if (!v.attributeValues) return;
      const parts = v.attributeValues.split(" | ");
      parts.forEach(part => {
        const [name, value] = part.split(": ").map(s => s.trim());
        if (name && value) {
          if (!attrs[name]) attrs[name] = new Set();
          attrs[name].add(value);
        }
      });
    });
    
    const result: Record<string, string[]> = {};
    Object.entries(attrs).forEach(([name, values]) => {
      result[name] = Array.from(values).sort();
    });
    
    return result;
  }, [isVariable, variations]);

  useEffect(() => {
    if (Object.keys(parsedAttributes).length > 0 && Object.keys(selectedAttributes).length === 0) {
      const initial: Record<string, string> = {};
      Object.keys(parsedAttributes).forEach(name => {
        initial[name] = "";
      });
      setSelectedAttributes(initial);
    }
  }, [parsedAttributes]);

  useEffect(() => {
    if (!isVariable || variations.length === 0) {
      setSelectedVariation(null);
      return;
    }

    const allSelected = Object.keys(parsedAttributes).every(name => selectedAttributes[name]);
    if (!allSelected) {
      setSelectedVariation(null);
      return;
    }

    const targetValues = Object.entries(selectedAttributes)
      .map(([name, value]) => `${name}: ${value}`)
      .sort()
      .join(" | ");

    const match = variations.find(v => {
      const variationValues = v.attributeValues.split(" | ").sort().join(" | ");
      return variationValues === targetValues;
    });

    setSelectedVariation(match || null);
  }, [selectedAttributes, isVariable, variations, parsedAttributes]);

  const handleAttributeChange = (attrName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attrName]: value,
    }));
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter au panier",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    if (isVariable && !selectedVariation) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner toutes les options",
        variant: "destructive",
      });
      return;
    }

    await addToCart(product, quantity, selectedVariation?.id);
    toast({
      title: "Produit ajouté",
      description: `${quantity} x ${product.name} ajouté au panier`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <ClientFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Produit non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              Ce produit n'existe pas ou a été supprimé
            </p>
            <Link href="/products">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux produits
              </Button>
            </Link>
          </Card>
        </main>
        <ClientFooter />
      </div>
    );
  }

  const displayPrice = selectedVariation 
    ? parseFloat(selectedVariation.price) 
    : parseFloat(product.price);
  const displayStock = selectedVariation 
    ? (selectedVariation.stock || 0) 
    : (product.stock || 0);
  const isOutOfStock = isVariable 
    ? (selectedVariation ? (selectedVariation.stock || 0) === 0 : false)
    : (product.stock || 0) === 0;
  const images = product.images?.length ? product.images : ["https://placehold.co/600x600/f3f4f6/9ca3af?text=Produit"];
  const related = relatedProducts?.filter(p => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4) || [];
  const canAddToCart = isVariable ? !!selectedVariation && !isOutOfStock : !isOutOfStock;

  return (
    <div className="min-h-screen flex flex-col">
      <ClientHeader />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux produits
            </Button>
          </Link>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 h-20 w-20 rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {product.category && (
                <Badge variant="secondary">{product.category.name}</Badge>
              )}

              <div>
                <h1 className="text-3xl font-bold" data-testid="text-product-name">
                  {product.name}
                </h1>
                <p className="mt-4 text-3xl font-bold text-primary" data-testid="text-product-price">
                  {displayPrice.toLocaleString("fr-FR")} F CFA
                </p>
              </div>

              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}

              <Separator />

              {isVariable && Object.keys(parsedAttributes).length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Choisir vos options</h3>
                  {Object.entries(parsedAttributes).map(([attrName, values]) => (
                    <div key={attrName} className="space-y-2">
                      <Label htmlFor={`attr-${attrName}`}>{attrName}</Label>
                      <Select
                        value={selectedAttributes[attrName] || ""}
                        onValueChange={(value) => handleAttributeChange(attrName, value)}
                      >
                        <SelectTrigger id={`attr-${attrName}`} data-testid={`select-${attrName.toLowerCase()}`}>
                          <SelectValue placeholder={`Choisir ${attrName.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {values.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {selectedVariation && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Variation sélectionnée : <span className="font-medium text-foreground">{selectedVariation.attributeValues}</span>
                      </p>
                    </div>
                  )}
                  <Separator />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Disponibilité:</span>
                  {isVariable && !selectedVariation ? (
                    <Badge variant="secondary">Sélectionnez une option</Badge>
                  ) : isOutOfStock ? (
                    <Badge variant="destructive">Rupture de stock</Badge>
                  ) : displayStock <= 5 ? (
                    <Badge variant="secondary">Plus que {displayStock} en stock</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      En stock
                    </Badge>
                  )}
                </div>

                {((selectedVariation?.weight && parseFloat(selectedVariation.weight) > 0) || 
                  (!selectedVariation && product.weight && parseFloat(product.weight) > 0)) && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Poids:</span>
                    <span>{selectedVariation?.weight || product.weight} kg</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Quantité:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      data-testid="button-decrease-quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(displayStock || 999, quantity + 1))}
                      disabled={displayStock > 0 && quantity >= displayStock}
                      data-testid="button-increase-quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isVariable && !selectedVariation 
                    ? "Sélectionnez une option" 
                    : isOutOfStock 
                      ? "Indisponible" 
                      : "Ajouter au panier"}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Truck className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium">Livraison rapide</p>
                      <p className="text-muted-foreground">Partout en CI</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Shield className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium">Paiement sécurisé</p>
                      <p className="text-muted-foreground">Mobile Money</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <RotateCcw className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium">Retours faciles</p>
                      <p className="text-muted-foreground">Sous 7 jours</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-8">Produits similaires</h2>
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <ClientFooter />
    </div>
  );
}
