import { auth } from "~/server/auth";
import { redirect, notFound } from "next/navigation";
import { getComplaintById } from "~/server/services/complaint.service";
import ComplaintStaffDetails from "./ComplaintStaffDetails";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffComplaintDetailsPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "STAFF") {
    redirect("/unauthorized");
  }

  const { id } = await params;

  try {
    const complaint = await getComplaintById(id, session.user.id!, "STAFF");

    if (!complaint) {
      notFound();
    }

    // Ensure staff member is assigned or in the same department (handled by service)
    return (
      <div className="container mx-auto px-4 py-8">
        <ComplaintStaffDetails complaint={complaint} />
      </div>
    );
  } catch (err) {
    console.error("Error loading complaint details:", err);
    notFound();
  }
}
