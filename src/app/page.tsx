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
  Shield,
  Zap,
  ArrowRight,
  FileText,
  Bell,
  Activity,
  Truck,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header/Navigation - IMPROVED */}
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10">
              <Truck className="text-primary-foreground h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold sm:text-xl">JotaComplaint</h1>
              <p className="text-muted-foreground text-xs">
                Municipal Services
              </p>
            </div>
            <h1 className="text-lg font-bold sm:hidden">JotaComplaint</h1>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-3 sm:flex">
            <Button variant="ghost" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-4 sm:w-[320px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Navigate through JotaComplaint
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                {/* Navigation Links */}
                <nav className="flex flex-col gap-4">
                  <Link
                    href="#features"
                    className="group text-muted-foreground hover:bg-accent hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all"
                  >
                    <MapPin className="group-hover:text-primary h-4 w-4" />
                    Features
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="group text-muted-foreground hover:bg-accent hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all"
                  >
                    <Activity className="group-hover:text-primary h-4 w-4" />
                    How It Works
                  </Link>
                  <Link
                    href="#stats"
                    className="group text-muted-foreground hover:bg-accent hover:text-primary flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all"
                  >
                    <BarChart3 className="group-hover:text-primary h-4 w-4" />
                    Impact
                  </Link>
                </nav>

                {/* Auth Buttons */}
                <div className="border-t p-2.5 pt-4">
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="outline"
                      asChild
                      className="w-full justify-start gap-3"
                    >
                      <Link href="/signin">
                        <Users className="h-4 w-4" />
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild className="w-full justify-start gap-3">
                      <Link href="/signup">
                        <Zap className="h-4 w-4" />
                        Get Started
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero Section - IMPROVED */}
      <section className="container flex flex-col items-center gap-6 px-4 py-12 sm:gap-8 sm:px-6 sm:py-16 md:py-24 lg:py-32">
        <Badge variant="secondary" className="px-3 py-1.5 sm:px-4">
          <Zap className="mr-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="text-xs sm:text-sm">
            Smart Municipal Complaint Management
          </span>
        </Badge>

        <div className="flex max-w-4xl flex-col items-center gap-4 text-center sm:gap-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Report Issues. <span className="text-primary">Track Progress.</span>
            <br className="hidden sm:inline" />
            <span className="sm:block">Build Better Communities.</span>
          </h1>

          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg md:text-xl">
            A modern platform for citizens to report municipal issues and for
            administrators to efficiently manage and resolve complaints in
            real-time.
          </p>

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Button size="lg" asChild className="w-full gap-2 sm:w-auto">
              <Link href="/signup">
                Start Reporting Issues
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/signin">Admin Portal</Link>
            </Button>
          </div>
        </div>

        {/* Hero Stats - IMPROVED */}
        <div className="grid w-full max-w-4xl gap-3 pt-6 sm:grid-cols-3 sm:gap-4 sm:pt-8">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">
                Active Users
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl">2,847</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">
                Resolved Issues
              </CardDescription>
              <CardTitle className="text-2xl text-green-500 sm:text-3xl">
                1,249
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardDescription className="text-xs sm:text-sm">
                Avg. Response Time
              </CardDescription>
              <CardTitle className="text-2xl text-blue-500 sm:text-3xl">
                18h
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features Section - IMPROVED */}
      <section
        id="features"
        className="bg-muted/50 border-t py-12 sm:py-16 md:py-20"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
            <Badge variant="outline">Features</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
              Powerful tools for citizens and administrators to streamline
              complaint management
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:mt-16 lg:grid-cols-3">
            {/* Feature Cards */}
            <Card>
              <CardHeader className="space-y-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12">
                  <MapPin className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  Location Mapping
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Pin exact locations on interactive maps with GPS support for
                  accurate issue reporting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 sm:h-12 sm:w-12">
                  <Bell className="h-5 w-5 text-green-500 sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  Real-time Notifications
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Get instant updates on complaint status changes, assignments,
                  and resolutions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 sm:h-12 sm:w-12">
                  <Activity className="h-5 w-5 text-blue-500 sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  Activity Tracking
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Complete audit trail of all actions with timestamps and user
                  accountability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 sm:h-12 sm:w-12">
                  <FileText className="h-5 w-5 text-amber-500 sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  Photo Documentation
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Upload images to provide visual evidence and help staff better
                  understand issues
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 sm:h-12 sm:w-12">
                  <Users className="h-5 w-5 text-purple-500 sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  Department Management
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Automatically route complaints to appropriate departments
                  based on category and priority
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 sm:h-12 sm:w-12">
                  <BarChart3 className="h-5 w-5 text-red-500 sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  Analytics Dashboard
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Comprehensive insights and reports to track performance and
                  identify trends
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section - IMPROVED */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
            <Badge variant="outline">Process</Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
              Simple steps to report and resolve municipal issues
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:mt-12 md:grid-cols-3 lg:mt-16">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold sm:h-16 sm:w-16 sm:text-2xl">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold sm:text-xl">
                Report Issue
              </h3>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Citizens submit complaints with photos, location, and detailed
                descriptions of the problem
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold sm:h-16 sm:w-16 sm:text-2xl">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold sm:text-xl">
                Auto Assignment
              </h3>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                System routes complaints to the right department and assigns
                priority based on severity
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold sm:h-16 sm:w-16 sm:text-2xl">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold sm:text-xl">
                Track & Resolve
              </h3>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Staff work on issues while citizens receive real-time updates
                until resolution
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section - IMPROVED */}
      <section className="bg-muted/50 border-t py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              Built for Everyone
            </h2>
            <p className="text-muted-foreground max-w-2xl text-base sm:text-lg">
              Different tools for different roles
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:mt-12 md:grid-cols-3 lg:mt-16 lg:gap-8">
            {/* Citizens */}
            <Card className="border-2">
              <CardHeader className="space-y-3 sm:space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 sm:h-14 sm:w-14">
                  <Users className="h-6 w-6 text-blue-500 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  For Citizens
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Report issues, track progress, and get notified about
                  resolutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Submit complaints with photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Track status in real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Comment and provide updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
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
              <CardHeader className="space-y-3 sm:space-y-4">
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg sm:h-14 sm:w-14">
                  <Shield className="text-primary h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="text-lg sm:text-xl">For Staff</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Manage assigned tasks, update progress, and resolve issues
                  efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>View assigned complaints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Update complaint status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Add internal notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
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
              <CardHeader className="space-y-3 sm:space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 sm:h-14 sm:w-14">
                  <BarChart3 className="h-6 w-6 text-purple-500 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="text-lg sm:text-xl">
                  For Administrators
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Full control over system, analytics, and team management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Comprehensive dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>Assign and reassign tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>View analytics and reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
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

      {/* CTA Section - IMPROVED */}
      <section className="border-t py-12 sm:py-16 md:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="border-primary border-2">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:gap-6 sm:p-12">
              <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-full sm:h-16 sm:w-16">
                <Zap className="text-primary-foreground h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                  Ready to Get Started?
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Join thousands of citizens making their communities better
                </p>
              </div>
              <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/signup">Create Account</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <Link href="/signin">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer - IMPROVED */}
      <footer className="border-t py-8 sm:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-4">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                  <AlertCircle className="text-primary-foreground h-5 w-5" />
                </div>
                <span className="font-bold">JotaComplaint</span>
              </div>
              <p className="text-muted-foreground mt-3 text-sm sm:mt-4">
                Making municipal services more accessible and efficient for
                everyone.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Product</h3>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm sm:mt-4">
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
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm sm:mt-4">
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
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm sm:mt-4">
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

          <div className="text-muted-foreground mt-8 border-t pt-6 text-center text-sm sm:mt-12 sm:pt-8">
            <p>© 2026 JotaComplaint. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
