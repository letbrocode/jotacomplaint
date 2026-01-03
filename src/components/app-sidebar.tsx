import {
  Calendar,
  Home,
  Inbox,
  LogOut,
  Pencil,
  Search,
  Settings,
  FileText,
  Users,
  BarChart3,
  Building2,
  MapPin,
  Bell,
  AlertCircle,
  Navigation,
  Truck,
} from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "~/components/ui/sidebar";
import Signout from "./signout";
import { UserAvatar } from "./useravatar";
import { auth } from "~/server/auth";
import { IoMdPeople } from "react-icons/io";

export async function AppSidebar() {
  const serverSession = await auth();
  const user = serverSession?.user;
  const userRole = user?.role;

  // Admin menu items
  const adminItems = [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home,
    },
    {
      title: "Complaints",
      url: "/admin/complaints",
      icon: FileText,
    },
    {
      title: "Map View",
      url: "/admin/map",
      icon: MapPin,
    },
    {
      title: "Departments",
      url: "/admin/departments",
      icon: Building2,
    },
    {
      title: "Staff",
      url: "/admin/staff",
      icon: IoMdPeople,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },

    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ];

  // Staff menu items
  const staffItems = [
    {
      title: "Dashboard",
      url: "/staff",
      icon: Home,
    },
    {
      title: "My Assignments",
      url: "/staff/complaints",
      icon: AlertCircle,
    },
    {
      title: "Map & Navigation",
      url: "/staff/map",
      icon: Navigation,
    },
    {
      title: "Notifications",
      url: "/staff/notifications",
      icon: Bell,
    },
  ];

  // User menu items (default)
  const userItems = [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "My Complaints",
      url: "/dashboard/complaints",
      icon: Calendar,
    },
    {
      title: "Register Complaint",
      url: "/dashboard/register",
      icon: Pencil,
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];

  // Select menu items based on role
  const menuItems =
    userRole === "ADMIN"
      ? adminItems
      : userRole === "STAFF"
        ? staffItems
        : userItems;

  // Label based on role
  const sidebarLabel =
    userRole === "ADMIN"
      ? "Admin Portal"
      : userRole === "STAFF"
        ? "Staff Portal"
        : "Complaint Dashboard";

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
            <Truck className="text-primary-foreground h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">JotaComplaint</span>
            <span className="text-muted-foreground text-xs">
              {sidebarLabel}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-3 p-3">
          <UserAvatar
            name={user?.name}
            email={user?.email}
            image={user?.image}
          />
          {/* User Info */}
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              {user?.email}
            </p>
            {userRole && (
              <p className="text-primary truncate text-xs font-semibold">
                {userRole}
              </p>
            )}
          </div>
          <Signout />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
