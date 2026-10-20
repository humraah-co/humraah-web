import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Where do I start?" };

export default function Page() {
  return <ComingSoon title="Where do I start?" day="on Day 3" />;
}
