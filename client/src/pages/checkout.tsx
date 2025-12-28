import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, MapPin, CreditCard, Truck, Plus, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Address } from "@shared/schema";

const addressSchema = z.object({
  label: z.string().min(1, "Libellé requis"),
  fullAddress: z.string().min(5, "Adresse complète requise"),
  city: z.string().min(2, "Ville requise"),
  zone: z.string().optional(),
  isAbidjan: z.boolean(),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { items, subtotal, totalWeight, clearCart } = useCart();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"mobile_money" | "cash_on_delivery">("mobile_money");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingFees, setShippingFees] = useState({ weightFee: 0, distanceFee: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: addresses, isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ["/api/addresses", user?.id],
    enabled: !!user,
  });

  const selectedAddressData = addresses?.find(a => a.id === selectedAddress);
  const canUseCashOnDelivery = selectedAddressData?.isAbidjan && !user?.cashOnDeliveryDisabled;
  const total = subtotal + shippingFees.weightFee + shippingFees.distanceFee;

  useEffect(() => {
    if (selectedAddressData) {
      fetch(`/api/shipping/calculate?weight=${totalWeight}&isAbidjan=${selectedAddressData.isAbidjan}`)
        .then(res => res.json())
        .then(data => setShippingFees(data))
        .catch(console.error);
    }
  }, [selectedAddressData, totalWeight]);

  useEffect(() => {
    if (!canUseCashOnDelivery && paymentMethod === "cash_on_delivery") {
      setPaymentMethod("mobile_money");
    }
  }, [canUseCashOnDelivery, paymentMethod]);

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(a => a.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      } else {
        setSelectedAddress(addresses[0].id);
      }
    }
  }, [addresses, selectedAddress]);

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      fullAddress: "",
      city: "",
      zone: "",
      isAbidjan: false,
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const response = await apiRequest("POST", "/api/addresses", {
        ...data,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      setSelectedAddress(newAddress.id);
      setShowAddressForm(false);
      addressForm.reset();
      toast({
        title: "Adresse ajoutée",
        description: "Votre nouvelle adresse a été enregistrée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'adresse",
        variant: "destructive",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        userId: user?.id,
        addressId: selectedAddress,
        paymentMethod,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          productPrice: item.product.price,
          quantity: item.quantity,
          weight: item.product.weight,
        })),
        subtotal: subtotal.toString(),
        shippingFee: shippingFees.distanceFee.toString(),
        weightFee: shippingFees.weightFee.toString(),
        total: total.toString(),
        totalWeight: totalWeight.toString(),
      };

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: async (order) => {
      await clearCart();
      
      if (paymentMethod === "mobile_money") {
        try {
          const paymentResponse = await apiRequest("POST", "/api/payments/cinetpay/init", {
            orderId: order.id,
          });
          const paymentData = await paymentResponse.json();
          
          if (paymentData.success && paymentData.paymentUrl) {
            toast({
              title: "Redirection vers le paiement",
              description: "Vous allez être redirigé vers la page de paiement",
            });
            window.location.href = paymentData.paymentUrl;
            return;
          } else {
            toast({
              title: "Erreur de paiement",
              description: paymentData.message || "Impossible d'initialiser le paiement",
              variant: "destructive",
            });
            navigate(`/orders/${order.id}`);
          }
        } catch (error) {
          console.error("Payment init error:", error);
          toast({
            title: "Erreur",
            description: "Erreur lors de l'initialisation du paiement",
            variant: "destructive",
          });
          navigate(`/orders/${order.id}`);
        }
      } else {
        toast({
          title: "Commande créée",
          description: `Votre commande ${order.orderNumber} a été enregistrée`,
        });
        navigate(`/orders/${order.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Adresse requise",
        description: "Veuillez sélectionner une adresse de livraison",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    createOrderMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-6">
              Veuillez vous connecter pour finaliser votre commande
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Panier vide</h2>
            <p className="text-muted-foreground mb-6">
              Ajoutez des produits à votre panier pour commander
            </p>
            <Link href="/products">
              <Button>Voir les produits</Button>
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
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au panier
            </Button>
          </Link>

          <h1 className="text-3xl font-bold mb-8">Finaliser la commande</h1>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-2 ${s <= step ? "text-primary" : "text-muted-foreground"}`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s < step ? "bg-primary text-primary-foreground" :
                  s === step ? "border-2 border-primary" : "border-2 border-muted"
                }`}>
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {s === 1 ? "Livraison" : s === 2 ? "Paiement" : "Confirmation"}
                </span>
                {s < 3 && <div className="w-8 h-0.5 bg-muted" />}
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Adresse de livraison
                    </CardTitle>
                    <CardDescription>
                      Sélectionnez ou ajoutez une adresse de livraison
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addressesLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : addresses && addresses.length > 0 ? (
                      <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                        {addresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                              selectedAddress === address.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                            }`}
                          >
                            <RadioGroupItem value={address.id} className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{address.label}</span>
                                {address.isAbidjan && (
                                  <Badge variant="secondary" className="text-xs">Abidjan</Badge>
                                )}
                                {address.isDefault && (
                                  <Badge variant="outline" className="text-xs">Par défaut</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {address.fullAddress}, {address.city}
                                {address.zone && ` - ${address.zone}`}
                              </p>
                            </div>
                          </label>
                        ))}
                      </RadioGroup>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Aucune adresse enregistrée
                      </p>
                    )}

                    {showAddressForm ? (
                      <Form {...addressForm}>
                        <form onSubmit={addressForm.handleSubmit((data) => createAddressMutation.mutate(data))} className="space-y-4 border-t pt-4">
                          <FormField
                            control={addressForm.control}
                            name="label"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Libellé</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Maison, Bureau..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addressForm.control}
                            name="fullAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Adresse complète</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rue, quartier, repère..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={addressForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ville</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Abidjan" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={addressForm.control}
                              name="zone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Zone (optionnel)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Cocody, Plateau..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={addressForm.control}
                            name="isAbidjan"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Cette adresse est à Abidjan</FormLabel>
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-2">
                            <Button type="submit" disabled={createAddressMutation.isPending}>
                              {createAddressMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>
                              Annuler
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => setShowAddressForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une nouvelle adresse
                      </Button>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={() => setStep(2)} disabled={!selectedAddress}>
                        Continuer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Mode de paiement
                    </CardTitle>
                    <CardDescription>
                      Choisissez votre méthode de paiement préférée
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                      <label
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          paymentMethod === "mobile_money" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value="mobile_money" className="mt-1" />
                        <div className="flex-1">
                          <span className="font-medium">Mobile Money</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            Payez avec Orange Money, MTN Money ou Wave
                          </p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          !canUseCashOnDelivery ? "opacity-50 cursor-not-allowed" :
                          paymentMethod === "cash_on_delivery" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value="cash_on_delivery" className="mt-1" disabled={!canUseCashOnDelivery} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Paiement à la livraison</span>
                            {!canUseCashOnDelivery && (
                              <Badge variant="secondary" className="text-xs">Non disponible</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {!selectedAddressData?.isAbidjan
                              ? "Disponible uniquement à Abidjan"
                              : user?.cashOnDeliveryDisabled
                              ? "Option désactivée pour votre compte"
                              : "Payez en espèces à la réception"}
                          </p>
                        </div>
                      </label>
                    </RadioGroup>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Retour
                      </Button>
                      <Button onClick={() => setStep(3)}>
                        Continuer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Confirmation de commande
                    </CardTitle>
                    <CardDescription>
                      Vérifiez les détails de votre commande
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Adresse de livraison</h4>
                      {selectedAddressData && (
                        <p className="text-sm text-muted-foreground">
                          {selectedAddressData.label} - {selectedAddressData.fullAddress}, {selectedAddressData.city}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Mode de paiement</h4>
                      <p className="text-sm text-muted-foreground">
                        {paymentMethod === "mobile_money" ? "Mobile Money" : "Paiement à la livraison"}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Articles ({items.length})</h4>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product.name}</span>
                            <span>{(parseFloat(item.product.price) * (item.quantity || 1)).toLocaleString("fr-FR")} F</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(2)}>
                        Retour
                      </Button>
                      <Button onClick={handlePlaceOrder} disabled={isProcessing}>
                        {isProcessing ? "Traitement..." : "Confirmer la commande"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total ({items.length} articles)</span>
                    <span>{subtotal.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de poids</span>
                    <span>{shippingFees.weightFee.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de livraison</span>
                    <span>{shippingFees.distanceFee.toLocaleString("fr-FR")} F</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{total.toLocaleString("fr-FR")} F</span>
                  </div>
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
