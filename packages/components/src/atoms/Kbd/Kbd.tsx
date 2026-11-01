import { cx } from "@dbm-system/utils";
import { Fragment, forwardRef, useEffect } from "react";
import { useIsApplePlatform } from "../../internal/hotkey/hotkey";
import {
  drawnShortcutKeys,
  shortcutSpokenName,
} from "../../internal/hotkey/shortcutKeys";
import { warnOnce } from "../../internal/warnOnce";
import styles from "./Kbd.module.css";
import type { KbdProps } from "./Kbd.types";

/**
 * A keyboard shortcut or key name, styled like a physical keycap. Compose
 * multiple for a chord (e.g. `<Kbd>⌘</Kbd> + <Kbd>K</Kbd>`), or give `keys` a
 * combination written with `mod` (`<Kbd keys="mod+k" />`) to have the chord
 * drawn for the platform: ⌘ K on an Apple platform, Ctrl + K elsewhere.
 *
 * Unlike `Code`, `Kbd`'s font size is fixed rather than inherited from its
 * surrounding context — a keycap should read as a consistent, compact
 * visual regardless of where it appears, the same way a physical key
 * doesn't change size depending on the sentence around it.
 *
 * For symbol-only content (`⌘`, `⇧`, `⌥`, `⌃`), pass `aria-label` with a
 * plain-language name — see the `aria-label` prop's own doc. `keys` names
 * its symbols itself ("Command K").
 *
 * @example
 * ```tsx
 * <Kbd>Esc</Kbd>
 * <Kbd keys="mod+shift+p" />
 * <Text as="span"><Kbd aria-label="Command">⌘</Kbd> + <Kbd>K</Kbd> to open the command palette</Text>
 * ```
 */
export const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, keys, children, ...props }, ref) => {
    const apple = useIsApplePlatform();
    const hasKeys =
      keys !== undefined &&
      keys !== "" &&
      !(Array.isArray(keys) && keys.length === 0);
    const both =
      hasKeys &&
      children !== undefined &&
      children !== null &&
      children !== false;
    useEffect(() => {
      if (both)
        warnOnce(
          "Kbd: `keys` and `children` were both given, so `children` is ignored. Use one: `keys` for a combination drawn for the platform, `children` for a key you spell yourself.",
        );
    }, [both]);
    if (!hasKeys)
      return (
        <kbd ref={ref} className={cx(styles.root, className)} {...props}>
          {children}
        </kbd>
      );
    const drawn = drawnShortcutKeys(keys, apple);
    return (
      // One keycap per key inside a group that carries the name (an image, since its keycaps are hidden and a bare `kbd` can't be
      // named), since a screen reader reading each symbol would say "⌘".
      <kbd
        ref={ref}
        className={cx(styles.group, className)}
        {...props}
        role="img"
        aria-label={props["aria-label"] ?? shortcutSpokenName(drawn)}
      >
        {drawn.map((key, index) => (
          <Fragment key={index}>
            {!apple && index > 0 && (
              <span className={styles.plus} aria-hidden="true">
                +
              </span>
            )}
            <kbd className={styles.root} aria-hidden="true">
              {key.text}
            </kbd>
          </Fragment>
        ))}
      </kbd>
    );
  },
);

Kbd.displayName = "Kbd";
