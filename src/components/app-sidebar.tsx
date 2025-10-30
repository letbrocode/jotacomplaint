import {
  Calendar,
  Home,
  Inbox,
  LogOut,
  Pencil,
  Search,
  Settings,
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
} from "~/components/ui/sidebar";
import Signout from "./signout";
import { UserAvatar } from "./useravatar";
import { auth } from "~/server/auth";

// Menu items.
const items = [
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
    title: "Register",
    url: "/dashboard/register",
    icon: Pencil,
  },
  {
    title: "Inbox",
    url: "/dashboard/inbox",
    icon: Inbox,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export async function AppSidebar() {
  const serverSession = await auth();
  const user = serverSession?.user;
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Complaint Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
          </div>
          <Signout />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
