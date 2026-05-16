import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { getPublicStats, getTrendData, getDepartmentBreakdown } from "~/server/services/analytics.service";
import { getPublicComplaints } from "~/server/services/complaint.service";
import { formatDistanceToNow } from "date-fns";
import { PublicTrendChart, PublicDepartmentChart } from "~/components/public-charts";

export const metadata = {
  title: "Transparency Portal | JotaComplaint",
  description: "Public overview of municipal complaint resolution progress and community impact.",
};

export default async function TransparencyPage() {
  const [stats, trendData, deptData, recentComplaints] = await Promise.all([
    getPublicStats(),
    getTrendData(30),
    getDepartmentBreakdown(),
    getPublicComplaints(10),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-xl font-bold">Transparency Portal</h1>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </header>

      <main className="container mx-auto max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Community Impact</h2>
          <p className="text-muted-foreground text-lg">
            Real-time data on how we&apos;re working together to improve our city.
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Citizens</CardTitle>
              <CheckCircle2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Active reporters</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Total cases closed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
              <Clock className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.avgHours}h</div>
              <p className="text-muted-foreground text-xs">From report to fix</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Departments</CardTitle>
              <BarChart3 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deptData.length}</div>
              <p className="text-muted-foreground text-xs">Operational units</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Activity (Last 30 Days)</CardTitle>
              <CardDescription>Daily volume of reported vs resolved issues.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <PublicTrendChart data={trendData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issues by Department</CardTitle>
              <CardDescription>Current workload distribution across the city.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                 <PublicDepartmentChart data={deptData} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Successes */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Recent Successes</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentComplaints.map((complaint) => (
              <Card key={complaint.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={complaint.status === "RESOLVED" ? "default" : "secondary"}>
                      {complaint.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(complaint.createdAt))} ago
                    </span>
                  </div>
                  <CardTitle className="line-clamp-1 text-lg">{complaint.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {complaint.location ?? "Unknown Location"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    Department: <span className="text-foreground font-medium">{complaint.department?.name ?? "General"}</span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center pt-4">
             <Button variant="outline" asChild>
                <Link href="/signup">Sign up to help your community</Link>
             </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          © 2026 JotaComplaint Transparency Portal. All data is real-time.
        </div>
      </footer>
    </div>
  );
}
