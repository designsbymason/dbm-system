// The code shown under each story's "Show code" button on RatingInput's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default
// (`max={5}`, `precision={1}`, `hasError={false}`), fills handlers with no-ops, serializes an icon component as
// an object and freezes controlled state. Each snippet here is the smallest real usage of what its story shows —
// only exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

export const ratingInputSnippets = {
  allSizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<RatingInput aria-label="Rating" size="sm" />`,

  tones: `{/* tone: "brand" (default) | "highlight" | "warning" | "success" | "info" | "danger" */}
<RatingInput aria-label="Rating" tone="highlight" defaultValue={4} />`,

  halfSteps: `{/* precision: 1 (default) | 0.5 */}
<RatingInput aria-label="Rating" precision={0.5} defaultValue={3.5} />`,

  rounded: `{/* roundTo: 1 | 0.5. The stars snap (3.3 draws three and a half); the number and the text alternative stay 3.3. */}
<RatingInput aria-label="Average rating" readOnly value={3.3} roundTo={0.5} showValue />`,

  rightToLeft: `{/* dir: "ltr" (default) | "rtl". Left out, it follows the nearest DirectionProvider; it is not read from the page. */}
<RatingInput aria-label="Rating" dir="rtl" precision={0.5} defaultValue={3.5} />`,

  readOnly: `{/* An average: any value from 0 to max is drawn exactly. */}
<RatingInput aria-label="Average rating" readOnly value={4.3} />`,

  showValue: `{/* showValue writes the number before the icons, to one decimal; formatValue changes how. */}
<RatingInput aria-label="Rating" showValue defaultValue={3.5} precision={0.5} />`,

  reviewSummary: `{/* A review summary: the number before the icons, the count after them, and a link on the same row. */}
<RatingInput
  aria-label="Average rating"
  readOnly
  value={4.2}
  showValue
  count={124}
  suffix={<Link href="#reviews">Read reviews</Link>}
/>`,

  valueNames: `<RatingInput
  aria-label="Rating"
  valueNames={["Poor", "Fair", "Good", "Great", "Excellent"]}
  showValueName
/>`,

  clearable: `{/* Pressing the chosen value again, or Backspace, Delete or Escape, takes the rating back. */}
<RatingInput aria-label="Rating" clearable defaultValue={3} />`,

  customIcon: `{/* HeartIcon comes from @dbm-system/icons */}
<RatingInput aria-label="Rating" icon={HeartIcon} tone="danger" defaultValue={3} />`,

  inFormField: `<FormField label="How was it?" helperText="Choose a rating from 1 to 5." required>
  {(fieldProps) => <RatingInput {...fieldProps} name="rating" />}
</FormField>`,

  controlled: `{/* You own the value: const [rating, setRating] = useState(0); */}
<RatingInput aria-label="Rating" value={rating} onValueChange={setRating} />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface RatingInputPlaygroundSnippetArgs {
  max?: number;
  defaultValue?: number;
  precision?: number;
  roundTo?: unknown;
  dir?: string;
  size?: string;
  tone?: string;
  /** The icon component, or the name of the choice that stands for it. */
  icon?: unknown;
  readOnly?: boolean;
  clearable?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  required?: boolean;
  showValueName?: boolean;
  showValue?: boolean;
  count?: number;
  /** The link node, or the name of the choice that stands for it ("None", "Read reviews link"). */
  suffix?: unknown;
  name?: string;
  "aria-label"?: string;
}

const iconNames: Record<string, string> = { Heart: "HeartIcon", Thumb: "ThumbsUpIcon", Smiley: "SmileyIcon", Circle: "CircleIcon" };

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults. Also
 * serves the stories that just change a few args (error, disabled). A rating needs an accessible name, so the
 * `aria-label` is always written. A `mapping` control hands this the option key, not the icon, so both are accepted.
 */
export function ratingInputPlaygroundSnippet(args: RatingInputPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Rating"}"`];
  if (args.max !== undefined && args.max !== 5) attributes.push(`max={${args.max}}`);
  if (args.precision !== undefined && args.precision !== 1) attributes.push(`precision={${args.precision}}`);
  // `roundTo` arrives as the option key ("Exact", 1 or 0.5); "Exact" leaves the prop out.
  if (args.readOnly && (args.roundTo === 1 || args.roundTo === 0.5)) attributes.push(`roundTo={${args.roundTo}}`);
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.tone && args.tone !== "brand") attributes.push(`tone="${args.tone}"`);
  const iconName = typeof args.icon === "string" ? iconNames[args.icon] : undefined;
  if (iconName) attributes.push(`icon={${iconName}}`);
  if (args.defaultValue) attributes.push(`defaultValue={${args.defaultValue}}`);
  if (args.readOnly) attributes.push("readOnly");
  if (args.clearable && !args.readOnly) attributes.push("clearable");
  if (args.showValue) attributes.push("showValue");
  if (args.readOnly && args.count !== undefined) attributes.push(`count={${args.count}}`);
  // The control hands the option key; a story that passes the node itself is accepted too.
  if (args.readOnly && args.suffix && args.suffix !== "None") attributes.push('suffix={<Link href="#reviews">Read reviews</Link>}');
  if (args.showValueName) attributes.push('valueNames={["Poor", "Fair", "Good", "Great", "Excellent"]} showValueName');
  if (args.hasError) attributes.push("hasError");
  if (args.required) attributes.push("required");
  if (args.disabled) attributes.push("disabled");
  if (args.name) attributes.push(`name="${args.name}"`);
  const note = iconName ? `{/* ${iconName} comes from @dbm-system/icons */}\n` : "";
  return `${note}<RatingInput ${attributes.join(" ")} />`;
}
