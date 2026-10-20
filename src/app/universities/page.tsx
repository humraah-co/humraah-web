import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Universities" };

export default function Page() {
  return <ComingSoon title="Universities" day="on Day 2" />;
}
