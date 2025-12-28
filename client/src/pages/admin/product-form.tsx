import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft, Save, Upload, X, Image, Plus, Trash2, RefreshCw, Settings } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ProductWithCategory, Category, ProductVariation, ProductAttribute } from "@shared/schema";

const attributeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  values: z.array(z.string()).min(1, "Au moins une valeur requise"),
});

const variationSchema = z.object({
  id: z.string().optional(),
  attributeValues: z.string(),
  sku: z.string().optional(),
  price: z.string().min(1, "Prix requis"),
  stock: z.coerce.number().min(0, "Stock invalide"),
  weight: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().optional(),
  productType: z.enum(["simple", "variable"]).default("simple"),
  price: z.string().min(1, "Prix requis"),
  stock: z.coerce.number().min(0, "Stock invalide"),
  weight: z.string().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean(),
  attributes: z.array(attributeSchema).optional(),
  variations: z.array(variationSchema).optional(),
});

type ProductForm = z.infer<typeof productSchema>;
type AttributeForm = z.infer<typeof attributeSchema>;

export default function AdminProductForm() {
  const [, params] = useRoute("/admin/products/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = params?.id && params.id !== "new";
  const productId = isEditing ? params.id : null;
  const [uploaderKey, setUploaderKey] = useState(0);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [editingAttributeIndex, setEditingAttributeIndex] = useState<number | null>(null);

  const { data: product, isLoading: productLoading } = useQuery<ProductWithCategory>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: productAttributes } = useQuery<ProductAttribute[]>({
    queryKey: ["/api/products", productId, "attributes"],
    enabled: !!productId,
  });

  const { data: productVariations } = useQuery<ProductVariation[]>({
    queryKey: ["/api/products", productId, "variations"],
    enabled: !!productId,
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      productType: "simple",
      price: "",
      stock: 0,
      weight: "",
      categoryId: "",
      images: [],
      isActive: true,
      attributes: [],
      variations: [],
    },
  });

  const { fields: attributeFields, append: appendAttribute, remove: removeAttribute, update: updateAttribute } = useFieldArray({
    control: form.control,
    name: "attributes",
  });

  const { fields: variationFields, replace: replaceVariations, remove: removeVariation } = useFieldArray({
    control: form.control,
    name: "variations",
  });

  const productType = form.watch("productType");
  const attributes = form.watch("attributes");

  useEffect(() => {
    if (product) {
      const loadedAttributes = productAttributes?.map(attr => ({
        id: attr.id,
        name: attr.name,
        values: attr.values || [],
      })) || [];

      const loadedVariations = productVariations?.map(v => ({
        id: v.id,
        attributeValues: v.attributeValues || "",
        sku: v.sku || "",
        price: v.price,
        stock: v.stock || 0,
        weight: v.weight || "",
        image: v.image || "",
        isActive: v.isActive ?? true,
      })) || [];

      form.reset({
        name: product.name,
        description: product.description || "",
        productType: product.productType || "simple",
        price: product.price,
        stock: product.stock || 0,
        weight: product.weight || "",
        categoryId: product.categoryId || "",
        images: product.images || [],
        isActive: product.isActive ?? true,
        attributes: loadedAttributes,
        variations: loadedVariations,
      });
    }
  }, [product, productAttributes, productVariations, form]);

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

  const addAttribute = () => {
    if (!newAttributeName.trim()) {
      toast({ title: "Erreur", description: "Nom de l'attribut requis", variant: "destructive" });
      return;
    }
    appendAttribute({
      name: newAttributeName.trim(),
      values: [],
    });
    setNewAttributeName("");
  };

  const addValueToAttribute = (index: number) => {
    if (!newAttributeValue.trim()) return;
    const currentAttribute = attributeFields[index];
    const currentValues = form.getValues(`attributes.${index}.values`) || [];
    if (currentValues.includes(newAttributeValue.trim())) {
      toast({ title: "Erreur", description: "Cette valeur existe déjà", variant: "destructive" });
      return;
    }
    updateAttribute(index, {
      ...currentAttribute,
      values: [...currentValues, newAttributeValue.trim()],
    });
    setNewAttributeValue("");
  };

  const removeValueFromAttribute = (attrIndex: number, valueIndex: number) => {
    const currentAttribute = attributeFields[attrIndex];
    const currentValues = form.getValues(`attributes.${attrIndex}.values`) || [];
    updateAttribute(attrIndex, {
      ...currentAttribute,
      values: currentValues.filter((_, i) => i !== valueIndex),
    });
  };

  const generateVariations = () => {
    const currentAttributes = form.getValues("attributes") || [];
    if (currentAttributes.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins un attribut", variant: "destructive" });
      return;
    }

    const validAttributes = currentAttributes.filter(attr => attr.values && attr.values.length > 0);
    if (validAttributes.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez des valeurs à vos attributs", variant: "destructive" });
      return;
    }

    const generateCombinations = (attrs: AttributeForm[]): string[][] => {
      if (attrs.length === 0) return [[]];
      const [first, ...rest] = attrs;
      const restCombinations = generateCombinations(rest);
      const combinations: string[][] = [];
      for (const value of first.values) {
        for (const restCombo of restCombinations) {
          combinations.push([`${first.name}: ${value}`, ...restCombo]);
        }
      }
      return combinations;
    };

    const combinations = generateCombinations(validAttributes);
    const existingVariations = form.getValues("variations") || [];
    const basePrice = form.getValues("price") || "0";
    
    const newVariations = combinations.map(combo => {
      const attributeValuesStr = combo.join(" | ");
      const existing = existingVariations.find(v => v.attributeValues === attributeValuesStr);
      return {
        id: existing?.id,
        attributeValues: attributeValuesStr,
        sku: existing?.sku || "",
        price: existing?.price || basePrice,
        stock: existing?.stock ?? 0,
        weight: existing?.weight || "",
        image: existing?.image || "",
        isActive: existing?.isActive ?? true,
      };
    });

    replaceVariations(newVariations);
    toast({ 
      title: "Variations générées", 
      description: `${newVariations.length} variation(s) créée(s)` 
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const { variations, attributes, ...productData } = data;
      const payload = {
        ...productData,
        images: productData.images || [],
        categoryId: productData.categoryId || null,
      };

      let savedProduct;
      if (isEditing) {
        const response = await apiRequest("PATCH", `/api/products/${productId}`, payload);
        savedProduct = await response.json();
        
        if (data.productType === "variable") {
          await apiRequest("DELETE", `/api/products/${productId}/attributes`);
          await apiRequest("DELETE", `/api/products/${productId}/variations`);
          
          if (attributes && attributes.length > 0) {
            for (const attr of attributes) {
              await apiRequest("POST", `/api/products/${productId}/attributes`, {
                name: attr.name,
                values: attr.values,
              });
            }
          }
          
          if (variations && variations.length > 0) {
            for (const variation of variations) {
              await apiRequest("POST", `/api/products/${productId}/variations`, {
                attributeValues: variation.attributeValues,
                sku: variation.sku || null,
                price: variation.price,
                stock: variation.stock,
                weight: variation.weight || "0",
                image: variation.image || null,
                isActive: variation.isActive,
              });
            }
          }
        }
      } else {
        const response = await apiRequest("POST", "/api/products", payload);
        savedProduct = await response.json();
        
        if (data.productType === "variable") {
          if (attributes && attributes.length > 0) {
            for (const attr of attributes) {
              await apiRequest("POST", `/api/products/${savedProduct.id}/attributes`, {
                name: attr.name,
                values: attr.values,
              });
            }
          }
          
          if (variations && variations.length > 0) {
            for (const variation of variations) {
              await apiRequest("POST", `/api/products/${savedProduct.id}/variations`, {
                attributeValues: variation.attributeValues,
                sku: variation.sku || null,
                price: variation.price,
                stock: variation.stock,
                weight: variation.weight || "0",
                image: variation.image || null,
                isActive: variation.isActive,
              });
            }
          }
        }
      }
      
      return savedProduct;
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
                          <FormDescription>
                            {productType === "variable" && "Prix de base pour les variations"}
                          </FormDescription>
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

              {productType === "variable" && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Attributs
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Définissez les attributs comme Taille, Couleur, etc.
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nom de l'attribut (ex: Couleur, Taille)"
                          value={newAttributeName}
                          onChange={(e) => setNewAttributeName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttribute())}
                          data-testid="input-new-attribute-name"
                        />
                        <Button 
                          type="button" 
                          onClick={addAttribute}
                          data-testid="button-add-attribute"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                      </div>

                      {attributeFields.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                          Aucun attribut. Ajoutez des attributs comme "Couleur" ou "Taille".
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {attributeFields.map((field, attrIndex) => (
                            <div key={field.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">{field.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeAttribute(attrIndex)}
                                  data-testid={`button-remove-attribute-${attrIndex}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {(form.getValues(`attributes.${attrIndex}.values`) || []).map((value, valueIndex) => (
                                  <Badge key={valueIndex} variant="secondary" className="gap-1">
                                    {value}
                                    <button
                                      type="button"
                                      onClick={() => removeValueFromAttribute(attrIndex, valueIndex)}
                                      className="ml-1 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>

                              {editingAttributeIndex === attrIndex ? (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder={`Nouvelle valeur pour ${field.name}`}
                                    value={newAttributeValue}
                                    onChange={(e) => setNewAttributeValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addValueToAttribute(attrIndex);
                                      } else if (e.key === "Escape") {
                                        setEditingAttributeIndex(null);
                                        setNewAttributeValue("");
                                      }
                                    }}
                                    autoFocus
                                    data-testid={`input-attribute-value-${attrIndex}`}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addValueToAttribute(attrIndex)}
                                  >
                                    Ajouter
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingAttributeIndex(null);
                                      setNewAttributeValue("");
                                    }}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingAttributeIndex(attrIndex)}
                                  data-testid={`button-add-value-${attrIndex}`}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Ajouter une valeur
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {attributeFields.length > 0 && (
                        <Button
                          type="button"
                          onClick={generateVariations}
                          className="w-full"
                          data-testid="button-generate-variations"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Générer les variations
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Variations ({variationFields.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {variationFields.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                          Aucune variation. Ajoutez des attributs et cliquez sur "Générer les variations".
                        </div>
                      ) : (
                        variationFields.map((field, index) => (
                          <div key={field.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {field.attributeValues.split(" | ").map((attr, i) => (
                                  <Badge key={i} variant="outline">
                                    {attr}
                                  </Badge>
                                ))}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariation(index)}
                                data-testid={`button-remove-variation-${index}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <FormField
                                control={form.control}
                                name={`variations.${index}.sku`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">SKU</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="REF-001" 
                                        {...field} 
                                        data-testid={`input-variation-sku-${index}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`variations.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Prix (F CFA) *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field} 
                                        data-testid={`input-variation-price-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`variations.${index}.stock`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Stock</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        {...field} 
                                        data-testid={`input-variation-stock-${index}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`variations.${index}.weight`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Poids (kg)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.1" 
                                        placeholder="0" 
                                        {...field} 
                                        data-testid={`input-variation-weight-${index}`}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`variations.${index}.isActive`}
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                  <FormLabel className="text-sm">Actif</FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid={`switch-variation-active-${index}`}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de produit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-type">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="simple">Produit simple</SelectItem>
                            <SelectItem value="variable">Produit variable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value === "variable" 
                            ? "Définissez des attributs et générez des variations" 
                            : "Un seul prix et stock"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
