"use client";

import { useState } from "react";
import { saveGuidance } from "@/app/admin/(portal)/guidance/actions";
import { EditorFrame, type EditorMeta } from "@/components/admin/EditorFrame";
import { SectionCard, TextArea, TextInput, UrduSection } from "@/components/admin/EditorParts";
import { slugify } from "@/lib/admin/content";
import { BODY_MAX, guidanceLabels, guidanceUrduKeys, type GuidanceValues } from "@/lib/admin/siteContent";

const bodyHint =
  "## Heading, - for bullets, 1. for a numbered list, > for a quote, **bold**, *italic* and [link text](https://…). Headings like “## Step 1: …” show as numbered steps. Leave a blank line between paragraphs.";

/** Add or edit a guidance article. Same layout as the other editors (Figma 36:3943). */
export function GuidanceEditor({
  meta,
  initial,
  notice,
  recent,
}: {
  meta: EditorMeta;
  initial: GuidanceValues;
  notice?: { text: string; tone: "success" | "problem" };
  recent?: React.ReactNode;
}) {
  const [values, setValues] = useState(initial);
  // New entries take their web address from the title until someone edits it.
  const [slugEdited, setSlugEdited] = useState(meta.id !== null);
  const set =
    <K extends keyof GuidanceValues>(key: K) =>
    (value: GuidanceValues[K]) =>
      setValues((v) => ({ ...v, [key]: value }));

  return (
    <EditorFrame
      meta={meta}
      initial={initial}
      values={values}
      labels={guidanceLabels}
      action={saveGuidance}
      notice={notice}
      source={{ value: values.source_url, onChange: set("source_url") }}
      recent={recent}
    >
      {(errors) => (
        <>
          <SectionCard id="basic" title="Basic information">
            <TextInput
              name="title"
              label="Title"
              required
              value={values.title}
              onChange={(title) =>
                setValues((v) => ({ ...v, title, slug: slugEdited ? v.slug : slugify(title) }))
              }
              error={errors.title}
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
                  ? `The page is at /guidance/${values.slug || "…"}. Changing this changes the link.`
                  : `Filled in from the title: /guidance/${values.slug || "…"}. You can change it.`
              }
            />
            <TextArea
              name="summary"
              label="Summary"
              rows={3}
              value={values.summary}
              onChange={set("summary")}
              error={errors.summary}
              hint="The opening line, shown on the list and under the title."
            />
            <TextInput
              name="sort_order"
              label="Order in the list"
              inputMode="numeric"
              maxLength={4}
              value={values.sort_order}
              onChange={set("sort_order")}
              error={errors.sort_order}
              hint="Lower numbers come first."
            />
          </SectionCard>

          <SectionCard id="article" title="Article text" description={bodyHint}>
            <TextArea
              name="body_markdown"
              label="Article text"
              rows={18}
              maxLength={BODY_MAX}
              value={values.body_markdown}
              onChange={set("body_markdown")}
              error={errors.body_markdown}
              hint={`${values.body_markdown.length.toLocaleString("en-GB")} of ${BODY_MAX.toLocaleString("en-GB")} characters.`}
            />
          </SectionCard>

          <UrduSection
            id="urdu"
            hasErrors={guidanceUrduKeys.some((k) => errors[k])}
            filled={guidanceUrduKeys.filter((k) => values[k].trim()).length}
          >
            <TextInput
              urdu
              name="title_ur"
              label="Title (Urdu)"
              value={values.title_ur}
              onChange={set("title_ur")}
              error={errors.title_ur}
              hint={values.title ? `English: ${values.title}` : undefined}
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
            <TextArea
              urdu
              name="body_markdown_ur"
              label="Article text (Urdu)"
              rows={18}
              maxLength={BODY_MAX}
              value={values.body_markdown_ur}
              onChange={set("body_markdown_ur")}
              error={errors.body_markdown_ur}
              hint="Same formatting as the English, with the headings in the same order."
            />
          </UrduSection>
        </>
      )}
    </EditorFrame>
  );
}
