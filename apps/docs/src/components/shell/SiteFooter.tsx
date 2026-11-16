import { Link } from "@dbm-system/components";
import { footerColumns, hrefOf } from "../../data/site";
import { LogoMark } from "../LogoMark";
import styles from "./SiteFooter.module.css";

/** The site footer: Docs, Components, Resources and Project, then the licence line (02-structure.md §1). */
export function SiteFooter() {
  return (
    <div className={`site-frame ${styles.footer}`}>
      <div className={styles.columns}>
        {footerColumns.map((column) => (
          <nav key={column.label} aria-labelledby={`footer-${column.label}`} className={styles.column}>
            <h2 id={`footer-${column.label}`} className={styles.heading}>
              {column.label}
            </h2>
            <ul className={styles.links}>
              {column.links.map((link) => {
                const href = hrefOf(link);
                return (
                  href && (
                    <li key={link.href}>
                      <Link href={href} size="sm" underline="hover">
                        {link.label}
                      </Link>
                    </li>
                  )
                );
              })}
            </ul>
          </nav>
        ))}
      </div>
      <div className={styles.base}>
        <LogoMark className={styles.logo} title="dbM" />
        <p className={styles.line}>
          DBM System is open source under the MIT licence. The fonts keep their own licence (SIL Open Font License).
        </p>
      </div>
    </div>
  );
}
