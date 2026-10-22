import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Resources" };

export default function Page() {
  return <ComingSoon title="Resources" day="on Day 3" />;
}
