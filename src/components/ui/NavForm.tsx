"use client";

import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";

const NavPending = createContext(false);

/** True while the surrounding NavForm's navigation is loading. */
export const useNavFormPending = () => useContext(NavPending);

/**
 * A search or filter form that moves to `action` with its fields in the
 * address. Without JavaScript it's an ordinary GET form. With it, the page
 * changes in place (showing the route's loading skeleton straight away)
 * and a SubmitButton inside shows its pending label until the new page is
 * ready. Empty fields are left out of the address.
 */
export function NavForm({
  action,
  children,
  ...props
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "method" | "onSubmit"> & { action: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <form
      {...props}
      action={action}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const query = new URLSearchParams();
        for (const [key, value] of new FormData(event.currentTarget)) {
          if (typeof value === "string" && value.trim()) query.append(key, value.trim());
        }
        const href = query.size ? `${action}?${query}` : action;
        startTransition(() => router.push(href));
      }}
    >
      <NavPending.Provider value={pending}>{children}</NavPending.Provider>
    </form>
  );
}
