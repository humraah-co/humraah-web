"use client";

import { useState } from "react";
import { saveScholarship } from "@/app/admin/(portal)/scholarships/actions";
import { EditorFrame, type EditorMeta } from "@/components/admin/EditorFrame";
import {
  CheckboxInput,
  FieldRow,
  RadioSegments,
  SectionCard,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/EditorParts";
import { checkboxClass } from "@/components/ui/Field";
import {
  scholarshipKindLabels,
  scholarshipLabels,
  scholarshipScopeLabels,
  slugify,
  type ScholarshipValues,
} from "@/lib/admin/content";
import type { ScholarshipKind, ScholarshipScope } from "@/lib/database.types";

type FieldOption = { id: string; name: string };

const kindOptions = [
  { value: "", label: "Choose one" },
  ...(Object.entries(scholarshipKindLabels) as [ScholarshipKind, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

const scopeOptions = (Object.entries(scholarshipScopeLabels) as [ScholarshipScope, string][]).map(
  ([value, label]) => ({ value, label }),
);

/** Add or edit a scholarship. Same layout as the university editor (Figma 36:3943). */
export function ScholarshipEditor({
  meta,
  initial,
  fields,
  notice,
  recent,
}: {
  meta: EditorMeta;
  initial: ScholarshipValues;
  fields: FieldOption[];
  notice?: { text: string; tone: "success" | "problem" };
  recent?: React.ReactNode;
}) {
  const [values, setValues] = useState(initial);
  // New entries take their web address from the name until someone edits it.
  const [slugEdited, setSlugEdited] = useState(meta.id !== null);
  const set =
    <K extends keyof ScholarshipValues>(key: K) =>
    (value: ScholarshipValues[K]) =>
      setValues((v) => ({ ...v, [key]: value }));

  const toggleField = (id: string, on: boolean) =>
    setValues((v) => ({
      ...v,
      field_ids: on ? [...v.field_ids, id] : v.field_ids.filter((f) => f !== id),
    }));

  return (
    <EditorFrame
      meta={meta}
      initial={initial}
      values={values}
      labels={scholarshipLabels}
      action={saveScholarship}
      notice={notice}
      source={{ value: values.source_url, onChange: set("source_url") }}
      recent={recent}
    >
      {(errors) => (
        <>
          <SectionCard id="basic" title="Basic information">
            <TextInput
              name="name"
              label="Scholarship name"
              required
              value={values.name}
              onChange={(name) =>
                setValues((v) => ({ ...v, name, slug: slugEdited ? v.slug : slugify(name) }))
              }
              error={errors.name}
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
                  ? `The page is at /scholarships/${values.slug || "…"}. Changing this changes the link.`
                  : `Filled in from the name: /scholarships/${values.slug || "…"}. You can change it.`
              }
            />
            <FieldRow>
              <TextInput
                name="provider"
                label="Offered by"
                required
                value={values.provider}
                onChange={set("provider")}
                error={errors.provider}
                placeholder="For example Higher Education Commission (HEC)"
              />
              <SelectInput
                name="kind"
                label="Type of support"
                required
                value={values.kind}
                onChange={(kind) => set("kind")(kind as ScholarshipValues["kind"])}
                options={kindOptions}
                error={errors.kind}
              />
            </FieldRow>
            <RadioSegments
              name="scope"
              label="Where students study"
              value={values.scope}
              onChange={set("scope")}
              options={scopeOptions}
            />
            <CheckboxInput
              name="women_only"
              label="For women"
              hint="Only women can apply."
              checked={values.women_only}
              onChange={set("women_only")}
            />
            <TextInput
              name="audience_note"
              label="Who it’s mainly for"
              value={values.audience_note}
              onChange={set("audience_note")}
              error={errors.audience_note}
              hint="A short line on the card, for example “50% for women”."
            />
          </SectionCard>

          <SectionCard id="details" title="Eligibility and what it covers">
            <TextArea
              name="summary"
              label="Summary"
              rows={3}
              value={values.summary}
              onChange={set("summary")}
              error={errors.summary}
              hint="One or two plain sentences, shown on the card and at the top of the page."
            />
            <TextArea
              name="who_its_for"
              label="Eligibility"
              value={values.who_its_for}
              onChange={set("who_its_for")}
              error={errors.who_its_for}
              hint="Who can apply, in simple language. One point per line."
            />
            <TextArea
              name="what_it_covers"
              label="What it covers"
              rows={3}
              value={values.what_it_covers}
              onChange={set("what_it_covers")}
              error={errors.what_it_covers}
              hint="The amount and what it pays for, for example full tuition and a monthly stipend."
            />
            <FieldRow>
              <TextArea
                name="covers"
                label="Covers (short labels)"
                rows={3}
                maxLength={1000}
                value={values.covers}
                onChange={set("covers")}
                error={errors.covers}
                hint="One per line, shown as chips, for example Tuition."
              />
              <TextArea
                name="eligible_areas"
                label="Eligible subjects or areas"
                rows={3}
                value={values.eligible_areas}
                onChange={set("eligible_areas")}
                error={errors.eligible_areas}
                hint="One per line. Used by search."
              />
            </FieldRow>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-1 text-label-m">Fields of study</legend>
              <p id="f-field_ids-hint" className="text-caption text-muted">
                The scholarship shows on these fields’ pages. Leave them all unticked if it’s open to every
                field.
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {fields.map((f) => (
                  <label key={f.id} className="flex cursor-pointer items-start gap-3 text-body-m">
                    <input
                      type="checkbox"
                      checked={values.field_ids.includes(f.id)}
                      onChange={(e) => toggleField(f.id, e.target.checked)}
                      aria-describedby="f-field_ids-hint"
                      className={`${checkboxClass} mt-0.5 size-6 rounded-[7px]`}
                    />
                    {f.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </SectionCard>

          <SectionCard id="apply" title="Deadline and how to apply">
            <FieldRow>
              <TextInput
                name="deadline"
                label="Deadline"
                type="date"
                value={values.deadline}
                onChange={set("deadline")}
                error={errors.deadline}
                hint="Leave empty if there isn’t a fixed date."
              />
              <TextInput
                name="deadline_note"
                label="Deadline note"
                value={values.deadline_note}
                onChange={set("deadline_note")}
                error={errors.deadline_note}
                hint="For example “Usually opens in July”."
              />
            </FieldRow>
            <TextArea
              name="how_to_apply"
              label="How to apply"
              value={values.how_to_apply}
              onChange={set("how_to_apply")}
              error={errors.how_to_apply}
              hint="One step per line."
            />
            <TextInput
              name="official_url"
              label="Official link"
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={500}
              value={values.official_url}
              onChange={set("official_url")}
              error={errors.official_url}
              hint="Where students apply or read the full details."
            />
          </SectionCard>
        </>
      )}
    </EditorFrame>
  );
}
