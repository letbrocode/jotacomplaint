import { auth } from "~/server/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import NavigationView from "./NavigationView";

export default async function NavigatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/signin");
  }

  const complaint = await db.complaint.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      location: true,
      latitude: true,
      longitude: true,
      assignedToId: true,
    },
  });

  if (!complaint) {
    notFound();
  }

  if (complaint.assignedToId !== session.user.id) {
    redirect("/staff/complaints");
  }

  if (!complaint.latitude || !complaint.longitude) {
    redirect(`/staff/complaints/${complaint.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/staff/complaints/${complaint.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Navigation</h2>
          <p className="text-muted-foreground">{complaint.title}</p>
        </div>
      </div>

      <NavigationView
        destinationLat={complaint.latitude}
        destinationLng={complaint.longitude}
        destinationTitle={complaint.title}
        destinationAddress={complaint.location ?? undefined}
      />
    </div>
  );
}
