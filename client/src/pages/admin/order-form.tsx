import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Search, Plus, Minus, Trash2, Package, User as UserIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User as UserType, Address, ProductWithCategory } from "@shared/schema";
import { Link } from "wouter";

interface OrderItem {
  productId: string;
  productName: string;
  productPrice: string;
  quantity: number;
  weight: string;
}

export default function AdminOrderForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"mobile_money" | "cash_on_delivery">("cash_on_delivery");
  const [notes, setNotes] = useState("");
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: addresses } = useQuery<Address[]>({
    queryKey: ["/api/addresses", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const res = await fetch(`/api/addresses?userId=${selectedUser.id}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedUser,
  });

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!userSearch) return users;
    const search = userSearch.toLowerCase();
    return users.filter(u => 
      u.firstName?.toLowerCase().includes(search) ||
      u.lastName?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.phone?.includes(search)
    );
  }, [users, userSearch]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const activeProducts = products.filter(p => p.isActive);
    if (!productSearch) return activeProducts;
    const search = productSearch.toLowerCase();
    return activeProducts.filter(p => p.name.toLowerCase().includes(search));
  }, [products, productSearch]);

  const subtotal = orderItems.reduce((sum, item) => {
    return sum + parseFloat(item.productPrice) * item.quantity;
  }, 0);

  const totalWeight = orderItems.reduce((sum, item) => {
    return sum + parseFloat(item.weight) * item.quantity;
  }, 0);

  const { data: shippingFees } = useQuery({
    queryKey: ["/api/shipping/calculate", totalWeight, selectedAddress?.isAbidjan],
    queryFn: async () => {
      const res = await fetch(
        `/api/shipping/calculate?weight=${totalWeight}&isAbidjan=${selectedAddress?.isAbidjan ?? false}`,
        { credentials: "include" }
      );
      if (!res.ok) return { weightFee: 0, distanceFee: 0 };
      return res.json();
    },
    enabled: !!selectedAddress && orderItems.length > 0,
  });

  const shippingFee = (shippingFees?.weightFee || 0) + (shippingFees?.distanceFee || 0);
  const total = subtotal + shippingFee;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        userId: selectedUser!.id,
        addressId: selectedAddress!.id,
        subtotal: subtotal.toString(),
        shippingFee: shippingFee.toString(),
        total: total.toString(),
        paymentMethod,
        status: paymentMethod === "cash_on_delivery" ? "pending" : "pending_payment",
        notes,
        items: orderItems,
      };
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Commande créée",
        description: "La commande a été créée avec succès",
      });
      navigate("/admin/orders");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande",
        variant: "destructive",
      });
    },
  });

  const handleSelectUser = (user: UserType) => {
    setSelectedUser(user);
    setSelectedAddress(null);
    setUserSearchOpen(false);
  };

  const handleAddProduct = (product: ProductWithCategory) => {
    const existingIndex = orderItems.findIndex(item => item.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...orderItems];
      newItems[existingIndex].quantity += 1;
      setOrderItems(newItems);
    } else {
      setOrderItems([...orderItems, {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        weight: product.weight || "0",
      }]);
    }
    setProductSearchOpen(false);
    setProductSearch("");
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const newItems = [...orderItems];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    setOrderItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const canSubmit = selectedUser && selectedAddress && orderItems.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createOrderMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Nouvelle commande</h1>
          <p className="text-muted-foreground">
            Créer une commande manuellement
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        data-testid="button-select-user"
                      >
                        {selectedUser ? (
                          <span>
                            {selectedUser.firstName} {selectedUser.lastName} - {selectedUser.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            <Search className="h-4 w-4 mr-2 inline" />
                            Rechercher un client...
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Rechercher par nom, email ou téléphone..."
                          value={userSearch}
                          onValueChange={setUserSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Aucun client trouvé</CommandEmpty>
                          <CommandGroup>
                            {filteredUsers.slice(0, 10).map((user) => (
                              <CommandItem
                                key={user.id}
                                onSelect={() => handleSelectUser(user)}
                                className="cursor-pointer"
                              >
                                <div>
                                  <p className="font-medium">
                                    {user.firstName} {user.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.email} | {user.phone}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </CardContent>
            </Card>

            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addresses && addresses.length > 0 ? (
                    <Select
                      value={selectedAddress?.id || ""}
                      onValueChange={(id) => {
                        const addr = addresses.find(a => a.id === id);
                        setSelectedAddress(addr || null);
                      }}
                    >
                      <SelectTrigger data-testid="select-address">
                        <SelectValue placeholder="Sélectionner une adresse" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            <div>
                              <span className="font-medium">{addr.label}</span>
                              <span className="text-muted-foreground"> - {addr.city}</span>
                              {addr.isAbidjan && <Badge variant="secondary" className="ml-2">Abidjan</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Ce client n'a pas d'adresse enregistrée.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produits
                  </CardTitle>
                  <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button size="sm" data-testid="button-add-product">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="end">
                      <Command>
                        <CommandInput 
                          placeholder="Rechercher un produit..."
                          value={productSearch}
                          onValueChange={setProductSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Aucun produit trouvé</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[300px]">
                              {filteredProducts.slice(0, 20).map((product) => (
                                <CommandItem
                                  key={product.id}
                                  onSelect={() => handleAddProduct(product)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex justify-between w-full">
                                    <div>
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {product.weight}kg | Stock: {product.stock}
                                      </p>
                                    </div>
                                    <p className="font-medium">
                                      {parseFloat(product.price).toLocaleString("fr-FR")} F
                                    </p>
                                  </div>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun produit ajouté</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-md"
                        data-testid={`order-item-${index}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {parseFloat(item.productPrice).toLocaleString("fr-FR")} F x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(index, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleUpdateQuantity(index, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-medium min-w-[80px] text-right">
                          {(parseFloat(item.productPrice) * item.quantity).toLocaleString("fr-FR")} F
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Notes pour la commande (optionnel)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="input-notes"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Méthode de paiement</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as "mobile_money" | "cash_on_delivery")}
                  >
                    <SelectTrigger data-testid="select-payment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_on_delivery">Paiement à la livraison</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{subtotal.toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Poids total</span>
                  <span>{totalWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{shippingFee.toLocaleString("fr-FR")} F</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{total.toLocaleString("fr-FR")} F</span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || createOrderMutation.isPending}
                  data-testid="button-create-order"
                >
                  {createOrderMutation.isPending ? "Création..." : "Créer la commande"}
                </Button>

                {!canSubmit && (
                  <p className="text-sm text-muted-foreground text-center">
                    {!selectedUser && "Sélectionnez un client. "}
                    {selectedUser && !selectedAddress && "Sélectionnez une adresse. "}
                    {orderItems.length === 0 && "Ajoutez des produits."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
