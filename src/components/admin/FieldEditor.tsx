"use client";

import { useState } from "react";
import { saveField } from "@/app/admin/(portal)/fields/actions";
import { EditorFrame, type EditorMeta } from "@/components/admin/EditorFrame";
import { SectionCard, TextArea, TextInput, UrduSection } from "@/components/admin/EditorParts";
import { slugify } from "@/lib/admin/content";
import { fieldLabels, fieldUrduKeys, isQuizField, type FieldValues } from "@/lib/admin/siteContent";

/** Add or edit a field of study. Same layout as the university and scholarship editors (Figma 36:3943). */
export function FieldEditor({
  meta,
  initial,
  notice,
  recent,
}: {
  meta: EditorMeta;
  initial: FieldValues;
  notice?: { text: string; tone: "success" | "problem" };
  recent?: React.ReactNode;
}) {
  const [values, setValues] = useState(initial);
  // New entries take their web address from the name until someone edits it.
  const [slugEdited, setSlugEdited] = useState(meta.id !== null);
  const set =
    <K extends keyof FieldValues>(key: K) =>
    (value: FieldValues[K]) =>
      setValues((v) => ({ ...v, [key]: value }));
  // The quiz scores these by web address; the database refuses a change too.
  const locked = meta.id !== null && isQuizField(initial.slug);

  return (
    <EditorFrame
      meta={meta}
      initial={initial}
      values={values}
      labels={fieldLabels}
      action={saveField}
      notice={notice}
      source={{ value: values.source_url, onChange: set("source_url") }}
      recent={recent}
    >
      {(errors) => (
        <>
          <SectionCard id="basic" title="Basic information">
            <TextInput
              name="name"
              label="Name"
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
              readOnly={locked}
              value={values.slug}
              onChange={(slug) => {
                setSlugEdited(true);
                set("slug")(slug);
              }}
              error={errors.slug}
              hint={
                locked
                  ? `The page is at /explore/${values.slug}. The quiz uses this address, so it can’t be changed.`
                  : meta.id
                    ? `The page is at /explore/${values.slug || "…"}. Changing this changes the link.`
                    : `Filled in from the name: /explore/${values.slug || "…"}. You can change it.`
              }
            />
            <TextInput
              name="sort_order"
              label="Order on the page"
              inputMode="numeric"
              maxLength={4}
              value={values.sort_order}
              onChange={set("sort_order")}
              error={errors.sort_order}
              hint="Lower numbers come first on Explore."
            />
          </SectionCard>

          <SectionCard id="details" title="What students read">
            <TextArea
              name="summary"
              label="Summary"
              rows={3}
              value={values.summary}
              onChange={set("summary")}
              error={errors.summary}
              hint="One or two plain sentences, shown on the card and at the top of the page."
            />
            <TextInput
              name="you_might_enjoy"
              label="You might enjoy this if you like"
              maxLength={300}
              value={values.you_might_enjoy}
              onChange={set("you_might_enjoy")}
              error={errors.you_might_enjoy}
              hint="Finishes the sentence, for example “maths, science or building things”."
            />
            <TextArea
              name="interests"
              label="Interests (short labels)"
              rows={4}
              maxLength={1000}
              value={values.interests}
              onChange={set("interests")}
              error={errors.interests}
              hint="One per line, shown as chips, for example Maths. The quiz doesn’t use these."
            />
            <TextArea
              name="example_programmes"
              label="Example programmes"
              rows={4}
              maxLength={1000}
              value={values.example_programmes}
              onChange={set("example_programmes")}
              error={errors.example_programmes}
              hint="One per line, for example Civil. Programme names stay in English."
            />
          </SectionCard>

          <UrduSection
            id="urdu"
            hasErrors={fieldUrduKeys.some((k) => errors[k])}
            filled={fieldUrduKeys.filter((k) => values[k].trim()).length}
          >
            <TextInput
              urdu
              name="name_ur"
              label="Name (Urdu)"
              value={values.name_ur}
              onChange={set("name_ur")}
              error={errors.name_ur}
              hint={values.name ? `English: ${values.name}` : undefined}
            />
            <TextArea
              urdu
              name="summary_ur"
              label="Summary (Urdu)"
              rows={3}
              value={values.summary_ur}
              onChange={set("summary_ur")}
              error={errors.summary_ur}
            />
            <TextInput
              urdu
              name="you_might_enjoy_ur"
              label="You might enjoy this if you like (Urdu)"
              maxLength={300}
              value={values.you_might_enjoy_ur}
              onChange={set("you_might_enjoy_ur")}
              error={errors.you_might_enjoy_ur}
            />
            <TextArea
              urdu
              name="interests_ur"
              label="Interests (Urdu)"
              rows={4}
              maxLength={1000}
              value={values.interests_ur}
              onChange={set("interests_ur")}
              error={errors.interests_ur}
              hint="One short label per line, like the English."
            />
          </UrduSection>
        </>
      )}
    </EditorFrame>
  );
}
