import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Guidance" };

export default function Page() {
  return <ComingSoon title="Guidance" day="on Day 3" />;
}
