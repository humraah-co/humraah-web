/**
 * Turns a listing page's address ("/universities?city=Lahore&women=1") into
 * what its search form needs: the path to submit to and the filters to carry
 * along as hidden fields. The search words themselves ("q") are left out,
 * since the form's own box supplies them.
 */
export function searchFormParts(href: string) {
  const [path, query = ""] = href.split("?");
  const fields = [...new URLSearchParams(query)].filter(([name]) => name !== "q");
  return { path, fields };
}
