import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, CreditCard, Smartphone, Banknote } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PaymentSettings } from "@shared/schema";

const paymentSettingsSchema = z.object({
  cinetpayApiKey: z.string().optional(),
  cinetpaySecretKey: z.string().optional(),
  cinetpaySiteId: z.string().optional(),
  cinetpayWebhookUrl: z.string().optional(),
  cashOnDeliveryEnabled: z.boolean(),
  cashOnDeliveryAbidjanOnly: z.boolean(),
});

type PaymentSettingsForm = z.infer<typeof paymentSettingsSchema>;

export default function AdminPaymentSettings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/settings/payments"],
  });

  const form = useForm<PaymentSettingsForm>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      cinetpayApiKey: "",
      cinetpaySecretKey: "",
      cinetpaySiteId: "",
      cinetpayWebhookUrl: "",
      cashOnDeliveryEnabled: true,
      cashOnDeliveryAbidjanOnly: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        cinetpayApiKey: settings.cinetpayApiKey || "",
        cinetpaySecretKey: settings.cinetpaySecretKey || "",
        cinetpaySiteId: settings.cinetpaySiteId || "",
        cinetpayWebhookUrl: settings.cinetpayWebhookUrl || "",
        cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled ?? true,
        cashOnDeliveryAbidjanOnly: settings.cashOnDeliveryAbidjanOnly ?? true,
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: PaymentSettingsForm) => {
      const response = await apiRequest("PATCH", "/api/settings/payments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/payments"] });
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres de paiement ont été mis à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer les paramètres",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Paramètres de paiement</h1>
        <p className="text-muted-foreground">
          Configurez les modes de paiement disponibles
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                CinetPay (Mobile Money)
              </CardTitle>
              <CardDescription>
                Intégration du paiement Mobile Money via CinetPay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cinetpayApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Votre clé API CinetPay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cinetpaySecretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Votre clé secrète CinetPay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cinetpaySiteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre Site ID CinetPay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cinetpayWebhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de notification (Webhook)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://votre-site.com/api/webhook/cinetpay" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL appelée par CinetPay pour notifier les paiements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Paiement à la livraison
              </CardTitle>
              <CardDescription>
                Configuration du paiement en espèces à la réception
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cashOnDeliveryEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Activer le paiement à la livraison</FormLabel>
                      <FormDescription>
                        Permettre aux clients de payer à la réception
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cashOnDeliveryAbidjanOnly"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Limiter à Abidjan uniquement</FormLabel>
                      <FormDescription>
                        Le paiement à la livraison sera disponible uniquement pour les adresses à Abidjan
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
