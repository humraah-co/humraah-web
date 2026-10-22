import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  ACCEPT_INVITE_PATH,
  ADMIN_HOME,
  FORGOT_PASSWORD_PATH,
  LOGIN_PATH,
  RESET_PASSWORD_PATH,
  safeNextPath,
} from "@/lib/admin/paths";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

const otpTypes: EmailOtpType[] = ["recovery", "invite", "email"];

/**
 * Where links in Supabase emails land. Password-reset emails come back with
 * ?code= (PKCE, started by the forgot-password form in this browser); an
 * email template using {{ .TokenHash }} comes back with ?token_hash=&type=.
 * Either way the session is stored in cookies and the person goes on to
 * `next`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const nextParam = params.get("next");
  // safeNextPath rejects the open pages, so the two that links lead to are named here.
  const next =
    nextParam === RESET_PASSWORD_PATH || nextParam === ACCEPT_INVITE_PATH
      ? nextParam
      : (safeNextPath(nextParam) ?? ADMIN_HOME);
  const failed =
    {
      [RESET_PASSWORD_PATH]: `${FORGOT_PASSWORD_PATH}?error=link`,
      [ACCEPT_INVITE_PATH]: `${ACCEPT_INVITE_PATH}?error=link`,
    }[next] ?? `${LOGIN_PATH}?error=link`;

  if (!getSupabaseEnv() || params.has("error")) redirect(failed);

  const supabase = await createSessionClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type && otpTypes.includes(type)) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }
  redirect(ok ? next : failed);
}
