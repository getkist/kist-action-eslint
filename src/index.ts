// ============================================================================
// Export
// ============================================================================

// Public API surface of this package: the action implementation and its
// options type, plus the base `Action`/`ActionPlugin` contracts re-exported
// for convenience so consumers don't need a separate dependency on the
// package that defines them.
export { LintAction } from "./actions/LintAction/index.js";
export type { LintActionOptions } from "./actions/LintAction/index.js";
export { Action, ActionPlugin } from "./types/Action.js";
export type { ActionOptionsType } from "./types/Action.js";

// ============================================================================
// Plugin Definition
// ============================================================================

import { ActionPlugin } from "./types/Action.js";
import { LintAction } from "./actions/LintAction/index.js";

/**
 * The kist plugin manifest for this package. This is the default export
 * that kist's plugin loader resolves at runtime: it carries package
 * metadata (used for `kist plugin list`/diagnostics) and a
 * `registerActions` factory that hands kist a map of action name to
 * action constructor, so kist.yaml pipeline steps can reference
 * `LintAction` by name without importing the class directly.
 */
const plugin: ActionPlugin = {
    version: "1.0.26",
    description: "ESLint integration for kist",
    author: "kist",
    repository: "https://github.com/getkist/kist-action-eslint",
    keywords: ["kist", "kist-action", "eslint", "lint"],
    registerActions() {
        return {
            LintAction,
        };
    },
};

export default plugin;
