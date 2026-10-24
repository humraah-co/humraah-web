import { AdminNav } from "@/components/admin/AdminNav";
import { requireActiveMember } from "@/lib/admin/session";

/**
 * The team workspace: sidebar plus page (Figma 13:1209, 36:4215). Desktop
 * first; on a phone the sidebar becomes a top bar with a menu. Each page
 * also calls requireActiveMember, because a layout isn't re-run on every
 * navigation.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { member } = await requireActiveMember();
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminNav me={{ name: member.full_name || member.email, userId: member.user_id, role: member.role }} />
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 pt-6 pb-10 sm:px-6 lg:gap-7 lg:px-10 lg:pt-8 lg:pb-12">
        {children}
      </div>
    </div>
  );
}
