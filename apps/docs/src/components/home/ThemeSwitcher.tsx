import { ToggleGroup } from "@dbm-system/components";
import { useEffect, useState } from "react";
import styles from "./ThemeSwitcher.module.css";

const cap = (word: string) => word[0].toUpperCase() + word.slice(1);

/**
 * The brand and mode controls for the theming section where its scroll-driven step-through does not run (a phone, a tablet, reduced
 * motion, a browser without scroll timelines): they show one composition at a time and mark the readout row that matches. The
 * section itself holds all four copies, so with no script every one shows. The scroll version hides these controls in CSS.
 */
export function ThemeSwitcher({ themes, brands, modes }: { themes: string[]; brands: string[]; modes: string[] }) {
  const [brand, setBrand] = useState(brands[0]);
  const [mode, setMode] = useState(modes[0]);

  useEffect(() => {
    const picked = `${brand}-${mode}`;
    const section = document.querySelector<HTMLElement>("[data-themes]");
    if (!section) return;
    section.dataset.picked = picked;
    for (const el of section.querySelectorAll<HTMLElement>("[data-theme-key]")) {
      if (el.dataset.themeKey === picked) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    }
    return () => {
      delete section.dataset.picked;
    };
  }, [brand, mode, themes]);

  return (
    <div className={styles.controls} data-themes-controls>
      <div className={styles.group}>
        <span id="themes-brand-label" className={styles.label}>
          Brand
        </span>
        <ToggleGroup
          type="single"
          attached
          size="sm"
          aria-labelledby="themes-brand-label"
          value={brand}
          onValueChange={(next) => next && setBrand(next as string)}
        >
          {brands.map((name) => (
            <ToggleGroup.Item key={name} value={name}>
              {cap(name)}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
      </div>
      <div className={styles.group}>
        <span id="themes-mode-label" className={styles.label}>
          Mode
        </span>
        <ToggleGroup
          type="single"
          attached
          size="sm"
          aria-labelledby="themes-mode-label"
          value={mode}
          onValueChange={(next) => next && setMode(next as string)}
        >
          {modes.map((name) => (
            <ToggleGroup.Item key={name} value={name}>
              {cap(name)}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
