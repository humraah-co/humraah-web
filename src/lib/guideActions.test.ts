// Who may upload, replace and remove a Higher Education Guide PDF, and what
// each step checks. Run with: npm run test:unit
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canRemoveGuide,
  canUploadGuide,
  confirmGuideUpload,
  removeGuide,
  requestGuideUpload,
  type GuideDeps,
  type GuideMember,
  type GuideRow,
} from "./admin/guideActions.ts";
import { MAX_GUIDE_BYTES } from "./guideFiles.ts";

const ID = "0d6c7a4e-3b1f-4a3e-9c2a-7f1e2d3c4b5a";
const OLD = "en/11111111-2222-4333-8444-555555555555.pdf";
const NEW = `en/${ID}.pdf`;
const pdf = new TextEncoder().encode("%PDF-1.7");

const member = (role: GuideMember["role"], status: GuideMember["status"] = "active"): GuideMember => ({
  user_id: "u1",
  role,
  status,
});
const everyone: [string, GuideMember | null][] = [
  ["researcher", member("researcher")],
  ["admin", member("admin")],
  ["owner", member("owner")],
  ["invited researcher", member("researcher", "invited")],
  ["suspended researcher", member("researcher", "suspended")],
  ["suspended admin", member("admin", "suspended")],
  ["invited admin", member("admin", "invited")],
  ["signed in but not on the team", null],
];

/** A fake Storage and database that record what was done to them. */
function setup(
  options: {
    caller?: GuideMember | null;
    signedIn?: boolean;
    row?: GuideRow | null;
    object?: { size: number; header: Uint8Array } | null;
    saveWorks?: boolean;
    deleteCount?: number;
    storage?: boolean;
  } = {},
) {
  const calls: string[] = [];
  const row = options.row === undefined ? null : options.row;
  const deps: GuideDeps = {
    getCaller: async () => ({
      signedIn: options.signedIn ?? true,
      member: options.caller === undefined ? member("researcher") : options.caller,
    }),
    newId: () => ID,
    storage:
      options.storage === false
        ? null
        : {
            createSignedUpload: async (path) => {
              calls.push(`sign ${path}`);
              return { signedUrl: `https://x.supabase.co/upload?path=${path}` };
            },
            inspect: async (path) => {
              calls.push(`inspect ${path}`);
              return options.object === undefined ? { size: 5000, header: pdf } : options.object;
            },
            remove: async (path) => {
              calls.push(`remove ${path}`);
              return true;
            },
          },
    db: {
      get: async () => row,
      save: async (r) => {
        calls.push(`save ${r.language} ${r.storage_path} ${r.file_name} ${r.size_bytes}`);
        return options.saveWorks ?? true;
      },
      delete: async (language) => {
        calls.push(`delete ${language}`);
        return options.deleteCount ?? 1;
      },
    },
    revalidate: () => calls.push("revalidate"),
  };
  return { deps, calls };
}

const request = { language: "en", fileName: "Guide.pdf", size: 3_000_000, type: "application/pdf" };
const confirm = { language: "en", path: NEW, fileName: "Guide.pdf" };
const oldRow: GuideRow = { language: "en", storage_path: OLD, file_name: "old.pdf", size_bytes: 100 };

test("the role rules: any active member uploads, only active admins and the owner remove", () => {
  const upload = everyone.map(([name, m]) => [name, canUploadGuide(m)]);
  assert.deepEqual(upload, [
    ["researcher", true],
    ["admin", true],
    ["owner", true],
    ["invited researcher", false],
    ["suspended researcher", false],
    ["suspended admin", false],
    ["invited admin", false],
    ["signed in but not on the team", false],
  ]);
  const remove = everyone.map(([name, m]) => [name, canRemoveGuide(m)]);
  assert.deepEqual(remove, [
    ["researcher", false],
    ["admin", true],
    ["owner", true],
    ["invited researcher", false],
    ["suspended researcher", false],
    ["suspended admin", false],
    ["invited admin", false],
    ["signed in but not on the team", false],
  ]);
});

test("asking for an upload URL: active members get one for the right folder", async () => {
  for (const role of ["researcher", "admin", "owner"] as const) {
    const { deps, calls } = setup({ caller: member(role) });
    const result = await requestGuideUpload(deps, request);
    assert.deepEqual(result, { ok: true, path: NEW, signedUrl: `https://x.supabase.co/upload?path=${NEW}` });
    assert.deepEqual(calls, [`sign ${NEW}`]);
  }
  const { deps } = setup();
  const ur = await requestGuideUpload(deps, { ...request, language: "ur" });
  assert.ok(ur.ok && ur.path.startsWith("ur/") && ur.path.endsWith(".pdf"));
});

test("asking for an upload URL: invited, suspended and non-members are refused before anything happens", async () => {
  for (const [name, caller] of everyone.slice(3)) {
    const { deps, calls } = setup({ caller });
    assert.deepEqual(await requestGuideUpload(deps, request), { ok: false, error: "not-allowed" }, name);
    assert.deepEqual(calls, [], name);
  }
});

test("asking for an upload URL: nobody signed in is told to sign in", async () => {
  const { deps, calls } = setup({ signedIn: false, caller: null });
  assert.deepEqual(await requestGuideUpload(deps, request), { ok: false, error: "signed-out" });
  assert.deepEqual(calls, []);
});

test("asking for an upload URL: a bad request is refused with the reason, and no URL is made", async () => {
  const cases: [object, string][] = [
    [{ language: "fr" }, "bad-language"],
    [{ fileName: "guide.docx" }, "bad-name"],
    [{ type: "image/png" }, "bad-type"],
    [{ size: MAX_GUIDE_BYTES + 1 }, "too-big"],
    [{ size: 0 }, "empty"],
  ];
  for (const [patch, error] of cases) {
    const { deps, calls } = setup();
    assert.deepEqual(await requestGuideUpload(deps, { ...request, ...patch }), { ok: false, error });
    assert.deepEqual(calls, []);
  }
});

test("asking for an upload URL: without the service-role key it says uploads aren't set up", async () => {
  const { deps } = setup({ storage: false });
  assert.deepEqual(await requestGuideUpload(deps, request), { ok: false, error: "not-configured" });
});

test("confirming: members who may not upload change nothing", async () => {
  for (const [name, caller] of everyone.slice(3)) {
    const { deps, calls } = setup({ caller });
    assert.deepEqual(await confirmGuideUpload(deps, confirm), { ok: false, error: "not-allowed" }, name);
    assert.deepEqual(calls, [], name);
  }
});

test("confirming: only a path made for this language is accepted", async () => {
  for (const path of [
    `ur/${ID}.pdf`,
    `en/../${ID}.pdf`,
    "en/secret.pdf",
    OLD.replace("en/", "ur/"),
    "",
    undefined,
    42,
  ]) {
    const { deps, calls } = setup();
    assert.deepEqual(await confirmGuideUpload(deps, { ...confirm, path }), { ok: false, error: "bad-path" });
    assert.deepEqual(calls, []);
  }
  const { deps } = setup();
  assert.deepEqual(await confirmGuideUpload(deps, { ...confirm, language: "fr" }), {
    ok: false,
    error: "bad-language",
  });
});

test("confirming: a file that never arrived is reported", async () => {
  const { deps, calls } = setup({ object: null });
  assert.deepEqual(await confirmGuideUpload(deps, confirm), { ok: false, error: "missing" });
  assert.deepEqual(calls, [`inspect ${NEW}`]);
});

test("confirming: something that isn't a PDF is deleted and never published", async () => {
  const html = new TextEncoder().encode("<html>");
  const { deps, calls } = setup({ object: { size: 5000, header: html }, row: oldRow });
  assert.deepEqual(await confirmGuideUpload(deps, confirm), { ok: false, error: "not-pdf" });
  assert.deepEqual(calls, [`inspect ${NEW}`, `remove ${NEW}`]);
});

test("confirming: a file over 25 MB is deleted whatever the browser said", async () => {
  const { deps, calls } = setup({ object: { size: MAX_GUIDE_BYTES + 1, header: pdf } });
  assert.deepEqual(await confirmGuideUpload(deps, confirm), { ok: false, error: "too-big" });
  assert.deepEqual(calls, [`inspect ${NEW}`, `remove ${NEW}`]);
  const empty = setup({ object: { size: 0, header: new Uint8Array() } });
  assert.deepEqual(await confirmGuideUpload(empty.deps, confirm), { ok: false, error: "empty" });
});

test("confirming a first upload: saves the stored size, clears the cache, deletes nothing", async () => {
  const { deps, calls } = setup({ object: { size: 4321, header: pdf } });
  assert.deepEqual(await confirmGuideUpload(deps, { ...confirm, fileName: "C:\\docs\\Guide.pdf" }), {
    ok: true,
    fileName: "Guide.pdf",
    size: 4321,
  });
  assert.deepEqual(calls, [`inspect ${NEW}`, `save en ${NEW} Guide.pdf 4321`, "revalidate"]);
});

test("confirming a replacement: the old file is deleted after the new one is saved", async () => {
  const { deps, calls } = setup({ row: oldRow });
  assert.equal((await confirmGuideUpload(deps, confirm)).ok, true);
  assert.deepEqual(calls, [`inspect ${NEW}`, `save en ${NEW} Guide.pdf 5000`, `remove ${OLD}`, "revalidate"]);
});

test("confirming twice does not delete the file that is now live", async () => {
  const { deps, calls } = setup({ row: { ...oldRow, storage_path: NEW } });
  assert.equal((await confirmGuideUpload(deps, confirm)).ok, true);
  assert.ok(!calls.some((c) => c.startsWith("remove")));
});

test("confirming: if the database refuses, the new file goes and the old one stays", async () => {
  const { deps, calls } = setup({ row: oldRow, saveWorks: false });
  assert.deepEqual(await confirmGuideUpload(deps, confirm), { ok: false, error: "failed" });
  assert.deepEqual(calls, [`inspect ${NEW}`, `save en ${NEW} Guide.pdf 5000`, `remove ${NEW}`]);
});

test("removing: a researcher, an invited or suspended member, or a non-member cannot", async () => {
  for (const [name, caller] of everyone.filter(([n]) => n !== "admin" && n !== "owner")) {
    const { deps, calls } = setup({ caller, row: oldRow });
    assert.deepEqual(await removeGuide(deps, { language: "en" }), { ok: false, error: "not-allowed" }, name);
    assert.deepEqual(calls, [], name);
  }
  const { deps } = setup({ signedIn: false, caller: null });
  assert.deepEqual(await removeGuide(deps, { language: "en" }), { ok: false, error: "signed-out" });
});

test("removing: an admin or the owner deletes the row, then the file, then clears the cache", async () => {
  for (const role of ["admin", "owner"] as const) {
    const { deps, calls } = setup({ caller: member(role), row: oldRow });
    assert.deepEqual(await removeGuide(deps, { language: "en" }), { ok: true });
    assert.deepEqual(calls, ["delete en", `remove ${OLD}`, "revalidate"]);
  }
});

test("removing: if the database refuses, the file stays", async () => {
  const { deps, calls } = setup({ caller: member("admin"), row: oldRow, deleteCount: 0 });
  assert.deepEqual(await removeGuide(deps, { language: "en" }), { ok: false, error: "not-allowed" });
  assert.deepEqual(calls, ["delete en"]);
});

test("removing a guide that is already gone is fine; a made-up language is refused", async () => {
  const { deps, calls } = setup({ caller: member("admin"), row: null });
  assert.deepEqual(await removeGuide(deps, { language: "ur" }), { ok: true });
  assert.deepEqual(calls, ["revalidate"]);
  assert.deepEqual(await removeGuide(deps, { language: "fr" }), { ok: false, error: "bad-language" });
});

test("an unexpected error is reported as a plain failure, not thrown", async () => {
  const { deps } = setup();
  deps.getCaller = async () => {
    throw new Error("network down");
  };
  const quiet = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await requestGuideUpload(deps, request), { ok: false, error: "failed" });
    assert.deepEqual(await confirmGuideUpload(deps, confirm), { ok: false, error: "failed" });
    assert.deepEqual(await removeGuide(deps, { language: "en" }), { ok: false, error: "failed" });
  } finally {
    console.error = quiet;
  }
});
