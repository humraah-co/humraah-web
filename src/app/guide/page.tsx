import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Higher Education Guide" };

export default function Page() {
  return <ComingSoon title="Higher Education Guide" day="on Day 3" />;
}
