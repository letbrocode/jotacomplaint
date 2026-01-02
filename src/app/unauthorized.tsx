import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <ShieldAlert className="text-destructive h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
