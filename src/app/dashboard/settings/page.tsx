import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { getUserById } from "~/server/services/user.service";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const user = await getUserById(session.user.id!);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
