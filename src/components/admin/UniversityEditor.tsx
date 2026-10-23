"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { saveUniversity } from "@/app/admin/(portal)/universities/actions";
import { EditorFrame, type EditorMeta } from "@/components/admin/EditorFrame";
import {
  CheckboxInput,
  FieldRow,
  RadioSegments,
  SectionCard,
  SelectInput,
  TextArea,
  TextInput,
  fieldId,
} from "@/components/admin/EditorParts";
import { buttonStyles } from "@/components/ui/Button";
import {
  provinces,
  slugify,
  universityLabels,
  type FieldErrors,
  type ProgrammeValues,
  type UniversityValues,
  type YesNo,
} from "@/lib/admin/content";

type FieldOption = { id: string; name: string };

const yesNoOptions = [
  { value: "", label: "Not sure yet" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Add or edit a university (Figma 36:3943). */
export function UniversityEditor({
  meta,
  initial,
  fields,
  notice,
  recent,
}: {
  meta: EditorMeta;
  initial: UniversityValues;
  fields: FieldOption[];
  notice?: { text: string; tone: "success" | "problem" };
  recent?: React.ReactNode;
}) {
  const [values, setValues] = useState(initial);
  // New entries take their web address from the name until someone edits it.
  const [slugEdited, setSlugEdited] = useState(meta.id !== null);
  const set =
    <K extends keyof UniversityValues>(key: K) =>
    (value: UniversityValues[K]) =>
      setValues((v) => ({ ...v, [key]: value }));

  const provinceOptions = [
    { value: "", label: "Not set" },
    ...[...new Set([...provinces, values.province].filter(Boolean))].map((p) => ({ value: p, label: p })),
  ];

  return (
    <EditorFrame
      meta={meta}
      initial={initial}
      values={values}
      labels={universityLabels}
      action={saveUniversity}
      notice={notice}
      source={{ value: values.source_url, onChange: set("source_url") }}
      recent={recent}
    >
      {(errors) => (
        <>
          <SectionCard id="basic" title="Basic information">
            <TextInput
              name="name"
              label="University name"
              required
              value={values.name}
              onChange={(name) =>
                setValues((v) => ({ ...v, name, slug: slugEdited ? v.slug : slugify(name) }))
              }
              error={errors.name}
            />
            <FieldRow>
              <TextInput
                name="short_name"
                label="Short name"
                maxLength={20}
                value={values.short_name}
                onChange={set("short_name")}
                error={errors.short_name}
                hint="For example NUST. Shown on the university’s badge."
              />
              <TextInput
                name="slug"
                label="Web address"
                required
                maxLength={80}
                value={values.slug}
                onChange={(slug) => {
                  setSlugEdited(true);
                  set("slug")(slug);
                }}
                error={errors.slug}
                hint={
                  meta.id
                    ? `The page is at /universities/${values.slug || "…"}. Changing this changes the link.`
                    : `Filled in from the name: /universities/${values.slug || "…"}. You can change it.`
                }
              />
            </FieldRow>
            <FieldRow>
              <TextInput
                name="city"
                label="City"
                required
                value={values.city}
                onChange={set("city")}
                error={errors.city}
              />
              <SelectInput
                name="province"
                label="Province or territory"
                value={values.province}
                onChange={set("province")}
                options={provinceOptions}
              />
            </FieldRow>
            <TextInput
              name="campuses_note"
              label="Campuses"
              value={values.campuses_note}
              onChange={set("campuses_note")}
              error={errors.campuses_note}
              hint="For example “Islamabad and other campuses”. Shown instead of the city when filled in."
            />
            <FieldRow>
              <RadioSegments
                name="type"
                label="Type"
                value={values.type}
                onChange={set("type")}
                options={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                ]}
              />
              <TextInput
                name="website_url"
                label="Official website"
                type="url"
                inputMode="url"
                placeholder="https://"
                maxLength={500}
                value={values.website_url}
                onChange={set("website_url")}
                error={errors.website_url}
              />
            </FieldRow>
            <CheckboxInput
              name="hec_recognised"
              label="Recognised by HEC"
              hint="Check the campus on hec.gov.pk before turning this on. Needed to publish."
              error={errors.hec_recognised}
              checked={values.hec_recognised}
              onChange={set("hec_recognised")}
            />
            <CheckboxInput
              name="women_only"
              label="Women only"
              checked={values.women_only}
              onChange={set("women_only")}
            />
            <FieldRow>
              <SelectInput
                name="has_hostel"
                label="Hostel"
                value={values.has_hostel}
                onChange={(v) => set("has_hostel")(v as YesNo)}
                options={yesNoOptions}
              />
              <SelectInput
                name="need_based_aid"
                label="Need-based financial aid"
                value={values.need_based_aid}
                onChange={(v) => set("need_based_aid")(v as YesNo)}
                options={yesNoOptions}
              />
            </FieldRow>
          </SectionCard>

          <Programmes
            programmes={values.programmes}
            fields={fields}
            errors={errors}
            onChange={set("programmes")}
          />

          <SectionCard id="admissions" title="Admissions and fees">
            <TextArea
              name="overview"
              label="Overview"
              rows={3}
              value={values.overview}
              onChange={set("overview")}
              error={errors.overview}
              hint="A few plain sentences, shown at the top of the profile."
            />
            <FieldRow>
              <TextInput
                name="admission_test"
                label="Admission test"
                value={values.admission_test}
                onChange={set("admission_test")}
                error={errors.admission_test}
                placeholder="For example NET"
              />
              <TextInput
                name="admissions_window"
                label="Application window"
                value={values.admissions_window}
                onChange={set("admissions_window")}
                error={errors.admissions_window}
                placeholder="For example June to August"
              />
            </FieldRow>
            <FieldRow>
              <TextInput
                name="fee_min_pkr"
                label="Lowest fee per semester (Rs)"
                inputMode="numeric"
                maxLength={12}
                value={values.fee_min_pkr}
                onChange={set("fee_min_pkr")}
                error={errors.fee_min_pkr}
                placeholder="45000"
              />
              <TextInput
                name="fee_max_pkr"
                label="Highest fee per semester (Rs)"
                inputMode="numeric"
                maxLength={12}
                value={values.fee_max_pkr}
                onChange={set("fee_max_pkr")}
                error={errors.fee_max_pkr}
                placeholder="60000"
              />
            </FieldRow>
            <TextInput
              name="fee_note"
              label="Fee note"
              value={values.fee_note}
              onChange={set("fee_note")}
              error={errors.fee_note}
              hint="Anything a student should know, for example that hostel costs extra."
            />
            <TextArea
              name="how_to_apply"
              label="How to apply"
              value={values.how_to_apply}
              onChange={set("how_to_apply")}
              error={errors.how_to_apply}
              hint="One step per line. Leave it empty to show the typical steps."
            />
            <TextArea
              name="required_documents"
              label="Documents needed"
              rows={3}
              value={values.required_documents}
              onChange={set("required_documents")}
              error={errors.required_documents}
              hint="One per line."
            />
            <TextInput
              name="admissions_url"
              label="Admissions page"
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={500}
              value={values.admissions_url}
              onChange={set("admissions_url")}
              error={errors.admissions_url}
            />
          </SectionCard>
        </>
      )}
    </EditorFrame>
  );
}

/** Open when the row already has details; after that it's the person's choice (never closed while typing). */
function MoreDetails({ startOpen, children }: { startOpen: boolean; children: React.ReactNode }) {
  const [open] = useState(startOpen);
  return <details open={open}>{children}</details>;
}

/** Programme rows (Figma "Programmes"): field and name, with the rest folded away. */
function Programmes({
  programmes,
  fields,
  errors,
  onChange,
}: {
  programmes: ProgrammeValues[];
  fields: FieldOption[];
  errors: FieldErrors;
  onChange: (programmes: ProgrammeValues[]) => void;
}) {
  const addButton = useRef<HTMLButtonElement>(null);
  const fieldOptions = [
    { value: "", label: "Other" },
    ...fields.map((f) => ({ value: f.id, label: f.name })),
  ];

  const update = (index: number, change: Partial<ProgrammeValues>) =>
    onChange(programmes.map((p, i) => (i === index ? { ...p, ...change } : p)));

  function add() {
    const key = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : String(Date.now());
    onChange([
      ...programmes,
      { key, field_id: "", name: "", level: "Undergraduate", entry_requirements: "", entry_test: "" },
    ]);
    const index = programmes.length;
    requestAnimationFrame(() => document.getElementById(fieldId(`programmes.${index}.field_id`))?.focus());
  }

  function remove(index: number) {
    onChange(programmes.filter((_, i) => i !== index));
    addButton.current?.focus();
  }

  return (
    <SectionCard
      id="programmes"
      title="Programmes"
      description="Each programme is listed under its field of study on the university’s page."
    >
      {programmes.length ? (
        <ol className="flex flex-col gap-3">
          {programmes.map((p, i) => {
            const at = (key: keyof ProgrammeValues) => `programmes.${i}.${key}`;
            return (
              <li key={p.key}>
                <fieldset className="flex flex-col gap-3 rounded-2xl border border-border-soft p-4">
                  <legend className="sr-only">Programme {i + 1}</legend>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                    <SelectInput
                      name={at("field_id")}
                      label="Field"
                      value={p.field_id}
                      onChange={(field_id) => update(i, { field_id })}
                      options={fieldOptions}
                    />
                    <TextInput
                      name={at("name")}
                      label="Programme name"
                      required
                      value={p.name}
                      onChange={(name) => update(i, { name })}
                      error={errors[at("name")]}
                      placeholder="For example BS Computer Science"
                    />
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="flex size-12 shrink-0 cursor-pointer items-center justify-center self-end rounded-pill border border-border-soft bg-card hover:bg-blush sm:mt-[30px] sm:self-start"
                    >
                      <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
                      <span className="sr-only">
                        Remove programme {i + 1}
                        {p.name && `: ${p.name}`}
                      </span>
                    </button>
                  </div>
                  <MoreDetails
                    startOpen={!!(p.entry_requirements || p.entry_test || p.level !== "Undergraduate")}
                  >
                    <summary className="cursor-pointer py-1 text-label-m text-deep-rose underline underline-offset-2">
                      Level, entry test and requirements
                    </summary>
                    <div className="flex flex-col gap-3 pt-3">
                      <FieldRow>
                        <TextInput
                          name={at("level")}
                          label="Level"
                          value={p.level}
                          onChange={(level) => update(i, { level })}
                          placeholder="Undergraduate"
                        />
                        <TextInput
                          name={at("entry_test")}
                          label="Entry test"
                          value={p.entry_test}
                          onChange={(entry_test) => update(i, { entry_test })}
                        />
                      </FieldRow>
                      <TextArea
                        name={at("entry_requirements")}
                        label="Entry requirements"
                        rows={2}
                        maxLength={1000}
                        value={p.entry_requirements}
                        onChange={(entry_requirements) => update(i, { entry_requirements })}
                        hint="In simple language, for example “FSc Pre-Engineering with at least 60%”."
                      />
                    </div>
                  </MoreDetails>
                </fieldset>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-body-s text-muted">No programmes yet.</p>
      )}
      <button
        ref={addButton}
        type="button"
        onClick={add}
        className={`${buttonStyles.text} cursor-pointer self-start`}
      >
        Add programme
      </button>
    </SectionCard>
  );
}
