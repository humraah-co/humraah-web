import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "About and contact" };

export default function Page() {
  return <ComingSoon title="About and contact" day="on Day 3" />;
}
