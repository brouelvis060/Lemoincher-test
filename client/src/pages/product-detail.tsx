import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ShoppingCart, Minus, Plus, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { ProductCard } from "@/components/client/product-card";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithCategory } from "@shared/schema";

export default function ProductDetailPage() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
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

    await addToCart(product, quantity);
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

  const price = parseFloat(product.price);
  const stock = product.stock || 0;
  const isOutOfStock = stock === 0;
  const images = product.images?.length ? product.images : ["https://placehold.co/600x600/f3f4f6/9ca3af?text=Produit"];
  const related = relatedProducts?.filter(p => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4) || [];

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
                  {price.toLocaleString("fr-FR")} F CFA
                </p>
              </div>

              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Disponibilité:</span>
                  {isOutOfStock ? (
                    <Badge variant="destructive">Rupture de stock</Badge>
                  ) : stock <= 5 ? (
                    <Badge variant="secondary">Plus que {stock} en stock</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      En stock
                    </Badge>
                  )}
                </div>

                {product.weight && parseFloat(product.weight) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Poids:</span>
                    <span>{product.weight} kg</span>
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
                      onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                      disabled={quantity >= stock}
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
                  disabled={isOutOfStock}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isOutOfStock ? "Indisponible" : "Ajouter au panier"}
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
