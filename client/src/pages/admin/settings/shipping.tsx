import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ShippingRule } from "@shared/schema";

const shippingRuleSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  minWeight: z.string(),
  maxWeight: z.string().optional(),
  fee: z.string(),
  distanceFeeAbidjan: z.string(),
  distanceFeeOutside: z.string(),
  isActive: z.boolean(),
});

type ShippingRuleForm = z.infer<typeof shippingRuleSchema>;

export default function AdminShippingSettings() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rules, isLoading } = useQuery<ShippingRule[]>({
    queryKey: ["/api/shipping-rules"],
  });

  const form = useForm<ShippingRuleForm>({
    resolver: zodResolver(shippingRuleSchema),
    defaultValues: {
      name: "",
      minWeight: "0",
      maxWeight: "",
      fee: "0",
      distanceFeeAbidjan: "1000",
      distanceFeeOutside: "3000",
      isActive: true,
    },
  });

  const resetForm = () => {
    form.reset({
      name: "",
      minWeight: "0",
      maxWeight: "",
      fee: "0",
      distanceFeeAbidjan: "1000",
      distanceFeeOutside: "3000",
      isActive: true,
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: ShippingRule) => {
    setEditingRule(rule);
    form.reset({
      name: rule.name,
      minWeight: rule.minWeight || "0",
      maxWeight: rule.maxWeight || "",
      fee: rule.fee || "0",
      distanceFeeAbidjan: rule.distanceFeeAbidjan || "1000",
      distanceFeeOutside: rule.distanceFeeOutside || "3000",
      isActive: rule.isActive ?? true,
    });
    setShowDialog(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ShippingRuleForm) => {
      if (editingRule) {
        const response = await apiRequest("PATCH", `/api/shipping-rules/${editingRule.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/shipping-rules", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rules"] });
      toast({
        title: editingRule ? "Règle modifiée" : "Règle créée",
        description: "La règle de livraison a été enregistrée",
      });
      setShowDialog(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la règle",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/shipping-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipping-rules"] });
      toast({
        title: "Règle supprimée",
        description: "La règle de livraison a été supprimée",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Frais de livraison</h1>
          <p className="text-muted-foreground">
            Configurez les règles de calcul des frais de livraison
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-rule">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Modifier la règle" : "Nouvelle règle de livraison"}
              </DialogTitle>
              <DialogDescription>
                Définissez les frais en fonction du poids
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de la règle *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 0-9 kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="minWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poids min (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poids max (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="Illimité" {...field} />
                        </FormControl>
                        <FormDescription>Laissez vide pour illimité</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais de poids (F CFA)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>Frais supplémentaires liés au poids</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="distanceFeeAbidjan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais distance Abidjan</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="distanceFeeOutside"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frais distance hors Abidjan</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <FormLabel>Règle active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Règles de livraison
          </CardTitle>
          <CardDescription>
            Les frais sont calculés en fonction du poids total et de la zone de livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : rules && rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      {rule.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>Poids: {rule.minWeight} - {rule.maxWeight || "+"} kg</span>
                      <span className="mx-2">|</span>
                      <span>Frais poids: {parseFloat(rule.fee || "0").toLocaleString("fr-FR")} F</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Abidjan: {parseFloat(rule.distanceFeeAbidjan || "0").toLocaleString("fr-FR")} F</span>
                      <span className="mx-2">|</span>
                      <span>Hors Abidjan: {parseFloat(rule.distanceFeeOutside || "0").toLocaleString("fr-FR")} F</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucune règle de livraison configurée</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une règle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
