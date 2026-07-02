import { auth } from "~/server/auth";
import { redirect, notFound } from "next/navigation";
import { getComplaintById } from "~/server/services/complaint.service";
import { getStaffMembers } from "~/server/services/user.service";
import ComplaintAdminDetails from "./ComplaintAdminDetails";
import { createComplaintReadUrl } from "~/server/storage/s3.service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminComplaintDetailsPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const { id } = await params;

  try {
    const [complaintResult, staffResult] = await Promise.allSettled([
      getComplaintById(id, session.user.id, "ADMIN"),
      getStaffMembers(),
    ]);

    if (complaintResult.status === "rejected") throw complaintResult.reason;
    if (staffResult.status === "rejected") throw staffResult.reason;

    const complaint = complaintResult.value;
    const staffList = staffResult.value;

    if (!complaint) {
      notFound();
    }

    const photoUrl = await createComplaintReadUrl(complaint.photoKey).catch(
      () => null,
    );

    return (
      <div className="container mx-auto px-4 py-8">
        <ComplaintAdminDetails
          complaint={complaint}
          photoUrl={photoUrl}
          staffList={staffList}
        />
      </div>
    );
  } catch (err) {
    console.error("Error loading complaint details:", err);
    notFound();
  }
}
