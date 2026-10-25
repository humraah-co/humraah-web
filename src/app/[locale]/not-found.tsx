import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

/** Labels are the "nav" messages. */
const places = [
  { href: "/explore", key: "explore" },
  { href: "/universities", key: "universities" },
  { href: "/scholarships", key: "scholarships" },
  { href: "/guidance", key: "guidance" },
] as const;

export default function NotFound() {
  const t = useTranslations("notFound");
  const nav = useTranslations("nav");
  return (
    <Container className="py-16 text-center lg:py-24">
      <p className="text-script text-deep-rose">{t("script")}</p>
      <h1 className="mt-3 text-h1">{t("title")}</h1>
      <p className="mx-auto mt-3 max-w-md text-body-m text-muted">{t("text")}</p>
      <ButtonLink href="/" className="mt-6">
        {t("home")}
      </ButtonLink>
      <nav aria-label={t("popular")} className="mt-6">
        <p className="text-label-s text-muted">{t("orTry")}</p>
        <ul className="mt-1 flex flex-wrap justify-center gap-x-5">
          {places.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="inline-block py-2.5 text-label-m text-deep-rose underline underline-offset-2 hover:text-charcoal"
              >
                {nav(p.key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
