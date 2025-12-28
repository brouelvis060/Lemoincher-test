import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import type { AttributeWithValues, AttributeValue } from "@shared/schema";

const attributeSchema = z.object({
  name: z.string().min(2, "Nom requis (ex: Taille, Couleur)"),
  slug: z.string().min(2, "Slug requis").regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)"),
  isActive: z.boolean(),
});

const valueSchema = z.object({
  value: z.string().min(1, "Valeur requise"),
  slug: z.string().min(1, "Slug requis").regex(/^[a-z0-9-]+$/, "Slug invalide"),
});

type AttributeForm = z.infer<typeof attributeSchema>;
type ValueForm = z.infer<typeof valueSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminAttributes() {
  const { toast } = useToast();
  const [showAttributeDialog, setShowAttributeDialog] = useState(false);
  const [showValueDialog, setShowValueDialog] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeWithValues | null>(null);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeWithValues | null>(null);
  const [deleteAttributeId, setDeleteAttributeId] = useState<string | null>(null);
  const [deleteValueId, setDeleteValueId] = useState<string | null>(null);
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set());

  const { data: attributes, isLoading } = useQuery<AttributeWithValues[]>({
    queryKey: ["/api/global-attributes"],
  });

  const attributeForm = useForm<AttributeForm>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name: "",
      slug: "",
      isActive: true,
    },
  });

  const valueForm = useForm<ValueForm>({
    resolver: zodResolver(valueSchema),
    defaultValues: {
      value: "",
      slug: "",
    },
  });

  const resetAttributeForm = () => {
    attributeForm.reset({
      name: "",
      slug: "",
      isActive: true,
    });
    setEditingAttribute(null);
  };

  const resetValueForm = () => {
    valueForm.reset({
      value: "",
      slug: "",
    });
    setEditingValue(null);
  };

  const openEditAttributeDialog = (attr: AttributeWithValues) => {
    setEditingAttribute(attr);
    attributeForm.reset({
      name: attr.name,
      slug: attr.slug,
      isActive: attr.isActive ?? true,
    });
    setShowAttributeDialog(true);
  };

  const openAddValueDialog = (attr: AttributeWithValues) => {
    setSelectedAttribute(attr);
    resetValueForm();
    setShowValueDialog(true);
  };

  const openEditValueDialog = (attr: AttributeWithValues, val: AttributeValue) => {
    setSelectedAttribute(attr);
    setEditingValue(val);
    valueForm.reset({
      value: val.value,
      slug: val.slug,
    });
    setShowValueDialog(true);
  };

  const toggleExpand = (attrId: string) => {
    setExpandedAttributes(prev => {
      const next = new Set(prev);
      if (next.has(attrId)) {
        next.delete(attrId);
      } else {
        next.add(attrId);
      }
      return next;
    });
  };

  const saveAttributeMutation = useMutation({
    mutationFn: async (data: AttributeForm) => {
      if (editingAttribute) {
        const response = await apiRequest("PATCH", `/api/global-attributes/${editingAttribute.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/global-attributes", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-attributes"] });
      toast({
        title: editingAttribute ? "Attribut modifié" : "Attribut créé",
        description: "L'attribut a été enregistré avec succès",
      });
      setShowAttributeDialog(false);
      resetAttributeForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'attribut",
        variant: "destructive",
      });
    },
  });

  const deleteAttributeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/global-attributes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-attributes"] });
      toast({
        title: "Attribut supprimé",
        description: "L'attribut et ses valeurs ont été supprimés",
      });
      setDeleteAttributeId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'attribut",
        variant: "destructive",
      });
    },
  });

  const saveValueMutation = useMutation({
    mutationFn: async (data: ValueForm) => {
      if (editingValue) {
        const response = await apiRequest("PATCH", `/api/attribute-values/${editingValue.id}`, data);
        return response.json();
      } else if (selectedAttribute) {
        const response = await apiRequest("POST", `/api/global-attributes/${selectedAttribute.id}/values`, data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-attributes"] });
      toast({
        title: editingValue ? "Valeur modifiée" : "Valeur ajoutée",
        description: "La valeur a été enregistrée avec succès",
      });
      setShowValueDialog(false);
      resetValueForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la valeur",
        variant: "destructive",
      });
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/attribute-values/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-attributes"] });
      toast({
        title: "Valeur supprimée",
        description: "La valeur a été supprimée",
      });
      setDeleteValueId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la valeur",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Attributs</h1>
          <p className="text-muted-foreground">
            Gérez les attributs globaux (Taille, Couleur, etc.) pour vos produits variables
          </p>
        </div>
        <Button
          onClick={() => {
            resetAttributeForm();
            setShowAttributeDialog(true);
          }}
          data-testid="button-add-attribute"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel attribut
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : attributes && attributes.length > 0 ? (
        <div className="space-y-4">
          {attributes.map((attr) => (
            <Card key={attr.id} data-testid={`card-attribute-${attr.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(attr.id)}
                      data-testid={`button-expand-${attr.id}`}
                    >
                      {expandedAttributes.has(attr.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <Tag className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold" data-testid={`text-attribute-name-${attr.id}`}>
                        {attr.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Slug: {attr.slug} | {attr.values.length} valeur{attr.values.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {!attr.isActive && (
                      <Badge variant="secondary" className="ml-2">Inactif</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddValueDialog(attr)}
                      data-testid={`button-add-value-${attr.id}`}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Valeur
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditAttributeDialog(attr)}
                      data-testid={`button-edit-${attr.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteAttributeId(attr.id)}
                      data-testid={`button-delete-${attr.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {expandedAttributes.has(attr.id) && (
                  <div className="mt-4 ml-12 space-y-2">
                    {attr.values.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        Aucune valeur. Ajoutez des valeurs pour cet attribut.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map((val) => (
                          <div
                            key={val.id}
                            className="flex items-center gap-1 bg-muted rounded-md px-2 py-1"
                            data-testid={`value-item-${val.id}`}
                          >
                            <span className="text-sm">{val.value}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => openEditValueDialog(attr, val)}
                              data-testid={`button-edit-value-${val.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setDeleteValueId(val.id)}
                              data-testid={`button-delete-value-${val.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun attribut</h3>
            <p className="text-muted-foreground text-center mb-4">
              Créez des attributs comme "Taille", "Couleur" pour vos produits variables
            </p>
            <Button
              onClick={() => {
                resetAttributeForm();
                setShowAttributeDialog(true);
              }}
              data-testid="button-create-first-attribute"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un attribut
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAttribute ? "Modifier l'attribut" : "Nouvel attribut"}
            </DialogTitle>
            <DialogDescription>
              {editingAttribute
                ? "Modifiez les informations de l'attribut"
                : "Créez un nouvel attribut global (ex: Taille, Couleur, Matière)"}
            </DialogDescription>
          </DialogHeader>
          <Form {...attributeForm}>
            <form
              onSubmit={attributeForm.handleSubmit((data) => saveAttributeMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={attributeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'attribut</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Taille, Couleur, Matière"
                        onChange={(e) => {
                          field.onChange(e);
                          if (!editingAttribute) {
                            attributeForm.setValue("slug", generateSlug(e.target.value));
                          }
                        }}
                        data-testid="input-attribute-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={attributeForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: taille, couleur"
                        data-testid="input-attribute-slug"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={attributeForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Actif</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        L'attribut sera disponible pour les produits
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-attribute-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAttributeDialog(false);
                    resetAttributeForm();
                  }}
                  data-testid="button-cancel-attribute"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saveAttributeMutation.isPending}
                  data-testid="button-save-attribute"
                >
                  {saveAttributeMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showValueDialog} onOpenChange={setShowValueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingValue ? "Modifier la valeur" : "Nouvelle valeur"}
            </DialogTitle>
            <DialogDescription>
              {selectedAttribute && (
                <>
                  {editingValue
                    ? `Modifiez la valeur pour l'attribut "${selectedAttribute.name}"`
                    : `Ajoutez une valeur à l'attribut "${selectedAttribute.name}"`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...valueForm}>
            <form
              onSubmit={valueForm.handleSubmit((data) => saveValueMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={valueForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: S, M, L, XL ou Rouge, Bleu"
                        onChange={(e) => {
                          field.onChange(e);
                          if (!editingValue) {
                            valueForm.setValue("slug", generateSlug(e.target.value));
                          }
                        }}
                        data-testid="input-value-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={valueForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: s, m, l, xl"
                        data-testid="input-value-slug"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowValueDialog(false);
                    resetValueForm();
                  }}
                  data-testid="button-cancel-value"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saveValueMutation.isPending}
                  data-testid="button-save-value"
                >
                  {saveValueMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAttributeId} onOpenChange={() => setDeleteAttributeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'attribut ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera également toutes les valeurs associées à cet attribut.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-attribute">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAttributeId && deleteAttributeMutation.mutate(deleteAttributeId)}
              data-testid="button-confirm-delete-attribute"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteValueId} onOpenChange={() => setDeleteValueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la valeur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-value">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteValueId && deleteValueMutation.mutate(deleteValueId)}
              data-testid="button-confirm-delete-value"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
