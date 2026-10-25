import { ChevronDown } from "lucide-react";
import { ErrorText, Field, checkboxClass, fieldClass } from "@/components/ui/Field";

/**
 * Inputs for the content editors: each one a labelled Input/Field (Figma
 * 4:182) with its error or hint linked by aria-describedby. Values are
 * controlled by the editor, which sends them to the server as one object.
 */

/** "programmes.0.name" → "f-programmes-0-name": the input's id, also the error summary's link. */
export const fieldId = (key: string) => `f-${key.replace(/\./g, "-")}`;

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

type Common = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** An Urdu field: typed right to left, in the Nastaliq font. */
  urdu?: boolean;
};

const urduInput = { dir: "rtl", lang: "ur" } as const;
const urduClass = "font-urdu text-[16px] leading-[2.2]";

const labelFor = (label: string, required?: boolean) => (required ? `${label} (required)` : label);

export function TextInput({
  name,
  label,
  error,
  hint,
  required,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  maxLength = 200,
  urdu,
}: Common & {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "url" | "date";
  inputMode?: "numeric" | "url";
  placeholder?: string;
  maxLength?: number;
}) {
  const id = fieldId(name);
  return (
    <Field id={id} label={labelFor(label, required)} error={error} hint={hint}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={type === "date" ? undefined : maxLength}
        aria-required={required || undefined}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        {...(urdu ? urduInput : {})}
        className={`${fieldClass} ${urdu ? `${urduClass} min-h-12` : "h-12"}`}
      />
    </Field>
  );
}

export function TextArea({
  name,
  label,
  error,
  hint,
  required,
  value,
  onChange,
  rows = 4,
  placeholder,
  maxLength = 5000,
  urdu,
}: Common & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  const id = fieldId(name);
  return (
    <Field id={id} label={labelFor(label, required)} error={error} hint={hint}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-required={required || undefined}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        {...(urdu ? urduInput : {})}
        className={`${fieldClass} resize-y py-3 ${urdu ? urduClass : ""}`}
      />
    </Field>
  );
}

export function SelectInput({
  name,
  label,
  error,
  hint,
  required,
  value,
  onChange,
  options,
}: Common & {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = fieldId(name);
  return (
    <Field id={id} label={labelFor(label, required)} error={error} hint={hint}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-required={required || undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, error, hint)}
          className={`${fieldClass} h-12 cursor-pointer appearance-none pr-11`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-5 -translate-y-1/2"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}

/** Check/Item: a yes-or-no setting with an optional line of help under it. */
export function CheckboxInput({
  name,
  label,
  hint,
  error,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = fieldId(name);
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        className={`${checkboxClass} mt-0.5 size-6 rounded-[7px]`}
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="cursor-pointer text-label-m">
          {label}
        </label>
        {hint && !error && (
          <p id={`${id}-hint`} className="text-caption text-muted">
            {hint}
          </p>
        )}
        {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
      </div>
    </div>
  );
}

/** Segmented (Figma 4:176) as radio buttons: one choice from a few, e.g. Public or Private. */
export function RadioSegments<T extends string>({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: T | "";
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-label-m">{label}</legend>
      <div className="flex gap-1 rounded-pill bg-blush p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-pill px-2 py-2.5 text-label-m text-muted has-checked:bg-card has-checked:text-charcoal has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-deep-rose"
          >
            <input
              type="radio"
              name={fieldId(name)}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A white card with a serif H2, holding one group of fields (Figma "Basic information"). */
export function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-[20px] border border-border-soft bg-card p-5 lg:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-h3">
          {title}
        </h2>
        {description && <p className="text-body-s text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Two fields side by side from tablet width up. */
export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/**
 * The Urdu versions of a section's text, collapsed until someone needs them.
 * It opens by itself when one of its fields has an error, so the error
 * summary's links land on a visible field.
 */
export function UrduSection({
  id,
  hasErrors,
  filled,
  children,
}: {
  id: string;
  hasErrors: boolean;
  /** How many of its fields have Urdu, shown on the closed section. */
  filled: number;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      open={hasErrors || undefined}
      className="group rounded-[20px] border border-border-soft bg-card p-5 lg:p-6"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col gap-1">
          <span className="text-h3">
            Urdu{" "}
            <span lang="ur" dir="rtl" className="font-urdu text-[16px] font-normal">
              اردو
            </span>
          </span>
          <span className="text-body-s text-muted">
            Optional. {filled > 0 ? `${filled} filled in.` : "Nothing filled in yet."} Leave a box empty and
            the Urdu page shows the English, with a note. Names stay in English.
          </span>
        </span>
        <ChevronDown
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </summary>
      <div className="flex flex-col gap-4 pt-4">{children}</div>
    </details>
  );
}
