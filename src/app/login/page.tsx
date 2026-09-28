import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth, googleEnabled } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="pt-12">
      <AuthForm mode="login" googleEnabled={googleEnabled} />
    </div>
  );
}
