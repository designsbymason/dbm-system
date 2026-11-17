import { Card, Heading } from "@dbm-system/components";
import { ArtHowItIsBuilt, ArtWhatItIs, ArtWhatItNeeds } from "./SpecArt";
import styles from "./SpecCards.module.css";

export interface SpecGroup {
  title: string;
  art: "is" | "needs" | "built";
  rows: { term: string; detail: string }[];
}

const ART = { is: ArtWhatItIs, needs: ArtWhatItNeeds, built: ArtHowItIsBuilt } as const;

/**
 * The home page's specification: three cards in a row (stacked on a phone), each with a drawing in shades of the brand colour at its top and
 * a short list of facts. The facts arrive as props, read from the packages at build; the page renders on the server with no script.
 */
export function SpecCards({ groups }: { groups: SpecGroup[] }) {
  return (
    <div className={styles.cards}>
      {groups.map((group) => {
        const Art = ART[group.art];
        return (
          <Card key={group.title} variant="outlined" className={styles.card}>
            <Card.Media className={styles.media}>
              <Art />
            </Card.Media>
            <Card.Header>
              <Heading level={3} size="lg">
                {group.title}
              </Heading>
            </Card.Header>
            <Card.Body>
              <dl className={styles.list}>
                {group.rows.map((row) => (
                  <div key={row.term} className={styles.row}>
                    <dt>{row.term}</dt>
                    <dd>{row.detail}</dd>
                  </div>
                ))}
              </dl>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
}
