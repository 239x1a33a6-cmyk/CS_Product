import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "STUDENT") {
    redirect("/dashboard");
  }

  if (session.user.role === "MENTOR" || session.user.role === "ADMIN") {
    redirect("/mentor/cohort");
  }

  redirect("/login");
}
