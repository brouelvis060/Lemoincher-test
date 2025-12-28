import { Badge } from "@/components/ui/badge";
import { Package, Truck, Building, CheckCircle, XCircle, Clock } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "shipped" | "at_station" | "delivered" | "cancelled";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Package }> = {
  pending: { label: "En attente", variant: "secondary", icon: Clock },
  confirmed: { label: "Confirmée", variant: "default", icon: CheckCircle },
  shipped: { label: "Expédiée", variant: "default", icon: Truck },
  at_station: { label: "À la gare", variant: "default", icon: Building },
  delivered: { label: "Livrée", variant: "outline", icon: CheckCircle },
  cancelled: { label: "Annulée", variant: "destructive", icon: XCircle },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
