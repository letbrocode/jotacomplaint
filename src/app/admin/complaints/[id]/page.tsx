import { auth } from "~/server/auth";
import { redirect, notFound } from "next/navigation";
import { getComplaintById } from "~/server/services/complaint.service";
import { getStaffMembers } from "~/server/services/user.service";
import ComplaintAdminDetails from "./ComplaintAdminDetails";

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
    const [complaint, staffList] = await Promise.all([
      getComplaintById(id, session.user.id!, "ADMIN"),
      getStaffMembers(),
    ]);

    if (!complaint) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <ComplaintAdminDetails complaint={complaint} staffList={staffList} />
      </div>
    );
  } catch (err) {
    console.error("Error loading complaint details:", err);
    notFound();
  }
}
