import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CS Placement Platform",
    template: "%s | CS Placement Platform",
  },
  description:
    "CS Fundamentals Placement-Readiness Platform for B.Tech students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
