import * as utils from "@dbm-system/utils";
import type * as utilTypes from "@dbm-system/utils";
import { describe, expect, expectTypeOf, it } from "vitest";
import * as library from "../index";
import type { Breakpoint, CodeBlockSize, Responsive, SpaceValue } from "../index";

// What a consumer who installs only `@dbm-system/components` can import from it.
describe("the components package's entry", () => {
  it("re-exports useRecentCommands, the same function the utils package defines", () => {
    expect(library.useRecentCommands).toBe(utils.useRecentCommands);
  });

  it("re-exports formatRelativeTime, the same function the utils package defines", () => {
    expect(library.formatRelativeTime).toBe(utils.formatRelativeTime);
  });

  it("re-exports usePersistentDismiss, the same function the utils package defines", () => {
    expect(library.usePersistentDismiss).toBe(utils.usePersistentDismiss);
  });

  // Checked by the typechecker (`tsc`), not at runtime: the entry names the very types `utils` defines.
  it("re-exports the helper types that components' public props use", () => {
    expectTypeOf<Breakpoint>().toEqualTypeOf<utilTypes.Breakpoint>();
    expectTypeOf<SpaceValue>().toEqualTypeOf<utilTypes.SpaceValue>();
    expectTypeOf<Responsive<number>>().toEqualTypeOf<utilTypes.Responsive<number>>();
  });

  // A component with a `size` names its steps in a type consumers can import, as every other one does.
  it("exports CodeBlock's size type", () => {
    expectTypeOf<CodeBlockSize>().toEqualTypeOf<"xs" | "sm" | "md" | "lg" | "xl">();
  });
});
