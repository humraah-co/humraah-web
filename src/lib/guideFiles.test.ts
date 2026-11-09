// What may be uploaded as a Higher Education Guide PDF. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_GUIDE_BYTES,
  cleanFileName,
  formatFileSize,
  guideDownloadUrl,
  guidePublicUrl,
  guideStoragePath,
  isGuideLanguage,
  isGuidePath,
  isPdfHeader,
  validateGuideUpload,
} from "./guideFiles.ts";

const good = { language: "en", fileName: "Guide.pdf", size: 3_000_000, type: "application/pdf" };
const error = (patch: object) => {
  const r = validateGuideUpload({ ...good, ...patch });
  return r.ok ? null : r.error;
};

test("a PDF of a sensible size is accepted for either language", () => {
  assert.deepEqual(validateGuideUpload(good), {
    ok: true,
    value: { language: "en", fileName: "Guide.pdf", size: 3_000_000 },
  });
  assert.equal(validateGuideUpload({ ...good, language: "ur" }).ok, true);
});

test("only English and Urdu are guides", () => {
  assert.equal(isGuideLanguage("en"), true);
  assert.equal(isGuideLanguage("ur"), true);
  for (const bad of ["fr", "EN", "", null, undefined, 1, ["en"]]) assert.equal(isGuideLanguage(bad), false);
  assert.equal(error({ language: "fr" }), "bad-language");
  assert.equal(error({ language: undefined }), "bad-language");
});

test("the size limit is 25 MB, inclusive", () => {
  assert.equal(MAX_GUIDE_BYTES, 26_214_400);
  assert.equal(error({ size: MAX_GUIDE_BYTES }), null);
  assert.equal(error({ size: MAX_GUIDE_BYTES + 1 }), "too-big");
  assert.equal(error({ size: 1 }), null);
  assert.equal(error({ size: 0 }), "empty");
  assert.equal(error({ size: -5 }), "empty");
});

test("a size that is not a whole number is refused", () => {
  for (const size of ["3000", NaN, Infinity, 1.5, null, undefined]) assert.equal(error({ size }), "failed");
});

test("the type must be PDF (or missing, as some phones report)", () => {
  assert.equal(error({ type: "application/pdf" }), null);
  assert.equal(error({ type: "Application/PDF" }), null);
  assert.equal(error({ type: "" }), null);
  for (const type of ["image/png", "text/html", "application/zip", "application/pdf; x", undefined, 5]) {
    assert.equal(error({ type }), "bad-type");
  }
});

test("the name must end in .pdf and be a reasonable length", () => {
  assert.equal(error({ fileName: "guide.PDF" }), null);
  assert.equal(error({ fileName: "گائیڈ.pdf" }), null);
  for (const fileName of [
    "guide.docx",
    "guide",
    "guide.pdf.exe",
    ".pdf",
    "",
    "   ",
    null,
    7,
    "a".repeat(197) + ".pdf",
  ]) {
    assert.equal(error({ fileName }), "bad-name", String(fileName));
  }
  assert.equal(error({ fileName: "a".repeat(196) + ".pdf" }), null);
});

test("a name that came with a path or control characters is cleaned", () => {
  assert.equal(cleanFileName("C:\\Users\\sana\\Guide.pdf"), "Guide.pdf");
  assert.equal(cleanFileName("../../etc/Guide.pdf"), "Guide.pdf");
  assert.equal(cleanFileName("  Guide\u0000\n.pdf "), "Guide.pdf");
  assert.equal(cleanFileName("folder/"), null);
});

test("the type is checked before the size, so a wrong file says so first", () => {
  assert.equal(error({ type: "image/png", size: MAX_GUIDE_BYTES * 2 }), "bad-type");
});

test("a real PDF starts with %PDF-", () => {
  assert.equal(isPdfHeader(new TextEncoder().encode("%PDF-1.7\n")), true);
  assert.equal(isPdfHeader(new TextEncoder().encode("%PDF")), false);
  assert.equal(isPdfHeader(new TextEncoder().encode("<html>")), false);
  assert.equal(isPdfHeader(new TextEncoder().encode(" %PDF-1.4")), false);
  assert.equal(isPdfHeader(new Uint8Array()), false);
});

test("only paths this feature made, in the right language's folder, are accepted", () => {
  const id = "0d6c7a4e-3b1f-4a3e-9c2a-7f1e2d3c4b5a";
  const path = guideStoragePath("en", id);
  assert.equal(path, `en/${id}.pdf`);
  assert.equal(isGuidePath("en", path), true);
  assert.equal(isGuidePath("ur", path), false);
  for (const bad of [
    `en/${id}.PDF`,
    `en/../${id}.pdf`,
    `en/${id}.pdf/x`,
    `en/x.pdf`,
    `/en/${id}.pdf`,
    "",
    null,
    3,
  ]) {
    assert.equal(isGuidePath("en", bad), false, String(bad));
  }
});

test("sizes read as KB or MB with Latin letters", () => {
  assert.equal(formatFileSize(1), "1 KB");
  assert.equal(formatFileSize(870 * 1024), "870 KB");
  assert.equal(formatFileSize(1024 * 1024 - 1), "1.0 MB");
  assert.equal(formatFileSize(3.24 * 1024 * 1024), "3.2 MB");
  assert.equal(formatFileSize(12.6 * 1024 * 1024), "13 MB");
  assert.equal(formatFileSize(MAX_GUIDE_BYTES), "25 MB");
});

test("public and download addresses", () => {
  const url = guidePublicUrl("https://abcd.supabase.co/", "en/x.pdf");
  assert.equal(url, "https://abcd.supabase.co/storage/v1/object/public/guides/en/x.pdf");
  assert.equal(
    guideDownloadUrl(url, "Higher Education Guide & more.pdf"),
    `${url}?download=Higher%20Education%20Guide%20%26%20more.pdf`,
  );
});
