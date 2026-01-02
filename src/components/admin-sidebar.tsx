import {
  Home,
  Users,
  Building2,
  Inbox,
  ClipboardList,
  Check,
  Pin,
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
import { title } from "process";

// Menu items for admin panel
const adminItems = [
  {
    title: "Home",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Complaints",
    url: "/admin/complaints",
    icon: ClipboardList,
  },
  {
    title: "Departments",
    url: "/admin/departments",
    icon: Building2,
  },
  {
    title: "Staff",
    url: "/admin/staff",
    icon: Users,
  },
  {
    title: "Inbox",
    url: "/admin/inbox",
    icon: Inbox,
  },
  {
    title: "Resolved",
    url: "/admin/resolved",
    icon: Check,
  },
  {
    title: "Maps",
    url: "/admin/map",
    icon: Pin,
  },
];

export async function AdminSidebar() {
  const serverSession = await auth();
  const user = serverSession?.user;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
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
    </Sidebar>
  );
}
