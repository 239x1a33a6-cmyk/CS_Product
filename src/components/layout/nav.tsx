"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

const studentNav: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/competencies", label: "Competencies" },
  { href: "/assessments", label: "Assessments" },
  { href: "/interviews", label: "Interviews" },
  { href: "/progress", label: "My Progress" },
];

const mentorNav: NavItem[] = [
  { href: "/mentor/cohort", label: "Cohort" },
  { href: "/mentor/review", label: "Review Queue" },
  { href: "/mentor/interventions", label: "Interventions" },
];

const adminNav: NavItem[] = [
  ...mentorNav,
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/competencies", label: "Competencies" },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/scripts", label: "Scripts" },
];

export function AppNav({
  role,
  userName,
}: {
  role: string;
  userName: string;
}) {
  const pathname = usePathname();
  const navItems =
    role === "ADMIN" ? adminNav : role === "MENTOR" ? mentorNav : studentNav;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-foreground">
              CS Platform
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
