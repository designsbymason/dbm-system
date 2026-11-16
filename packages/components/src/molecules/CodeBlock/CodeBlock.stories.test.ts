import { describe, expect, it } from "vitest";

describe("CodeBlock's stories module", () => {
  // The hidden interaction stories use the test browser's own protocol (`browserProtocol.js`), whose package
  // throws when it is evaluated anywhere but the test runner. If the stories module pulled it in at load time, a real
  // Storybook could not load any CodeBlock story or its Docs page, while every test run stayed green — found only by
  // opening the Docs page. Loading the module here, outside a browser test, is the same failure.
  it("loads without evaluating the test runner's browser module", async () => {
    const stories = await import("./CodeBlock.stories");
    expect(stories.default.title).toBe("Components/CodeBlock");
    expect(stories.Playground).toBeDefined();
    // The checks are the file that uses the protocol, so it is the one that must not evaluate it at load.
    const checks = await import("./CodeBlock.checks.stories");
    expect(checks.default.title).toBe("Components/CodeBlock/Checks");
    expect(checks.default.tags).toContain("!dev");
    expect(checks.PrintInteraction).toBeDefined();
  });
});
