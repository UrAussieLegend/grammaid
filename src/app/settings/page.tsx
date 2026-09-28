import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiEnabled } from "@/lib/analysis/engine";
import { normalizeOptions } from "@/lib/analysis/types";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const preference = await prisma.preference.findUnique({ where: { userId: session.user.id } });
  const defaults = normalizeOptions(preference ? JSON.parse(preference.defaults) : {});

  return (
    <div className="space-y-6 pt-4">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight">Preferences</h1>
        <p className="mt-1 text-sm muted">
          These defaults are pre-loaded into every new analysis. You can still override them per run.
        </p>
      </div>
      <SettingsForm defaults={defaults} aiEnabled={aiEnabled} />
    </div>
  );
}
