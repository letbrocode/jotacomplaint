import { auth } from "~/server/auth";
import { redirect, notFound } from "next/navigation";
import { getComplaintById } from "~/server/services/complaint.service";
import ComplaintUserDetails from "./ComplaintUserDetails";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserComplaintDetailsPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const { id } = await params;

  try {
    const complaint = await getComplaintById(id, session.user.id!, session.user.role);

    if (!complaint) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <ComplaintUserDetails complaint={complaint} />
      </div>
    );
  } catch (err) {
    console.error("Error loading complaint details:", err);
    notFound();
  }
}
