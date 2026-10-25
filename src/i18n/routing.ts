import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, enabledLocales } from "./config.ts";

/**
 * next-intl's view of the routes, for building links (see navigation.ts).
 * The middleware applies the rules itself (decide.ts), so next-intl's own
 * locale detection, cookie and alternate links are switched off here.
 */
export const routing = defineRouting({
  locales: enabledLocales(),
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});
