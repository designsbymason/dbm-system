import {
  ArrowBendDownLeftIcon,
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  CalendarBlankIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DotsThreeIcon,
  EyeIcon,
  ImageIcon,
  InfoIcon,
  ListIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  NoteIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  WarningCircleIcon,
  WarningIcon,
  WarningOctagonIcon,
  XIcon,
} from "@dbm-system/icons";
import type { Icon as PhosphorIcon, IconWeight } from "@dbm-system/icons";
import { useState } from "react";
import { Button } from "../../src/atoms/Button";
import { Icon } from "../../src/atoms/Icon";
import { VisuallyHidden } from "../../src/atoms/VisuallyHidden";
import { ToggleGroup } from "../../src/molecules/ToggleGroup";

const WEIGHTS: IconWeight[] = ["thin", "light", "regular", "bold", "fill", "duotone"];

const PHOSPHOR_URL = "https://phosphoricons.com";

/**
 * The 35 icons the components themselves import the most, most used first. Counted as the number of component source
 * files (not stories, tests, snippets or the Storybook demo kits) that import the icon from `@dbm-system/icons`; the
 * last seven are tied at one file each and are in alphabetical order. A snapshot, not read live: recount it when a
 * component starts using an icon that is not here and belongs in the top 35. Importing these 35 by name keeps the rest
 * of the icon set out of the Storybook bundle.
 */
const MOST_USED: [string, PhosphorIcon][] = [
  ["XIcon", XIcon],
  ["CaretDownIcon", CaretDownIcon],
  ["CaretRightIcon", CaretRightIcon],
  ["CaretLeftIcon", CaretLeftIcon],
  ["CheckIcon", CheckIcon],
  ["CaretUpIcon", CaretUpIcon],
  ["WarningIcon", WarningIcon],
  ["MinusIcon", MinusIcon],
  ["ArrowSquareOutIcon", ArrowSquareOutIcon],
  ["DotsThreeIcon", DotsThreeIcon],
  ["CheckCircleIcon", CheckCircleIcon],
  ["InfoIcon", InfoIcon],
  ["MagnifyingGlassIcon", MagnifyingGlassIcon],
  ["NoteIcon", NoteIcon],
  ["WarningCircleIcon", WarningCircleIcon],
  ["WarningOctagonIcon", WarningOctagonIcon],
  ["ArrowClockwiseIcon", ArrowClockwiseIcon],
  ["ArrowUpIcon", ArrowUpIcon],
  ["CalendarBlankIcon", CalendarBlankIcon],
  ["CaretUpDownIcon", CaretUpDownIcon],
  ["ClockIcon", ClockIcon],
  ["CopyIcon", CopyIcon],
  ["EyeIcon", EyeIcon],
  ["ImageIcon", ImageIcon],
  ["ListIcon", ListIcon],
  ["PauseIcon", PauseIcon],
  ["PlayIcon", PlayIcon],
  ["PlusIcon", PlusIcon],
  ["ArrowBendDownLeftIcon", ArrowBendDownLeftIcon],
  ["ArrowCounterClockwiseIcon", ArrowCounterClockwiseIcon],
  ["ArrowDownIcon", ArrowDownIcon],
  ["ArrowLeftIcon", ArrowLeftIcon],
  ["ArrowRightIcon", ArrowRightIcon],
  ["CaretDoubleLeftIcon", CaretDoubleLeftIcon],
  ["CaretDoubleRightIcon", CaretDoubleRightIcon],
];

/**
 * Docs-page-only gallery of the icons the components use most, in equal square tiles, drawn with the real `Icon` atom
 * so a weight is shown exactly as a component would show it. A press copies the import line. A button opens the full
 * Phosphor set in a new tab. Not part of the published package.
 */
export function IconGallery() {
  const [weight, setWeight] = useState<IconWeight>("bold");
  const [copied, setCopied] = useState("");

  const copy = (name: string) => {
    const line = `import { ${name} } from "@dbm-system/icons";`;
    navigator.clipboard
      .writeText(line)
      .then(() => setCopied(`Copied ${name}`))
      .catch(() => setCopied(line));
  };

  return (
    <div className="dbm-icon-gallery sb-unstyled">
      <div className="dbm-icon-gallery__controls">
        <ToggleGroup
          aria-label="Icon weight"
          type="single"
          size="sm"
          attached={false}
          value={weight}
          onValueChange={(next) => {
            if (next) setWeight(next as IconWeight);
          }}
        >
          {WEIGHTS.map((name) => (
            <ToggleGroup.Item key={name} value={name}>
              {name}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
      </div>
      <p className="dbm-icon-gallery__status" role="status">
        {copied !== "" ? `${copied}. ` : ""}Press an icon to copy its import.
      </p>
      <ul className="dbm-icon-gallery__grid">
        {MOST_USED.map(([name, glyph]) => (
          <li key={name}>
            <button className="dbm-icon-gallery__cell" onClick={() => copy(name)} type="button">
              <Icon icon={glyph} size="xl" tone="default" weight={weight} />
              <span className="dbm-icon-gallery__name">{name}</span>
            </button>
          </li>
        ))}
      </ul>
      <Button asChild variant="secondary">
        <a href={PHOSPHOR_URL} target="_blank" rel="noopener noreferrer">
          Browse all icons on Phosphor
          <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
          <Icon icon={ArrowSquareOutIcon} size="sm" />
        </a>
      </Button>
    </div>
  );
}
