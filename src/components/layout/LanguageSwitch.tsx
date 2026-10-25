"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localizedPath, stripLocale, urduEnabled, type Locale } from "@/i18n/config";

/**
 * The same page in the other language. Urdu addresses start with /ur, which
 * also remembers the choice; the way back to English adds ?lang=en, which
 * the middleware turns into "remember English" and then drops. Plain links,
 * so switching works without JavaScript; with it, the page's own query
 * (filters, quiz answers) comes along too.
 */
function hrefFor(target: Locale, pathname: string) {
  const path = stripLocale(pathname);
  return target === "ur" ? localizedPath(path, "ur") : `${path}?lang=en`;
}

/** Adds the current page's query to the link just before the browser follows it. */
function keepQuery(event: React.MouseEvent<HTMLAnchorElement>) {
  const current = new URLSearchParams(window.location.search);
  if (current.size === 0) return;
  const url = new URL(event.currentTarget.href);
  current.forEach((value, key) => {
    if (key !== "lang") url.searchParams.append(key, value);
  });
  event.currentTarget.href = url.toString();
}

const options = [
  // `label` is the pill's short form; the Menu screen shows `name`.
  { locale: "en", label: "EN", name: "English" },
  { locale: "ur", label: "اردو", name: "اردو" },
] as const;

/**
 * EN | اردو. `pill` sits in the site header and the phone top bar (a little
 * narrower below 360 px); `menu` is the wider switch on the Menu screen.
 * Until Urdu is switched on, the Urdu half says "coming soon" instead of
 * linking anywhere.
 */
export function LanguageSwitch({ variant = "pill" }: { variant?: "pill" | "menu" }) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const enabled = urduEnabled();
  const menu = variant === "menu";

  const group = menu
    ? "flex items-center gap-1 rounded-pill bg-blush p-1"
    : "flex h-11 shrink-0 items-center gap-2 rounded-pill border border-border-strong bg-card px-3.5 max-[360px]:px-3";
  // In the pill, the padding and negative margin give each link a wider tap area without moving anything.
  const segment = (current: boolean, urdu: boolean) =>
    [
      menu
        ? "flex flex-1 items-center justify-center rounded-pill px-2"
        : "-mx-1 flex h-11 items-center px-1",
      urdu ? "font-urdu text-[13px] leading-[28px]" : menu ? "py-2.5 text-label-m" : "text-label-s",
      menu && urdu ? "py-0.5" : "",
      current ? (menu ? "bg-card text-charcoal" : "text-charcoal") : "text-muted",
    ].join(" ");

  return (
    <div className={group} role="group" aria-label={t("label")}>
      {options.map((option, i) => {
        const urdu = option.locale === "ur";
        const current = option.locale === locale;
        const attrs = { lang: option.locale, dir: urdu ? "rtl" : "ltr" } as const;
        const item = current ? (
          <span key={option.locale} {...attrs} aria-current="true" className={segment(true, urdu)}>
            {menu ? option.name : option.label}
          </span>
        ) : urdu && !enabled ? (
          <span
            key={option.locale}
            {...attrs}
            aria-disabled="true"
            title={t("comingSoon")}
            className={segment(false, true)}
          >
            {menu ? option.name : option.label}
            <span className="sr-only" lang={locale} dir={locale === "ur" ? "rtl" : "ltr"}>
              {" "}
              {t("comingSoonShort")}
            </span>
          </span>
        ) : (
          <a
            key={option.locale}
            {...attrs}
            href={hrefFor(option.locale, pathname)}
            hrefLang={option.locale}
            title={option.name}
            onClick={keepQuery}
            className={`${segment(false, urdu)} hover:text-charcoal ${menu ? "hover:bg-card/60" : ""}`}
          >
            {menu ? option.name : option.label}
          </a>
        );
        return !menu && i > 0 ? (
          <span key={`${option.locale}-divider`} className="contents">
            <span className="h-3.5 w-px bg-border-strong" aria-hidden="true" />
            {item}
          </span>
        ) : (
          item
        );
      })}
    </div>
  );
}
