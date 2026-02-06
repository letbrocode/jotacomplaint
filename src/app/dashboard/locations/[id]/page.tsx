import { auth } from "~/server/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PublicLocationNavigationView from "~/components/PublicLocationNavigationView";

export default async function PublicLocationNavigatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/signin");
  }

  const location = await db.publicLocation.findUnique({
    where: { id },
  });

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff/map">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{location.name}</h2>
          <p className="text-muted-foreground">
            {location.type.replace(/_/g, " ")} Navigation
          </p>
        </div>
      </div>

      <PublicLocationNavigationView
        destinationLat={location.latitude}
        destinationLng={location.longitude}
        destinationTitle={location.name}
        destinationType={location.type}
        destinationDescription={location.description ?? undefined}
      />
    </div>
  );
}
