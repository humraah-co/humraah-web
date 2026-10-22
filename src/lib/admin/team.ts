import type { MemberStatus, TeamMember, TeamRole } from "@/lib/database.types";

/** Team rules shared by the Team page and its server actions. The database enforces the same rules. */

export const roleLabels: Record<TeamRole, string> = {
  researcher: "Researcher",
  admin: "Admin",
  owner: "Owner",
};

export const statusLabels: Record<MemberStatus, string> = {
  invited: "Invited",
  active: "Active",
  suspended: "Suspended",
};

type Who = Pick<TeamMember, "user_id" | "role">;

export const isAdminRole = (role: TeamRole) => role === "admin" || role === "owner";

/** Roles `caller` may give in an invite: researcher for admins, admin too for the owner. */
export function invitableRoles(caller: Who): TeamRole[] {
  if (caller.role === "owner") return ["researcher", "admin"];
  if (caller.role === "admin") return ["researcher"];
  return [];
}

/**
 * Whether `caller` may resend, revoke, suspend or reactivate `target`:
 * admins manage researchers, the owner manages admins too, nobody manages
 * themselves, and nobody manages the owner.
 */
export function canManage(caller: Who, target: Who) {
  if (!isAdminRole(caller.role) || caller.user_id === target.user_id) return false;
  if (target.role === "owner") return false;
  return target.role === "researcher" || caller.role === "owner";
}
