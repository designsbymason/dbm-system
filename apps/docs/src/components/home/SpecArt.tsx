import styles from "./SpecCards.module.css";

/*
 * The illustrations at the top of the specification cards (ADR-0217: geometric drawings in code, from the tokens). Each is drawn in shades of
 * the brand colour only, so it follows the theme and light and dark. They are pictures: hidden from assistive technology, with no text of
 * their own to read.
 */

/** A rhombus plate seen from above at the true isometric angle, with the two faces of its edge. `cy` is the plate's centre. */
function Plate({ cy, top, left, right }: { cy: number; top: string; left: string; right: string }) {
  const w = 95;
  const h = 55;
  const t = 9;
  return (
    <g transform={`translate(180 ${cy})`}>
      <path d={`M${-w} 0 L0 ${h} L0 ${h + t} L${-w} ${t} Z`} className={left} />
      <path d={`M${w} 0 L0 ${h} L0 ${h + t} L${w} ${t} Z`} className={right} />
      <path d={`M0 ${-h} L${w} 0 L0 ${h} L${-w} 0 Z`} className={top} />
    </g>
  );
}

/** What it is: layers of a system (tokens, components, shells), with a button, a switch and a line of text drawn on the top plate. */
export function ArtWhatItIs() {
  return (
    <svg viewBox="0 0 360 176" role="presentation" aria-hidden="true" focusable="false" className={styles.art}>
      <Plate cy={106} top={styles.c2 ?? ""} left={styles.c4 ?? ""} right={styles.c5 ?? ""} />
      <Plate cy={80} top={styles.c1 ?? ""} left={styles.c3 ?? ""} right={styles.c4 ?? ""} />
      <Plate cy={54} top={styles.c0 ?? ""} left={styles.c2 ?? ""} right={styles.c3 ?? ""} />
      {/* The top plate's surface, drawn flat and laid down in the same projection. */}
      <g transform="translate(180 54) matrix(0.866 0.5 -0.866 0.5 0 0)">
        <rect x={-38} y={-30} width={46} height={17} rx={8.5} className={styles.c4} />
        <rect x={-38} y={-5} width={30} height={15} rx={7.5} className={styles.c3} />
        <circle cx={-15.5} cy={2.5} r={5.5} className={styles.c0} />
        <rect x={-38} y={18} width={62} height={5} rx={2.5} className={styles.c2} />
        <rect x={-38} y={28} width={40} height={5} rx={2.5} className={styles.c1} />
        <rect x={14} y={-30} width={24} height={36} rx={5} className={styles.line} />
      </g>
    </svg>
  );
}

/** What it needs: a hub with three things it leans on, joined by dashed lines, each end marked with a small port. */
export function ArtWhatItNeeds() {
  return (
    <svg viewBox="0 0 360 176" role="presentation" aria-hidden="true" focusable="false" className={styles.art}>
      <g className={styles.link}>
        <path d="M180 88 L84 44" />
        <path d="M180 88 L84 132" />
        <path d="M180 88 L282 88" />
      </g>
      {/* The hub: concentric rings in four shades. */}
      <circle cx={180} cy={88} r={34} className={styles.c1} />
      <circle cx={180} cy={88} r={26} className={styles.c3} />
      <circle cx={180} cy={88} r={17} className={styles.c4} />
      <circle cx={180} cy={88} r={7} className={styles.c0} />
      {/* Two things it uses, as a pair of hexagons, and a page, for its licence. */}
      <path d="M84 24 L101 34 L101 54 L84 64 L67 54 L67 34 Z" className={styles.c4} />
      <path d="M84 36 L93 41 L93 51 L84 56 L75 51 L75 41 Z" className={styles.c0} />
      <path d="M84 112 L101 122 L101 142 L84 152 L67 142 L67 122 Z" className={styles.c3} />
      <path d="M84 124 L93 129 L93 139 L84 144 L75 139 L75 129 Z" className={styles.c1} />
      <rect x={262} y={58} width={44} height={60} rx={6} className={styles.c2} />
      <rect x={262} y={58} width={44} height={60} rx={6} className={styles.line} />
      <rect x={270} y={70} width={28} height={5} rx={2.5} className={styles.c4} />
      <rect x={270} y={81} width={22} height={5} rx={2.5} className={styles.c3} />
      <rect x={270} y={92} width={26} height={5} rx={2.5} className={styles.c3} />
      <circle cx={288} cy={108} r={5} className={styles.c5} />
    </svg>
  );
}

/** How it is built: a key press, a button wearing a focus ring (accessibility), and a block of structured text (for agents), side by side. */
export function ArtHowItIsBuilt() {
  return (
    <svg viewBox="0 0 360 176" role="presentation" aria-hidden="true" focusable="false" className={styles.art}>
      {/* The three parts run from x 30 to 356; they are shifted left so the margins on both sides are equal. */}
      <g transform="translate(-13 0)">
      {/* A key: the keyboard. */}
      <rect x={30} y={62} width={64} height={56} rx={10} className={styles.c3} />
      <rect x={34} y={64} width={56} height={46} rx={8} className={styles.c0} />
      <rect x={34} y={64} width={56} height={46} rx={8} className={styles.line} />
      <rect x={46} y={80} width={32} height={6} rx={3} className={styles.c4} />
      <rect x={52} y={92} width={20} height={6} rx={3} className={styles.c2} />
      {/* A button with a focus ring set off from it, and a tick for the check. */}
      <rect x={116} y={63} width={116} height={50} rx={14} className={styles.ring} />
      <rect x={124} y={71} width={100} height={34} rx={10} className={styles.c4} />
      <rect x={140} y={85} width={68} height={6} rx={3} className={styles.c0} />
      <circle cx={226} cy={64} r={13} className={styles.c5} />
      <path d="M219 64 L224 69 L233 59" className={styles.tick} />
      {/* Structured text: a pair of braces round three lines, the shape an agent reads. */}
      <path d="M262 58 C252 58 254 66 254 74 C254 82 250 88 246 88 C250 88 254 94 254 102 C254 110 252 118 262 118" className={styles.brace} />
      <path d="M338 58 C348 58 346 66 346 74 C346 82 350 88 354 88 C350 88 346 94 346 102 C346 110 348 118 338 118" className={styles.brace} />
      <rect x={268} y={68} width={56} height={6} rx={3} className={styles.c3} />
      <rect x={276} y={82} width={44} height={6} rx={3} className={styles.c4} />
      <rect x={276} y={96} width={52} height={6} rx={3} className={styles.c2} />
      <rect x={268} y={110} width={32} height={6} rx={3} className={styles.c1} />
      </g>
    </svg>
  );
}
