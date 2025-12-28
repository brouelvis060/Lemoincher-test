import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, MessageSquare } from "lucide-react";
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
import type { SmsSettings } from "@shared/schema";

const smsSettingsSchema = z.object({
  twilioSid: z.string().optional(),
  twilioToken: z.string().optional(),
  twilioFromNumber: z.string().optional(),
  smsEnabled: z.boolean(),
});

type SmsSettingsForm = z.infer<typeof smsSettingsSchema>;

export default function AdminSmsSettings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<SmsSettings>({
    queryKey: ["/api/settings/sms"],
  });

  const form = useForm<SmsSettingsForm>({
    resolver: zodResolver(smsSettingsSchema),
    defaultValues: {
      twilioSid: "",
      twilioToken: "",
      twilioFromNumber: "",
      smsEnabled: false,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        twilioSid: settings.twilioSid || "",
        twilioToken: settings.twilioToken || "",
        twilioFromNumber: settings.twilioFromNumber || "",
        smsEnabled: settings.smsEnabled ?? false,
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: SmsSettingsForm) => {
      const response = await apiRequest("PATCH", "/api/settings/sms", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/sms"] });
      toast({
        title: "Paramètres enregistrés",
        description: "Les paramètres SMS ont été mis à jour",
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
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Paramètres SMS</h1>
        <p className="text-muted-foreground">
          Configurez les notifications SMS via Twilio
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configuration Twilio
              </CardTitle>
              <CardDescription>
                Configurez votre compte Twilio pour envoyer des SMS automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="smsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Activer les notifications SMS</FormLabel>
                      <FormDescription>
                        Envoyer des SMS automatiques pour le suivi des commandes
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
                name="twilioSid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account SID</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Votre Account SID Twilio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twilioToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auth Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Votre Auth Token Twilio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twilioFromNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro d'expédition</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormDescription>
                      Le numéro Twilio utilisé pour envoyer les SMS
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages automatiques</CardTitle>
              <CardDescription>
                Les SMS suivants seront envoyés automatiquement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Commande reçue</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyé après validation d'une nouvelle commande
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Colis expédié</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyé lorsque le colis est en route
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Arrivée à la gare</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyé lorsque le colis arrive à la gare de destination
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Confirmation de retrait</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyé après confirmation du retrait par le client
                    </p>
                  </div>
                </div>
              </div>
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
