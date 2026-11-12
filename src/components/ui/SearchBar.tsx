import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { buttonStyles } from "@/components/ui/Button";
import { localizedPath, type Locale } from "@/i18n/config";
import { searchFormParts } from "@/lib/searchForm";

/**
 * The search bar at the top of Universities, Explore and Scholarships: a
 * plain GET form, so Enter in the box and the Search button do the same
 * thing (reload the page with ?q=…) and it works without JavaScript. The
 * filters already applied ride along as hidden fields, so searching keeps
 * them. The button shows from 1024 px; on a phone the keyboard's search key
 * submits.
 */
export function SearchBar({
  id,
  label,
  query,
  href,
}: {
  /** The input's id. */
  id: string;
  /** Read by screen readers and shown as the placeholder. */
  label: string;
  /** The current search words. */
  query: string;
  /** This page's address with the filters applied, without a language prefix. */
  href: string;
}) {
  const nav = useTranslations("nav");
  const locale = useLocale() as Locale;
  const { path, fields } = searchFormParts(href);
  return (
    <form role="search" action={localizedPath(path, locale)} className="flex items-center gap-3 lg:pt-2">
      {fields.map(([name, value]) => (
        <input key={`${name}=${value}`} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span className="flex h-[52px] min-w-0 flex-1 items-center gap-2.5 rounded-pill border border-border-strong bg-card px-[18px] lg:max-w-[560px]">
        <Search className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <input
          id={id}
          name="q"
          type="search"
          enterKeyHint="search"
          defaultValue={query}
          placeholder={label}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-body-m text-charcoal outline-none placeholder:text-muted"
        />
      </span>
      <span className="hidden lg:block">
        <button type="submit" className={buttonStyles.primary}>
          {nav("search")}
        </button>
      </span>
    </form>
  );
}
