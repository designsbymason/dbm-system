import { describe, expect, it } from "vitest";
import { stepperPlaygroundSnippet } from "./Stepper.snippets";

describe("the Playground's snippet", () => {
  it("writes only what differs from the defaults", () => {
    const snippet = stepperPlaygroundSnippet({ size: "md", variant: "filled", tone: "brand", rounded: true, compact: "never" });
    expect(snippet).toMatch(/^<Stepper defaultValue="shipping">/);
  });

  it("starts on the step the Playground starts on", () => {
    expect(stepperPlaygroundSnippet({ defaultValue: "payment" })).toContain('defaultValue="payment"');
    expect(stepperPlaygroundSnippet({ defaultValue: "" })).toContain('defaultValue="shipping"');
  });

  it("writes the options that are set, and the centred alignment only where it applies", () => {
    const snippet = stepperPlaygroundSnippet({
      colorful: true,
      showLabels: false,
      rounded: false,
      connector: "dashed",
      compact: "auto",
      labelAlignment: "center",
      interactive: "completed",
    });
    for (const part of ["colorful", "showLabels={false}", "rounded={false}", 'connector="dashed"', 'compact="auto"', 'labelAlignment="center"', 'interactive="completed"']) {
      expect(snippet).toContain(part);
    }
    expect(stepperPlaygroundSnippet({ labelAlignment: "center" })).not.toContain("labelAlignment");
    expect(stepperPlaygroundSnippet({ labelAlignment: "center", compact: "always", orientation: "vertical" })).not.toContain("labelAlignment");
  });

  it("leaves the label placement out of a vertical stepper", () => {
    expect(stepperPlaygroundSnippet({ labelPlacement: "bottom", orientation: "vertical" })).not.toContain("labelPlacement");
  });
});
