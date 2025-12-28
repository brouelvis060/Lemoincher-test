import { useState, useEffect } from "react";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, Eye, MoreHorizontal, Trash2, Plus, X, Package, MapPin, CreditCard, User, RotateCcw, ChevronLeft, ChevronRight, Clock, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const ORDERS_PER_PAGE = 10;

function PaymentCountdownCard({ 
  order, 
  onCancelAndKeep, 
  onCancelOrder, 
  isPending 
}: { 
  order: OrderWithDetails;
  onCancelAndKeep: () => void;
  onCancelOrder: () => void;
  isPending: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    if (!order.paymentExpiresAt) return;
    
    const calculateTimeLeft = () => {
      const expiresAt = new Date(String(order.paymentExpiresAt)).getTime();
      const now = Date.now();
      return Math.max(0, Math.floor((expiresAt - now) / 1000));
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [order.paymentExpiresAt]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0;
  
  return (
    <Card className={isExpired ? "border-destructive bg-destructive/10" : "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className={`h-5 w-5 ${isExpired ? "text-destructive" : "text-orange-600 dark:text-orange-400"}`} />
          <h3 className="font-medium">Décompte de paiement CinetPay</h3>
        </div>
        
        {isExpired ? (
          <p className="text-sm text-destructive mb-4">
            Le délai de paiement a expiré. La commande sera automatiquement annulée.
          </p>
        ) : (
          <div className="mb-4">
            <p className={`text-2xl font-bold ${isExpired ? "text-destructive" : "text-orange-600 dark:text-orange-400"}`}>
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </p>
            <p className="text-sm text-muted-foreground">
              Temps restant pour le paiement
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelAndKeep}
            disabled={isPending}
            data-testid="button-cancel-countdown-keep"
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Arrêter le décompte
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onCancelOrder}
            disabled={isPending}
            data-testid="button-cancel-countdown-order"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler la commande
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [bulkPermanentDeleteDialogOpen, setBulkPermanentDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderWithDetails | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const { data: paginatedData, isLoading, isFetching } = useQuery<{ orders: OrderWithDetails[]; total: number }>({
    queryKey: ["/api/orders/paginated", currentPage, ORDERS_PER_PAGE, searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ORDERS_PER_PAGE.toString(),
        search: searchQuery,
        status: statusFilter,
      });
      const response = await fetch(`/api/orders/paginated?${params}`);
      return response.json();
    },
    placeholderData: keepPreviousData,
  });

  const { data: trashedOrders, isLoading: isLoadingTrash } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders/trash"],
  });

  const orders = paginatedData?.orders || [];
  const totalOrders = paginatedData?.total || 0;
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/paginated"] });
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

  const cancelCountdownMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { 
        paymentExpiresAt: null,
        status: "cancelled" 
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/paginated"] });
      setDetailOrder(data);
      toast({
        title: "Décompte annulé",
        description: "Le décompte de paiement a été annulé et la commande a été annulée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le décompte",
        variant: "destructive",
      });
    },
  });

  const keepOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}`, { 
        paymentExpiresAt: null 
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/paginated"] });
      setDetailOrder(data);
      toast({
        title: "Décompte annulé",
        description: "Le décompte a été annulé. La commande reste en attente de paiement.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le décompte",
        variant: "destructive",
      });
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/trash"] });
      toast({
        title: "Commande déplacée vers la corbeille",
        description: "La commande a été déplacée vers la corbeille",
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

  const bulkSoftDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest("POST", "/api/orders/bulk-delete", { ids });
      return response.json();
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/trash"] });
      toast({
        title: "Commandes déplacées vers la corbeille",
        description: `${ids.length} commande(s) déplacée(s) vers la corbeille`,
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

  const restoreOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/restore`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/trash"] });
      toast({
        title: "Commande restaurée",
        description: "La commande a été restaurée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer la commande",
        variant: "destructive",
      });
    },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest("POST", "/api/orders/bulk-restore", { ids });
      return response.json();
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/trash"] });
      toast({
        title: "Commandes restaurées",
        description: `${ids.length} commande(s) restaurée(s)`,
      });
      setSelectedOrders([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer les commandes",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}/permanent`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/trash"] });
      toast({
        title: "Commande supprimée définitivement",
        description: "La commande a été supprimée de façon permanente",
      });
      setPermanentDeleteDialogOpen(false);
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

  const bulkPermanentDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await apiRequest("POST", "/api/orders/bulk-permanent-delete", { ids });
      return response.json();
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/trash"] });
      toast({
        title: "Commandes supprimées définitivement",
        description: `${ids.length} commande(s) supprimée(s) de façon permanente`,
      });
      setSelectedOrders([]);
      setBulkPermanentDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les commandes",
        variant: "destructive",
      });
    },
  });

  const filteredTrashedOrders = trashedOrders?.filter((order) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.user?.firstName?.toLowerCase().includes(searchLower) ||
      order.user?.lastName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const currentOrders = activeTab === "orders" ? orders : filteredTrashedOrders;
  const allSelected = currentOrders.length > 0 && selectedOrders.length === currentOrders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < currentOrders.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentOrders.map(o => o.id));
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

  const handlePermanentDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setPermanentDeleteDialogOpen(true);
  };

  const confirmSoftDelete = () => {
    if (orderToDelete) {
      softDeleteMutation.mutate(orderToDelete);
    }
  };

  const confirmBulkSoftDelete = () => {
    if (selectedOrders.length > 0) {
      bulkSoftDeleteMutation.mutate(selectedOrders);
    }
  };

  const confirmPermanentDelete = () => {
    if (orderToDelete) {
      permanentDeleteMutation.mutate(orderToDelete);
    }
  };

  const confirmBulkPermanentDelete = () => {
    if (selectedOrders.length > 0) {
      bulkPermanentDeleteMutation.mutate(selectedOrders);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedOrders([]);
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="orders" data-testid="tab-orders">
            Commandes ({totalOrders})
          </TabsTrigger>
          <TabsTrigger value="trash" data-testid="tab-trash">
            <Trash2 className="h-4 w-4 mr-2" />
            Corbeille ({trashedOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        {selectedOrders.length > 0 && (
          <Card className="bg-muted/50 mt-4">
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">
                  {selectedOrders.length} commande{selectedOrders.length > 1 ? "s" : ""} sélectionnée{selectedOrders.length > 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrders([])}
                    data-testid="button-clear-selection"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  {activeTab === "orders" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                      data-testid="button-bulk-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer ({selectedOrders.length})
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkRestoreMutation.mutate(selectedOrders)}
                        disabled={bulkRestoreMutation.isPending}
                        data-testid="button-bulk-restore"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurer ({selectedOrders.length})
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkPermanentDeleteDialogOpen(true)}
                        data-testid="button-bulk-permanent-delete"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer définitivement ({selectedOrders.length})
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>{totalOrders} commande{totalOrders > 1 ? "s" : ""}</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
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
              ) : orders.length > 0 ? (
                <>
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
                        {orders.map((order) => {
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
                                <div className="flex items-center gap-2">
                                  <OrderStatusBadge status={order.status} />
                                  {order.status === "pending_payment" && order.paymentExpiresAt && new Date(String(order.paymentExpiresAt)) > new Date() && (
                                    <Clock className="h-4 w-4 text-orange-500 animate-pulse" />
                                  )}
                                </div>
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
                                      Mettre à la corbeille
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

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages} ({totalOrders} commandes)
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          data-testid="button-prev-page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          data-testid="button-next-page"
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Aucune commande trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trash" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Corbeille ({filteredTrashedOrders.length})
                  </div>
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-trash"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTrash ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredTrashedOrders.length > 0 ? (
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
                            data-testid="checkbox-select-all-trash"
                          />
                        </TableHead>
                        <TableHead>Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Supprimée le</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrashedOrders.map((order) => {
                        const deletedAt = order.deletedAt ? new Date(order.deletedAt) : null;
                        const isSelected = selectedOrders.includes(order.id);
                        return (
                          <TableRow 
                            key={order.id} 
                            data-testid={`row-trash-order-${order.id}`}
                            className={isSelected ? "bg-muted/50" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectOrder(order.id)}
                                data-testid={`checkbox-trash-order-${order.id}`}
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
                              </div>
                            </TableCell>
                            <TableCell>
                              {deletedAt && (
                                <div>
                                  <p>{deletedAt.toLocaleDateString("fr-FR")}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {deletedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {parseFloat(order.total).toLocaleString("fr-FR")} F
                            </TableCell>
                            <TableCell>
                              <OrderStatusBadge status={order.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreOrderMutation.mutate(order.id)}
                                  disabled={restoreOrderMutation.isPending}
                                  data-testid={`button-restore-${order.id}`}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restaurer
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handlePermanentDeleteClick(order.id)}
                                  data-testid={`button-permanent-delete-${order.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">La corbeille est vide</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à la corbeille</DialogTitle>
            <DialogDescription>
              Cette commande sera déplacée vers la corbeille. Vous pourrez la restaurer ou la supprimer définitivement plus tard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmSoftDelete}
              disabled={softDeleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {softDeleteMutation.isPending ? "Suppression..." : "Mettre à la corbeille"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre {selectedOrders.length} commande{selectedOrders.length > 1 ? "s" : ""} à la corbeille</DialogTitle>
            <DialogDescription>
              Ces commandes seront déplacées vers la corbeille. Vous pourrez les restaurer ou les supprimer définitivement plus tard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkSoftDelete}
              disabled={bulkSoftDeleteMutation.isPending}
              data-testid="button-confirm-bulk-delete"
            >
              {bulkSoftDeleteMutation.isPending ? "Suppression..." : `Mettre à la corbeille (${selectedOrders.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La commande et toutes les données associées seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermanentDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmPermanentDelete}
              disabled={permanentDeleteMutation.isPending}
              data-testid="button-confirm-permanent-delete"
            >
              {permanentDeleteMutation.isPending ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkPermanentDeleteDialogOpen} onOpenChange={setBulkPermanentDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement {selectedOrders.length} commande{selectedOrders.length > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les commandes et toutes les données associées seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPermanentDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBulkPermanentDelete}
              disabled={bulkPermanentDeleteMutation.isPending}
              data-testid="button-confirm-bulk-permanent-delete"
            >
              {bulkPermanentDeleteMutation.isPending ? "Suppression..." : `Supprimer définitivement (${selectedOrders.length})`}
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

                {detailOrder.status === "pending_payment" && detailOrder.paymentExpiresAt && (
                  <PaymentCountdownCard 
                    order={detailOrder}
                    onCancelAndKeep={() => keepOrderMutation.mutate(detailOrder.id)}
                    onCancelOrder={() => cancelCountdownMutation.mutate(detailOrder.id)}
                    isPending={keepOrderMutation.isPending || cancelCountdownMutation.isPending}
                  />
                )}

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
                      <span>{parseFloat(detailOrder.shippingFee || "0").toLocaleString("fr-FR")} F</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{parseFloat(detailOrder.total).toLocaleString("fr-FR")} F</span>
                    </div>
                  </div>
                </div>

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
