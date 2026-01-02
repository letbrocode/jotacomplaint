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
  AlertCircle,
  CheckCircle2,
  MapPin,
  Users,
  BarChart3,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  FileText,
  Bell,
  Activity,
  Truck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header/Navigation */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <Truck className="text-primary-foreground h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">JotaComplaint</h1>
              <p className="text-muted-foreground text-xs">
                Municipal Services
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#stats"
              className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
            >
              Impact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-8 py-20 md:py-32">
        <Badge variant="secondary" className="px-4 py-1.5">
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          Smart Municipal Complaint Management
        </Badge>

        <div className="flex max-w-4xl flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Report Issues. <span className="text-primary">Track Progress.</span>
            <br />
            Build Better Communities.
          </h1>

          <p className="text-muted-foreground max-w-2xl text-lg sm:text-xl">
            A modern platform for citizens to report municipal issues and for
            administrators to efficiently manage and resolve complaints in
            real-time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild className="gap-2">
              <Link href="/signup">
                Start Reporting Issues
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signin">Admin Portal</Link>
            </Button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="grid w-full max-w-4xl gap-4 pt-8 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Users</CardDescription>
              <CardTitle className="text-3xl">2,847</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Resolved Issues</CardDescription>
              <CardTitle className="text-3xl text-green-500">1,249</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Avg. Response Time</CardDescription>
              <CardTitle className="text-3xl text-blue-500">18h</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 border-t py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Badge variant="outline">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Powerful tools for citizens and administrators to streamline
              complaint management
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card>
              <CardHeader>
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                  <MapPin className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="mt-4">Location Mapping</CardTitle>
                <CardDescription>
                  Pin exact locations on interactive maps with GPS support for
                  accurate issue reporting
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <Bell className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="mt-4">Real-time Notifications</CardTitle>
                <CardDescription>
                  Get instant updates on complaint status changes, assignments,
                  and resolutions
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="mt-4">Activity Tracking</CardTitle>
                <CardDescription>
                  Complete audit trail of all actions with timestamps and user
                  accountability
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <FileText className="h-6 w-6 text-amber-500" />
                </div>
                <CardTitle className="mt-4">Photo Documentation</CardTitle>
                <CardDescription>
                  Upload images to provide visual evidence and help staff better
                  understand issues
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <CardTitle className="mt-4">Department Management</CardTitle>
                <CardDescription>
                  Automatically route complaints to appropriate departments
                  based on category and priority
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                  <BarChart3 className="h-6 w-6 text-red-500" />
                </div>
                <CardTitle className="mt-4">Analytics Dashboard</CardTitle>
                <CardDescription>
                  Comprehensive insights and reports to track performance and
                  identify trends
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Badge variant="outline">Process</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Simple steps to report and resolve municipal issues
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                1
              </div>
              <h3 className="mt-4 text-xl font-semibold">Report Issue</h3>
              <p className="text-muted-foreground mt-2">
                Citizens submit complaints with photos, location, and detailed
                descriptions of the problem
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                2
              </div>
              <h3 className="mt-4 text-xl font-semibold">Auto Assignment</h3>
              <p className="text-muted-foreground mt-2">
                System routes complaints to the right department and assigns
                priority based on severity
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                3
              </div>
              <h3 className="mt-4 text-xl font-semibold">Track & Resolve</h3>
              <p className="text-muted-foreground mt-2">
                Staff work on issues while citizens receive real-time updates
                until resolution
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="bg-muted/50 border-t py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for Everyone
            </h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Different tools for different roles
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Citizens */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="mt-4">For Citizens</CardTitle>
                <CardDescription className="text-base">
                  Report issues, track progress, and get notified about
                  resolutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Submit complaints with photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Track status in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Comment and provide updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>View complaint history</span>
                  </li>
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/signup">Register Now</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Staff */}
            <Card className="border-primary border-2">
              <CardHeader>
                <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-lg">
                  <Shield className="text-primary h-8 w-8" />
                </div>
                <CardTitle className="mt-4">For Staff</CardTitle>
                <CardDescription className="text-base">
                  Manage assigned tasks, update progress, and resolve issues
                  efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>View assigned complaints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Update complaint status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Add internal notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Navigate to complaint locations</span>
                  </li>
                </ul>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/signin">Staff Login</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Admin */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-500/10">
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
                <CardTitle className="mt-4">For Administrators</CardTitle>
                <CardDescription className="text-base">
                  Full control over system, analytics, and team management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Comprehensive dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Assign and reassign tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>View analytics and reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                    <span>Manage departments and staff</span>
                  </li>
                </ul>
                <Button className="mt-6 w-full" variant="outline" asChild>
                  <Link href="/signin">Admin Login</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="border-primary border-2">
            <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
              <div className="bg-primary flex h-16 w-16 items-center justify-center rounded-full">
                <Zap className="text-primary-foreground h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to Get Started?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Join thousands of citizens making their communities better
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Create Account</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                  <AlertCircle className="text-primary-foreground h-5 w-5" />
                </div>
                <span className="font-bold">JotaComplaint</span>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                Making municipal services more accessible and efficient for
                everyone.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Product</h3>
              <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-primary">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-primary">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Support</h3>
              <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-primary">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Legal</h3>
              <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-primary">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-muted-foreground mt-12 border-t pt-8 text-center text-sm">
            <p>© 2026 JotaComplaint. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
