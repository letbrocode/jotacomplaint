"use client";

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type User = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phoneNumber: string | null;
  address: string | null;
  isActive: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  _count: {
    complaints: number;
  };
};

type UserCardProps = {
  user: User;
  onToggleStatus: (user: User) => void;
  onDelete: (id: string) => void;
};

export default function UserCard({
  user,
  onToggleStatus,
  onDelete,
}: UserCardProps) {
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0]?.toUpperCase();

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{user.name ?? "No Name"}</h3>
            <div className="flex items-center gap-2">
              <Badge
                variant={user.isActive ? "default" : "secondary"}
                className={user.isActive ? "bg-green-500" : "bg-gray-400"}
              >
                {user.isActive ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </>
                ) : (
                  <>
                    <Ban className="mr-1 h-3 w-3" />
                    Inactive
                  </>
                )}
              </Badge>
              {user.emailVerified && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleStatus(user)}>
              {user.isActive ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(user.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="text-muted-foreground flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            <span className="truncate">{user.email}</span>
          </div>

          {user.phoneNumber && (
            <div className="text-muted-foreground flex items-center">
              <Phone className="mr-2 h-4 w-4" />
              <span>{user.phoneNumber}</span>
            </div>
          )}

          {user.address && (
            <div className="text-muted-foreground flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span className="truncate">{user.address}</span>
            </div>
          )}

          <div className="text-muted-foreground flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              Joined {formatDistanceToNow(new Date(user.createdAt))} ago
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">
              {user._count.complaints} Complaint
              {user._count.complaints !== 1 ? "s" : ""}
            </span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`/admin/complaints?userId=${user.id}`}>View All</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
