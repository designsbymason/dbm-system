import { Button } from "@dbm-system/components";
import { MagnifyingGlassIcon } from "@dbm-system/icons";

/**
 * A button that opens the header's search, for a page that wants to offer it in its body (the 404). There is one palette
 * on the page, so its ⌘K shortcut is registered once; this only presses the header's own trigger.
 */
export function OpenSearchButton({ children }: { children: string }) {
  return (
    <Button leadingIcon={MagnifyingGlassIcon} onClick={() => document.querySelector<HTMLButtonElement>("[data-site-search]")?.click()}>
      {children}
    </Button>
  );
}
