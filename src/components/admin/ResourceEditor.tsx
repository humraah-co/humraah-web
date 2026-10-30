"use client";

import { useState } from "react";
import { saveResource } from "@/app/admin/(portal)/resources/actions";
import { EditorFrame, type EditorMeta } from "@/components/admin/EditorFrame";
import { SectionCard, SelectInput, TextArea, TextInput, UrduSection } from "@/components/admin/EditorParts";
import {
  resourceCategoryLabels,
  resourceLabels,
  resourceUrduKeys,
  type ResourceValues,
} from "@/lib/admin/siteContent";
import type { ResourceCategory } from "@/lib/database.types";

const categoryOptions = [
  { value: "", label: "Choose one" },
  ...(Object.entries(resourceCategoryLabels) as [ResourceCategory, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

/** Add or edit a link on the Resources page. Same layout as the other editors (Figma 36:3943). */
export function ResourceEditor({
  meta,
  initial,
  notice,
  recent,
}: {
  meta: EditorMeta;
  initial: ResourceValues;
  notice?: { text: string; tone: "success" | "problem" };
  recent?: React.ReactNode;
}) {
  const [values, setValues] = useState(initial);
  const set =
    <K extends keyof ResourceValues>(key: K) =>
    (value: ResourceValues[K]) =>
      setValues((v) => ({ ...v, [key]: value }));

  return (
    <EditorFrame
      meta={meta}
      initial={initial}
      values={values}
      labels={resourceLabels}
      action={saveResource}
      notice={notice}
      source={{ value: values.source_url, onChange: set("source_url") }}
      recent={recent}
    >
      {(errors) => (
        <>
          <SectionCard id="basic" title="The link">
            <TextInput
              name="title"
              label="Title"
              required
              value={values.title}
              onChange={set("title")}
              error={errors.title}
            />
            <TextInput
              name="url"
              label="Link"
              required
              type="url"
              inputMode="url"
              placeholder="https://"
              maxLength={500}
              value={values.url}
              onChange={set("url")}
              error={errors.url}
              hint="The page people open. https:// is added if you leave it out."
            />
            <TextArea
              name="description"
              label="Description"
              rows={3}
              maxLength={400}
              value={values.description}
              onChange={set("description")}
              error={errors.description}
              hint="One plain sentence on what they will find there."
            />
          </SectionCard>

          <SectionCard id="placement" title="Where it shows">
            <SelectInput
              name="category"
              label="Group on the page"
              required
              value={values.category}
              onChange={(category) => set("category")(category as ResourceValues["category"])}
              options={categoryOptions}
              error={errors.category}
            />
            <TextInput
              name="sort_order"
              label="Order in its group"
              inputMode="numeric"
              maxLength={4}
              value={values.sort_order}
              onChange={set("sort_order")}
              error={errors.sort_order}
              hint="Lower numbers come first."
            />
          </SectionCard>

          <UrduSection
            id="urdu"
            hasErrors={resourceUrduKeys.some((k) => errors[k])}
            filled={resourceUrduKeys.filter((k) => values[k].trim()).length}
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
              name="description_ur"
              label="Description (Urdu)"
              rows={3}
              maxLength={400}
              value={values.description_ur}
              onChange={set("description_ur")}
              error={errors.description_ur}
            />
          </UrduSection>
        </>
      )}
    </EditorFrame>
  );
}
