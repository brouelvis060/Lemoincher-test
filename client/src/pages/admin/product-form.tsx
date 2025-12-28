import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft, Save, Upload, X, Image } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ProductWithCategory, Category } from "@shared/schema";

const productSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().optional(),
  price: z.string().min(1, "Prix requis"),
  stock: z.coerce.number().min(0, "Stock invalide"),
  weight: z.string().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function AdminProductForm() {
  const [, params] = useRoute("/admin/products/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = params?.id && params.id !== "new";
  const productId = isEditing ? params.id : null;
  const [uploaderKey, setUploaderKey] = useState(0);

  const { data: product, isLoading: productLoading } = useQuery<ProductWithCategory>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: 0,
      weight: "",
      categoryId: "",
      images: [],
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        stock: product.stock || 0,
        weight: product.weight || "",
        categoryId: product.categoryId || "",
        images: product.images || [],
        isActive: product.isActive ?? true,
      });
    }
  }, [product, form]);

  const handleGetUploadParameters = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const data = await response.json();
    file.meta = { ...file.meta, objectPath: data.objectPath };

    return {
      method: "PUT" as const,
      url: data.uploadURL,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    };
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const payload = {
        ...data,
        images: data.images || [],
        categoryId: data.categoryId || null,
      };

      if (isEditing) {
        const response = await apiRequest("PATCH", `/api/products/${productId}`, payload);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/products", payload);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: isEditing ? "Produit modifié" : "Produit créé",
        description: isEditing
          ? "Le produit a été mis à jour avec succès"
          : "Le produit a été créé avec succès",
      });
      navigate("/admin/products");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le produit",
        variant: "destructive",
      });
    },
  });

  if (isEditing && productLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {isEditing ? "Modifier le produit" : "Nouveau produit"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Modifiez les informations du produit" : "Ajoutez un nouveau produit à votre catalogue"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du produit *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: T-shirt Premium" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre produit..."
                            className="min-h-32"
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Images du produit</FormLabel>
                        <div className="space-y-3">
                          {field.value && field.value.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {field.value.map((img, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={img}
                                    alt={`Image ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      const newImages = field.value?.filter((_, i) => i !== index) || [];
                                      field.onChange(newImages);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <ObjectUploader
                              key={uploaderKey}
                              maxNumberOfFiles={5}
                              maxFileSize={5 * 1024 * 1024}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={async (result) => {
                                if (result.successful && result.successful.length > 0) {
                                  const newUrls: string[] = [];
                                  for (const file of result.successful) {
                                    const objectPath = file.meta?.objectPath;
                                    if (objectPath) {
                                      const fullUrl = `${window.location.origin}${objectPath}`;
                                      newUrls.push(fullUrl);
                                      
                                      // Register in media library
                                      await apiRequest("POST", "/api/media", {
                                        name: file.name,
                                        originalName: file.name,
                                        mimeType: file.type || "image/jpeg",
                                        size: file.size,
                                        objectPath: objectPath,
                                        url: fullUrl,
                                      });
                                    }
                                  }
                                  field.onChange([...(field.value || []), ...newUrls]);
                                  queryClient.invalidateQueries({ queryKey: ["/api/media"] });
                                  setUploaderKey(prev => prev + 1);
                                  toast({ title: `${newUrls.length} image(s) téléchargée(s)` });
                                }
                              }}
                              buttonClassName="mt-2"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Télécharger des images
                            </ObjectUploader>
                          </div>
                        </div>
                        <FormDescription>
                          Vous pouvez ajouter jusqu'à 5 images par téléchargement
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prix et stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix (F CFA) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-stock" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Poids (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0" {...field} data-testid="input-weight" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Aucune catégorie</SelectItem>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Actif</FormLabel>
                          <FormDescription>
                            Le produit sera visible sur le site
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                disabled={saveMutation.isPending}
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
