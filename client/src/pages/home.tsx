import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Truck, Shield, CreditCard, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { ProductCard } from "@/components/client/product-card";
import type { ProductWithCategory, Category } from "@shared/schema";

const features = [
  {
    icon: Truck,
    title: "Livraison rapide",
    description: "Livraison dans tout le pays avec suivi en temps réel",
  },
  {
    icon: CreditCard,
    title: "Mobile Money",
    description: "Paiement sécurisé par Orange Money, MTN Money et Wave",
  },
  {
    icon: Shield,
    title: "Paiement sécurisé",
    description: "Vos transactions sont protégées et sécurisées",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    description: "Notre équipe est disponible pour vous aider",
  },
];

export default function HomePage() {
  const { data: products, isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products", "active"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const featuredProducts = products?.slice(0, 8) || [];
  const activeCategories = categories?.filter(c => c.isActive) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <ClientHeader />
      
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container px-4 py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" data-testid="text-hero-title">
                Votre boutique en ligne{" "}
                <span className="text-primary">africaine</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Découvrez une large sélection de produits de qualité avec livraison rapide 
                et paiement Mobile Money sécurisé.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link href="/products">
                  <Button size="lg" data-testid="button-shop-now">
                    Voir les produits
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg">
                    En savoir plus
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-card">
          <div className="container px-4 py-12">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {activeCategories.length > 0 && (
          <section className="py-16">
            <div className="container px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Catégories</h2>
                  <p className="text-muted-foreground">Parcourez nos différentes catégories</p>
                </div>
                <Link href="/products">
                  <Button variant="ghost">
                    Voir tout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {categoriesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {activeCategories.slice(0, 8).map((category) => (
                    <Link key={category.id} href={`/products?category=${category.id}`}>
                      <Card className="group cursor-pointer overflow-visible hover-elevate active-elevate-2">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="text-xl font-bold">
                              {category.name[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="py-16 bg-muted/30">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Produits populaires</h2>
                <p className="text-muted-foreground">Découvrez nos meilleurs articles</p>
              </div>
              <Link href="/products">
                <Button variant="ghost">
                  Voir tout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            {productsLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="aspect-square" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Aucun produit disponible pour le moment</p>
                <p className="text-sm text-muted-foreground mt-2">Revenez bientôt pour découvrir nos nouveautés</p>
              </Card>
            )}
          </div>
        </section>

        <section className="py-16">
          <div className="container px-4">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 text-primary-foreground">
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="text-2xl font-bold md:text-3xl">
                    Inscrivez-vous et profitez de nos offres exclusives
                  </h2>
                  <p className="mt-4 text-primary-foreground/80">
                    Créez votre compte gratuitement et bénéficiez de promotions spéciales, 
                    de notifications sur vos commandes et d'un suivi personnalisé.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                    <Link href="/register">
                      <Button size="lg" variant="secondary" data-testid="button-cta-register">
                        Créer un compte
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                        Se connecter
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <ClientFooter />
    </div>
  );
}
