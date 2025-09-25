import Link from "next/link";
import { cn } from "~/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="bg-background flex w-64 flex-col border-r">
        <div className="p-4 text-lg font-bold">Complaint Dashboard</div>
        <nav className="flex-1 space-y-2 p-4">
          <Link
            href="/dashboard/complaints"
            className={cn("hover:bg-muted block rounded px-2 py-1")}
          >
            My Complaints
          </Link>
          <Link
            href="/dashboard/register"
            className={cn("hover:bg-muted block rounded px-2 py-1")}
          >
            Register Complaint
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
