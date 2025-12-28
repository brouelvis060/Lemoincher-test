import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Eye, MoreHorizontal, Trash2, Plus, X, Package, MapPin, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderStatusBadge } from "@/components/client/order-status-badge";
import { UserBadge } from "@/components/client/user-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OrderWithDetails } from "@shared/schema";

const orderStatuses = [
  { value: "pending_payment", label: "En attente de paiement" },
  { value: "pending", label: "Commande reçue" },
  { value: "confirmed", label: "Confirmée" },
  { value: "shipped", label: "Expédiée" },
  { value: "at_station", label: "À la gare" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

export default function AdminOrders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderWithDetails | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été modifié",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Commande supprimée",
        description: "La commande a été supprimée avec succès",
      });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la commande",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest("POST", "/api/orders/bulk-delete", { ids });
      return response.json();
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Commandes supprimées",
        description: `${ids.length} commande(s) supprimée(s) avec succès`,
      });
      setSelectedOrders([]);
      setBulkDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les commandes",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const allSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleViewDetails = (order: OrderWithDetails) => {
    setDetailOrder(order);
    setDetailSheetOpen(true);
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete);
    }
  };

  const confirmBulkDelete = () => {
    if (selectedOrders.length > 0) {
      bulkDeleteMutation.mutate(selectedOrders);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez et suivez toutes les commandes
          </p>
        </div>
        <Link href="/admin/orders/new">
          <Button data-testid="button-new-order">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle commande
          </Button>
        </Link>
      </div>

      {selectedOrders.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">
                {selectedOrders.length} commande{selectedOrders.length > 1 ? "s" : ""} sélectionnée{selectedOrders.length > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrders([])}
                  data-testid="button-clear-selection"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  data-testid="button-bulk-delete"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedOrders.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>{filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el) (el as any).indeterminate = someSelected;
                        }}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const createdAt = new Date(order.createdAt!);
                    const isSelected = selectedOrders.includes(order.id);
                    return (
                      <TableRow 
                        key={order.id} 
                        data-testid={`row-order-${order.id}`}
                        className={isSelected ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOrder(order.id)}
                            data-testid={`checkbox-order-${order.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.user?.firstName} {order.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.user?.email}
                            </p>
                            {order.user && <UserBadge user={order.user} />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{createdAt.toLocaleDateString("fr-FR")}</p>
                            <p className="text-sm text-muted-foreground">
                              {createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(order.total).toLocaleString("fr-FR")} F
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentMethod === "mobile_money" ? "default" : "secondary"}>
                            {order.paymentMethod === "mobile_money" ? "Mobile Money" : "À la livraison"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${order.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(order)}
                                data-testid={`button-view-${order.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {orderStatuses.map((status) => (
                                <DropdownMenuItem
                                  key={status.value}
                                  onClick={() => updateStatusMutation.mutate({
                                    orderId: order.id,
                                    status: status.value,
                                  })}
                                  disabled={order.status === status.value}
                                >
                                  {status.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(order.id)}
                                className="text-destructive focus:text-destructive"
                                data-testid={`button-delete-${order.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucune commande trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible et supprimera également tous les articles et paiements associés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteOrderMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteOrderMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer {selectedOrders.length} commande{selectedOrders.length > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ces commandes ? Cette action est irréversible et supprimera également tous les articles et paiements associés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleteMutation.isPending ? "Suppression..." : `Supprimer (${selectedOrders.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle>Détails de la commande</SheetTitle>
          </SheetHeader>
          {detailOrder && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">#{detailOrder.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(detailOrder.createdAt!).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <OrderStatusBadge status={detailOrder.status} />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Client</h3>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 space-y-1">
                    <p className="font-medium">
                      {detailOrder.user?.firstName} {detailOrder.user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{detailOrder.user?.email}</p>
                    <p className="text-sm text-muted-foreground">{detailOrder.user?.phone}</p>
                    {detailOrder.user && <UserBadge user={detailOrder.user} />}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Adresse de livraison</h3>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3">
                    {detailOrder.address ? (
                      <div className="space-y-1">
                        <p className="font-medium">{detailOrder.address.label}</p>
                        <p className="text-sm">{detailOrder.address.fullAddress}</p>
                        <p className="text-sm text-muted-foreground">
                          {detailOrder.address.city}
                          {detailOrder.address.isAbidjan && " (Abidjan)"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Adresse non disponible</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Articles ({detailOrder.items?.length || 0})</h3>
                  </div>
                  <div className="space-y-2">
                    {detailOrder.items?.map((item, index) => (
                      <div key={index} className="bg-muted/50 rounded-md p-3 flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantité: {item.quantity} | Poids: {item.weight}kg
                          </p>
                        </div>
                        <p className="font-medium">
                          {parseFloat(item.productPrice).toLocaleString("fr-FR")} F
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Paiement</h3>
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Méthode</span>
                      <Badge variant={detailOrder.paymentMethod === "mobile_money" ? "default" : "secondary"}>
                        {detailOrder.paymentMethod === "mobile_money" ? "Mobile Money" : "À la livraison"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span>{parseFloat(detailOrder.subtotal).toLocaleString("fr-FR")} F</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison</span>
                      <span>{parseFloat(detailOrder.shippingFee).toLocaleString("fr-FR")} F</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{parseFloat(detailOrder.total).toLocaleString("fr-FR")} F</span>
                    </div>
                  </div>
                </div>

                {detailOrder.notes && (
                  <div>
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="text-sm bg-muted/50 rounded-md p-3">{detailOrder.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setDetailSheetOpen(false)}
                  >
                    Fermer
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      handleDeleteClick(detailOrder.id);
                    }}
                    data-testid="button-delete-from-detail"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
