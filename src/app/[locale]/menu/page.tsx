import type { Metadata } from "next";
import { BookOpen, ChevronRight, Compass, Globe, Heart, Lightbulb, X, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LogoHorizontal } from "@/components/brand/Logo";
import { HelpCallout } from "@/components/ui/Blocks";
import { menuNav } from "@/lib/nav";
import { Link } from "@/i18n/navigation";
import { pageLocale, type LocaleParams } from "@/i18n/server";

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: "menu" });
  return { title: t("title") };
}

const icons: Record<string, LucideIcon> = {
  "/guidance": Lightbulb,
  "/guide": BookOpen,
  "/resources": Globe,
  "/about": Heart,
  "/quiz": Compass,
};

/**
 * Menu (Figma 30:2638): a full screen with its own header, opened from the
 * mobile top bar. Lists the pages that aren't in the bottom bar.
 */
export default async function MenuPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  await pageLocale(params);
  const t = await getTranslations("menu");
  const nav = await getTranslations("nav");
  const language = await getTranslations("language");
  const { from } = await searchParams;
  const back = Array.isArray(from) ? from[0] : from;
  // Only a path on this site, so the link can't be pointed elsewhere. It has no language
  // prefix; the link adds this page's.
  const closeHref = back && back.startsWith("/") && !back.startsWith("//") ? back : "/";
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col">
      <header className="flex items-center justify-between border-b border-border-soft px-4 py-2.5">
        <LogoHorizontal />
        <Link
          href={closeHref}
          className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-border-soft bg-card hover:bg-blush"
          aria-label={t("close")}
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </header>

      <nav aria-label={nav("menu")} className="px-5 py-2">
        <ul>
          {menuNav.map((item) => {
            const Icon = icons[item.href] ?? Compass;
            return (
              <li key={item.href} className="border-b border-border-soft">
                <Link href={item.href} className="group flex items-center gap-3.5 py-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-blush">
                    <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-label-l">{nav(item.key)}</span>
                    <span className="text-body-s text-muted">{t(`descriptions.${item.key}`)}</span>
                  </span>
                  <ChevronRight
                    className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-2.5 px-5 pt-5 pb-2">
        <p id="language-label" className="text-label-s text-muted">
          {language("label")}
        </p>
        <div
          role="group"
          aria-labelledby="language-label"
          className="flex items-center gap-1 rounded-pill bg-blush p-1"
        >
          <span
            aria-current="true"
            className="flex flex-1 items-center justify-center rounded-pill bg-card px-2 py-2.5 text-label-m"
          >
            English
          </span>
          <span
            lang="ur"
            dir="rtl"
            aria-disabled="true"
            title={language("comingSoon")}
            className="flex flex-1 items-center justify-center px-2 py-0.5 font-urdu text-[13px] leading-[28px] text-muted"
          >
            اردو
            <span className="sr-only" lang="en" dir="ltr">
              {language("comingSoonShort")}
            </span>
          </span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-3 px-5 pt-6 pb-8">
        <HelpCallout />
        <Link
          href="/privacy"
          className="self-center py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
        >
          {t("privacy")}
        </Link>
      </div>
    </div>
  );
}
