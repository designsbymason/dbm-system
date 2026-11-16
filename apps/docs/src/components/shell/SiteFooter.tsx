import { Link } from "@dbm-system/components";
import { footerLinks } from "../../data/site";
import { Wordmark } from "../Wordmark";
import styles from "./SiteFooter.module.css";

/**
 * The site footer (guidelines/docs-site/02-structure.md §1): one compact row on `bg.brand-subtle`, in three columns. The
 * wordmark is at the start, the Accessibility, Privacy Policy and Terms of Use links are centred, and the copyright line is at
 * the end. Below `md` the three stack.
 */
export function SiteFooter() {
  return (
    <div className={styles.root}>
      <div className={`site-frame ${styles.row}`}>
        <Wordmark className={styles.logo} />
        <nav aria-label="About this site" className={styles.nav}>
          <ul className={styles.links}>
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} size="sm" underline="hover" className={styles.link}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.copyright}>DBM System © 2026 Designs By Mason</p>
      </div>
    </div>
  );
}
