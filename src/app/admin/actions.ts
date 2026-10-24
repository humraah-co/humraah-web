"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin/paths";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

export async function signOut() {
  if (getSupabaseEnv()) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect(`${LOGIN_PATH}?notice=signed-out`);
}
