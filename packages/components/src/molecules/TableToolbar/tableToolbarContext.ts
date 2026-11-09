import { createContext } from "react";
import type { TableToolbarSize } from "./TableToolbar.types";

/** What the parts read from the bar they sit in: the size they use unless they say their own. */
export const TableToolbarContext = createContext<{ size: TableToolbarSize }>({ size: "md" });
