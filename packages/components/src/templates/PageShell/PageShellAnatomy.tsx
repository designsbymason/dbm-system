import type { ReactNode } from "react";
import styles from "./PageShellAnatomy.module.css";

// Docs only (not exported from the package): the anatomy of a `PageShell` page on PageShell.mdx, drawn as nested boxes so it follows the theme.

const join = (...names: Array<string | undefined>) => names.filter(Boolean).join(" ");

/** A part's name and, beside it, a note on what it does. */
function Head({ name, note }: { name: string; note?: ReactNode }) {
  return (
    <p className={styles.head}>
      <code className={styles.name}>{name}</code>
      {note !== undefined && <span className={styles.note}>{note}</span>}
    </p>
  );
}

/** One box: the part's head, then whatever it holds. */
function Part({ name, note, className, children }: { name: string; note?: ReactNode; className?: string; children?: ReactNode }) {
  return (
    <div className={join(styles.box, className)}>
      <Head name={name} note={note} />
      {children}
    </div>
  );
}

/** The chrome every page has above its content: the skip link, an optional banner and the app's header. */
function Chrome() {
  return (
    <>
      <div className={styles.chips}>
        <code className={join(styles.name, styles.chip)}>PageShell.SkipLink</code>
        <code className={join(styles.name, styles.chip)}>PageShell.Banner</code>
      </div>
      <Part name="Navbar" note="or your own header: a direct child, it sticks itself" className={styles.chrome} />
    </>
  );
}

/** The frame, the chrome and the footer around one layout. */
function Layout({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className={styles.diagram}>
      <p className={styles.lead}>
        <strong>{title}:</strong> {lead}
      </p>
      <Part name="PageShell" note="the frame: as tall as the window" className={styles.frame}>
        <Chrome />
        {children}
        <Part name="PageShell.Footer" note="the contentinfo; at the window's bottom on a short page" className={styles.chrome} />
      </Part>
    </div>
  );
}

/**
 * The anatomy of a page: two layouts, one to a row (a page with no aside, and a page with an aside), each part drawn inside the one that holds it, with
 * a note on its width. Read it from the outside in.
 */
export function PageShellAnatomy() {
  return (
    <figure className={styles.figure} aria-label="Anatomy of a PageShell page: each part drawn inside the part that holds it">
      <div className={styles.diagrams}>
        <Layout title="A page with no aside" lead="Main is as wide as the window. Write Content sections inside it, contained, full width or bleed, in any order.">
          <Part name="PageShell.Main" note="the one <main>, as wide as the window" className={join(styles.main, styles.flush)}>
            <Part name={'PageShell.Content width="full"'} note="no width limit: edge to edge, and so is its content" className={join(styles.band, styles.plain)} />
            <div className={join(styles.box, styles.band, styles.bleed)}>
              <div className={styles.inner}>
                <Head name="PageShell.Content bleed" note="a band edge to edge, with its content kept to the page's width and lined up with the content below" />
              </div>
            </div>
            <Part name="PageShell.Content" note="the page's own box, holding your page: its width and padding" className={styles.content} />
          </Part>
        </Layout>
        <Layout title="A page with an aside" lead="Body is the page's width. Main and Aside sit in it side by side, in the order written.">
          <Part name="PageShell.Body" note="the page's width and padding, a row" className={styles.body}>
            <div className={styles.row}>
              <Part name="PageShell.Aside" note="written first, so at the start" className={styles.aside} />
              <Part
                name="PageShell.Main"
                note={
                  <>
                    your page directly, with no Content, and a <code className={join(styles.name, styles.chip, styles.chipInfo)}>PageShell.AsideToggle</code>{" "}
                    among its actions
                  </>
                }
                className={join(styles.main, styles.grow)}
              />
              <Part name="PageShell.Aside" note="written last, so at the end" className={styles.aside} />
            </div>
          </Part>
        </Layout>
      </div>
      <ul className={styles.legend} aria-label="Colour key">
        <li>
          <span className={join(styles.swatch, styles.swatchBrand)} aria-hidden="true" />
          the page itself
        </li>
        <li>
          <span className={join(styles.swatch, styles.swatchSuccess)} aria-hidden="true" />
          Content with bleed
        </li>
        <li>
          <span className={join(styles.swatch, styles.swatchWarning)} aria-hidden="true" />
          Content with width full
        </li>
        <li>
          <span className={join(styles.swatch, styles.swatchInfo)} aria-hidden="true" />
          an aside and its toggle
        </li>
        <li>
          <span className={styles.swatch} aria-hidden="true" />
          {"the frame's chrome"}
        </li>
        <li>
          <span className={join(styles.swatch, styles.swatchLayout)} aria-hidden="true" />
          layout only, no landmark
        </li>
      </ul>
    </figure>
  );
}
