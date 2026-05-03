import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getUserById } from "~/server/services/user.service";
import { SettingsForm } from "../../dashboard/settings/SettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const user = await getUserById(session.user.id!);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">
          Manage your administrative profile and preferences.
        </p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
