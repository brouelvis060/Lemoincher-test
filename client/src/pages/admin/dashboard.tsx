import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ShoppingCart, Package, Users, DollarSign, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/admin/stats-card";
import { OrderStatusBadge } from "@/components/client/order-status-badge";
import type { OrderWithDetails } from "@shared/schema";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const latestOrders = recentOrders?.slice(0, 5) || [];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre boutique
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Total des ventes"
              value={`${(stats?.totalRevenue || 0).toLocaleString("fr-FR")} F`}
              icon={DollarSign}
              description="Revenus totaux"
            />
            <StatsCard
              title="Commandes"
              value={stats?.totalOrders || 0}
              icon={ShoppingCart}
              description={`${stats?.pendingOrders || 0} en attente`}
            />
            <StatsCard
              title="Produits"
              value={stats?.totalProducts || 0}
              icon={Package}
              description="Produits actifs"
            />
            <StatsCard
              title="Clients"
              value={stats?.totalUsers || 0}
              icon={Users}
              description="Utilisateurs inscrits"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Commandes récentes
            </CardTitle>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : latestOrders.length > 0 ? (
              <div className="space-y-4">
                {latestOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <OrderStatusBadge status={order.status} />
                        <p className="text-sm text-muted-foreground mt-1">
                          {parseFloat(order.total).toLocaleString("fr-FR")} F
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucune commande récente
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/products/new">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Gérer les catégories
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Voir toutes les commandes
              </Button>
            </Link>
            <Link href="/admin/settings/site">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Paramètres du site
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
