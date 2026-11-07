import { ProgressBar } from "../atoms/ProgressBar";
import { VisuallyHidden } from "../atoms/VisuallyHidden";

/**
 * What a shell's `<main>` draws while it is loading (`busy`): a thin bar along its top edge, hidden from assistive technology, and a polite
 * status region that says the label while `busy` and is empty otherwise. The region is there before it has anything to say, so that
 * "Loading" is a change a screen reader announces and not a first appearance; it is drawn whenever `busy` is given at all. The shell's
 * own stylesheet places the bar (`barClassName`): `AppShell` keeps it stuck under its header, `PageShell` along the top of the main area.
 */
export function MainBusy({ busy, label, barClassName }: { busy: boolean | undefined; label: string | undefined; barClassName: string | undefined }) {
  return (
    <>
      {busy && (
        <div className={barClassName} aria-hidden="true">
          <ProgressBar size="xs" tone="brand" label={label} />
        </div>
      )}
      {busy !== undefined && <VisuallyHidden role="status">{busy ? (label ?? "") : ""}</VisuallyHidden>}
    </>
  );
}
