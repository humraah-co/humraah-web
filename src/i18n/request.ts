import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isEnabledLocale } from "./config.ts";

/**
 * Messages for each request. Public pages pass their [locale] segment; the
 * admin area has none, so it gets English.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isEnabledLocale(requested) ? requested : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Asia/Karachi",
  };
});
