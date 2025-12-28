import { Link } from "wouter";
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export default function CartPage() {
  const { items, isLoading, updateQuantity, removeFromCart, subtotal, totalWeight } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous</h2>
            <p className="text-muted-foreground mb-6">
              Veuillez vous connecter pour voir votre panier
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/login">
                <Button className="w-full">Se connecter</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full">Créer un compte</Button>
              </Link>
            </div>
          </Card>
        </main>
        <ClientFooter />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Votre panier est vide</h2>
            <p className="text-muted-foreground mb-6">
              Découvrez nos produits et ajoutez-les à votre panier
            </p>
            <Link href="/products">
              <Button>
                Voir les produits
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </main>
        <ClientFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ClientHeader />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="mb-8">
            <Link href="/products">
              <Button variant="ghost" size="sm" data-testid="button-continue-shopping">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continuer mes achats
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mt-4" data-testid="text-page-title">Mon Panier</h1>
            <p className="text-muted-foreground">
              {items.length} article{items.length > 1 ? "s" : ""} dans votre panier
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const price = parseFloat(item.product.price);
                const itemTotal = price * (item.quantity || 1);
                const mainImage = item.product.images?.[0] || "https://placehold.co/100x100/f3f4f6/9ca3af?text=P";

                return (
                  <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                          <img
                            src={mainImage}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <div>
                              <Link href={`/product/${item.product.id}`}>
                                <h3 className="font-semibold hover:text-primary transition-colors">
                                  {item.product.name}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {price.toLocaleString("fr-FR")} F / unité
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                              data-testid={`button-remove-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                disabled={(item.quantity || 1) <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-semibold">
                              {itemTotal.toLocaleString("fr-FR")} F
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{subtotal.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Poids total</span>
                    <span>{totalWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Frais de livraison</span>
                    <span>Calculés à la prochaine étape</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total estimé</span>
                    <span className="text-primary">{subtotal.toLocaleString("fr-FR")} F</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full" size="lg" data-testid="button-checkout">
                      Passer la commande
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ClientFooter />
    </div>
  );
}
