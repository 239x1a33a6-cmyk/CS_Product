import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AppNav } from "@/components/layout/nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/mentor/cohort");

  return (
    <div className="min-h-screen bg-background">
      <AppNav role={session.user.role} userName={session.user.name} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
