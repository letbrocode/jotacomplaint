import { AdminSidebar } from "~/components/admin-sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { ModeToggle } from "~/components/mode-toggle";
import { NotificationBadge } from "~/components/notification-badge";
import { UserNav } from "~/components/user-nav";
import { Separator } from "~/components/ui/separator";
import { SessionProvider } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AdminSidebar />
        <main className="flex h-screen w-full flex-col">
          {/* Top Header Bar */}
          <header className="bg-background sticky top-0 z-50 flex h-16 items-center gap-4 border-b px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />

            {/* Search or breadcrumb can go here */}
            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <NotificationBadge />
              <ModeToggle />
              <Separator orientation="vertical" className="h-6" />
              <UserNav />
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 md:p-8">{children}</div>
          </div>
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
}
