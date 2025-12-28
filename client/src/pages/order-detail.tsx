import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Package, MapPin, CreditCard, Truck, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { OrderStatusBadge } from "@/components/client/order-status-badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OrderWithDetails } from "@shared/schema";

const statusSteps = [
  { status: "pending", label: "Commande reçue", icon: Package },
  { status: "confirmed", label: "Confirmée", icon: CheckCircle },
  { status: "shipped", label: "Expédiée", icon: Truck },
  { status: "at_station", label: "À la gare", icon: MapPin },
  { status: "delivered", label: "Livrée", icon: CheckCircle },
];

export default function OrderDetailPage() {
  const [, params] = useRoute("/orders/:id");
  const orderId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<OrderWithDetails>({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  const confirmPickupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, {
        clientConfirmedPickup: true,
        status: "delivered",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId] });
      toast({
        title: "Retrait confirmé",
        description: "Merci d'avoir confirmé la réception de votre commande",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer le retrait",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-6">
              Veuillez vous connecter pour voir cette commande
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </main>
        <ClientFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Commande non trouvée</h2>
            <p className="text-muted-foreground mb-6">
              Cette commande n'existe pas ou a été supprimée
            </p>
            <Link href="/orders">
              <Button>Voir mes commandes</Button>
            </Link>
          </Card>
        </main>
        <ClientFooter />
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);
  const subtotal = parseFloat(order.subtotal);
  const shippingFee = parseFloat(order.shippingFee || "0");
  const weightFee = parseFloat(order.weightFee || "0");
  const total = parseFloat(order.total);
  const createdAt = new Date(order.createdAt!);

  return (
    <div className="min-h-screen flex flex-col">
      <ClientHeader />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux commandes
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-order-number">
                Commande #{order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Passée le {createdAt.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Suivi de commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="flex justify-between">
                      {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const Icon = step.icon;

                        return (
                          <div key={step.status} className="flex flex-col items-center relative z-10">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                                isCompleted
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-xs mt-2 text-center ${isCompleted ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {order.status === "at_station" && order.stationReceiptImage && (
                    <div className="mt-6 p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Photo du reçu de la gare</h4>
                      <img
                        src={order.stationReceiptImage}
                        alt="Reçu gare"
                        className="max-w-sm rounded-lg"
                      />
                    </div>
                  )}

                  {order.status === "at_station" && !order.clientConfirmedPickup && (
                    <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-2">Confirmer le retrait</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Avez-vous récupéré votre colis à la gare ?
                      </p>
                      <Button
                        onClick={() => confirmPickupMutation.mutate()}
                        disabled={confirmPickupMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {confirmPickupMutation.isPending ? "Confirmation..." : "Confirmer le retrait"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Articles commandés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item) => {
                      const itemTotal = parseFloat(item.productPrice) * item.quantity;
                      const image = item.product?.images?.[0] || "https://placehold.co/80x80/f3f4f6/9ca3af?text=P";

                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border">
                            <img src={image} alt={item.productName} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {parseFloat(item.productPrice).toLocaleString("fr-FR")} F x {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{itemTotal.toLocaleString("fr-FR")} F</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{subtotal.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de poids</span>
                    <span>{weightFee.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de livraison</span>
                    <span>{shippingFee.toLocaleString("fr-FR")} F</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{total.toLocaleString("fr-FR")} F</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.address ? (
                    <div className="text-sm">
                      <p className="font-medium">{order.address.label}</p>
                      <p className="text-muted-foreground">{order.address.fullAddress}</p>
                      <p className="text-muted-foreground">{order.address.city}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Adresse non spécifiée</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {order.paymentMethod === "mobile_money" ? "Mobile Money" : "Paiement à la livraison"}
                  </p>
                  {order.payment && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Statut: {order.payment.status === "completed" ? "Payé" : "En attente"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ClientFooter />
    </div>
  );
}
