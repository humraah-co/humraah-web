import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Explore fields of study" };

export default function Page() {
  return <ComingSoon title="Explore fields of study" day="on Day 2" />;
}
