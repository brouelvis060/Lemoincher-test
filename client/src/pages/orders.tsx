import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Package, ArrowRight, Eye, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { OrderStatusBadge } from "@/components/client/order-status-badge";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { OrderWithDetails } from "@shared/schema";

function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((expiry - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        queryClient.invalidateQueries({ queryKey: ["/api/orders/user"] });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400" data-testid="payment-countdown">
      <Clock className="h-4 w-4" />
      <span>
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders/user", user?.id],
    enabled: !!user,
  });

  const continuePaymentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/continue-payment`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de continuer le paiement",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/user", user?.id] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous</h2>
            <p className="text-muted-foreground mb-6">
              Veuillez vous connecter pour voir vos commandes
            </p>
            <Link href="/login">
              <Button className="w-full">Se connecter</Button>
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
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Mes Commandes</h1>
            <p className="text-muted-foreground">
              Suivez l'état de vos commandes
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const total = parseFloat(order.total);
                const createdAt = new Date(order.createdAt!);

                return (
                  <Card key={order.id} data-testid={`order-card-${order.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold">
                              Commande #{order.orderNumber}
                            </h3>
                            <OrderStatusBadge status={order.status} />
                            {order.status === "pending_payment" && order.paymentExpiresAt && (
                              <PaymentCountdown expiresAt={String(order.paymentExpiresAt)} />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {createdAt.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                            {" - "}
                            {order.items.length} article{order.items.length > 1 ? "s" : ""}
                          </p>
                          <p className="font-medium text-primary">
                            {total.toLocaleString("fr-FR")} F CFA
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.status === "pending_payment" && order.paymentExpiresAt && new Date(order.paymentExpiresAt) > new Date() && (
                            <Button
                              size="sm"
                              onClick={() => continuePaymentMutation.mutate(order.id)}
                              disabled={continuePaymentMutation.isPending}
                              data-testid={`button-continue-payment-${order.id}`}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {continuePaymentMutation.isPending ? "Chargement..." : "Continuer le paiement"}
                            </Button>
                          )}
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {order.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {order.items.slice(0, 4).map((item) => (
                              <div
                                key={item.id}
                                className="h-16 w-16 shrink-0 rounded-md overflow-hidden border bg-muted"
                              >
                                <img
                                  src={item.product?.images?.[0] || "https://placehold.co/64x64/f3f4f6/9ca3af?text=P"}
                                  alt={item.productName}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                            {order.items.length > 4 && (
                              <div className="h-16 w-16 shrink-0 rounded-md border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                                +{order.items.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Aucune commande</h2>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore passé de commande
              </p>
              <Link href="/products">
                <Button>
                  Découvrir nos produits
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </main>

      <ClientFooter />
    </div>
  );
}
