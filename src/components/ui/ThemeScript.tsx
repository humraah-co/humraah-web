import { THEME_SCRIPT } from "@/lib/theme/script";

/** Put in the <head> of every root layout: sets light or dark before the first paint (see src/lib/theme/script.ts). */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
