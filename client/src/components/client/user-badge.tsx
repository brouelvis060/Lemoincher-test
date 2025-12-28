import { Badge } from "@/components/ui/badge";
import { Star, Bird } from "lucide-react";
import type { User } from "@shared/schema";

interface UserBadgeProps {
  user: User;
}

export function UserBadge({ user }: UserBadgeProps) {
  if (user.isBirdClient) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Bird className="h-3 w-3" />
        Client Oiseau
      </Badge>
    );
  }

  if (user.isFaithfulClient) {
    return (
      <Badge variant="default" className="gap-1 bg-amber-500">
        <Star className="h-3 w-3" />
        Client Fidèle
      </Badge>
    );
  }

  return null;
}
