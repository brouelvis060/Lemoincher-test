import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { User, MapPin, Settings, Plus, Trash2, Edit, Star, Bird } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClientHeader } from "@/components/client/header";
import { ClientFooter } from "@/components/client/footer";
import { UserBadge } from "@/components/client/user-badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Address } from "@shared/schema";

const profileSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().min(10, "Téléphone invalide"),
  whatsapp: z.string().optional(),
});

const addressSchema = z.object({
  label: z.string().min(1, "Libellé requis"),
  fullAddress: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  zone: z.string().optional(),
  isAbidjan: z.boolean(),
  isDefault: z.boolean(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const { data: addresses, isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ["/api/addresses", { userId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/addresses?userId=${user?.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch addresses");
      return res.json();
    },
    enabled: !!user,
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      whatsapp: user?.whatsapp || "",
    },
  });

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "",
      fullAddress: "",
      city: "",
      zone: "",
      isAbidjan: false,
      isDefault: false,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const isFirstAddress = !addresses || addresses.length === 0;
      const response = await apiRequest("POST", "/api/addresses", {
        ...data,
        userId: user?.id,
        isDefault: isFirstAddress || data.isDefault,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses", { userId: user?.id }] });
      setShowAddressDialog(false);
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

  const updateAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData & { id: string }) => {
      const { id, ...addressData } = data;
      const response = await apiRequest("PATCH", `/api/addresses/${id}`, addressData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses", { userId: user?.id }] });
      setShowAddressDialog(false);
      setEditingAddress(null);
      addressForm.reset();
      toast({
        title: "Adresse modifiée",
        description: "Votre adresse a été mise à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'adresse",
        variant: "destructive",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      await apiRequest("DELETE", `/api/addresses/${addressId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses", { userId: user?.id }] });
      toast({
        title: "Adresse supprimée",
        description: "L'adresse a été supprimée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'adresse",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    addressForm.reset({
      label: address.label,
      fullAddress: address.fullAddress,
      city: address.city,
      zone: address.zone || "",
      isAbidjan: address.isAbidjan || false,
      isDefault: address.isDefault || false,
    });
    setShowAddressDialog(true);
  };

  const openAddDialog = () => {
    setEditingAddress(null);
    addressForm.reset({
      label: "",
      fullAddress: "",
      city: "",
      zone: "",
      isAbidjan: false,
      isDefault: false,
    });
    setShowAddressDialog(true);
  };

  const handleAddressSubmit = (data: AddressFormData) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ ...data, id: editingAddress.id });
    } else {
      createAddressMutation.mutate(data);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <ClientHeader />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto p-8 text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connectez-vous</h2>
            <p className="text-muted-foreground mb-6">
              Veuillez vous connecter pour accéder à votre profil
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
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Mon Profil</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles et vos adresses
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            <Card className="lg:col-span-1">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.profileImage || undefined} />
                    <AvatarFallback className="text-2xl">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <UserBadge user={user} />
                    {user.totalOrders && user.totalOrders > 0 && (
                      <Badge variant="outline">
                        {user.totalOrders} commande{user.totalOrders > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  {user.isBirdClient && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
                      <Bird className="h-4 w-4 inline mr-1" />
                      Paiement à la livraison désactivé
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-3">
              <Tabs defaultValue="profile">
                <TabsList className="mb-6">
                  <TabsTrigger value="profile">
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </TabsTrigger>
                  <TabsTrigger value="addresses">
                    <MapPin className="h-4 w-4 mr-2" />
                    Adresses
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                      <CardDescription>
                        Modifiez vos informations de contact
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Prénom</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-firstname" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nom</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-lastname" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Téléphone</FormLabel>
                                <FormControl>
                                  <Input type="tel" {...field} data-testid="input-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="whatsapp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>WhatsApp (optionnel)</FormLabel>
                                <FormControl>
                                  <Input type="tel" {...field} data-testid="input-whatsapp" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" disabled={updateProfileMutation.isPending}>
                            {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="addresses">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Mes adresses</CardTitle>
                        <CardDescription>
                          Gérez vos adresses de livraison
                        </CardDescription>
                      </div>
                      <Dialog open={showAddressDialog} onOpenChange={(open) => {
                        setShowAddressDialog(open);
                        if (!open) setEditingAddress(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={openAddDialog}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}</DialogTitle>
                            <DialogDescription>
                              {editingAddress ? "Modifiez les informations de cette adresse" : "Ajoutez une nouvelle adresse de livraison"}
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...addressForm}>
                            <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
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

                              <FormField
                                control={addressForm.control}
                                name="isDefault"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormLabel className="!mt-0">Définir comme adresse par défaut</FormLabel>
                                  </FormItem>
                                )}
                              />

                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowAddressDialog(false)}>
                                  Annuler
                                </Button>
                                <Button type="submit" disabled={createAddressMutation.isPending || updateAddressMutation.isPending}>
                                  {editingAddress 
                                    ? (updateAddressMutation.isPending ? "Modification..." : "Modifier")
                                    : (createAddressMutation.isPending ? "Ajout..." : "Ajouter")
                                  }
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      {addressesLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-20" />
                          <Skeleton className="h-20" />
                        </div>
                      ) : addresses && addresses.length > 0 ? (
                        <div className="space-y-4">
                          {addresses.map((address) => (
                            <div key={address.id} className="flex items-start justify-between p-4 rounded-lg border">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{address.label}</span>
                                  {address.isAbidjan && <Badge variant="secondary">Abidjan</Badge>}
                                  {address.isDefault && <Badge variant="outline">Par défaut</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {address.fullAddress}, {address.city}
                                  {address.zone && ` - ${address.zone}`}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(address)}
                                  data-testid={`button-edit-address-${address.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteAddressMutation.mutate(address.id)}
                                  disabled={deleteAddressMutation.isPending}
                                  data-testid={`button-delete-address-${address.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Aucune adresse enregistrée
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <ClientFooter />
    </div>
  );
}
