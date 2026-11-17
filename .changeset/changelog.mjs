// The changelog formatter (ADR-0176): Changesets' own, except that it writes nothing for a dependency update. The four public packages are
// versioned together, so every release "updates" the three the components package depends on, and the default formatter would list each of
// them under Patch Changes in every release. What a release changed is written by hand in its changesets; the dependency lines say nothing.
import defaultChangelog from "@changesets/cli/changelog";

export default {
  getReleaseLine: defaultChangelog.getReleaseLine,
  getDependencyReleaseLine: async () => "",
};
