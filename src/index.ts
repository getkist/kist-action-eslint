// ============================================================================
// Export
// ============================================================================

export { LintAction } from "./actions/LintAction/index.js";
export type { LintActionOptions } from "./actions/LintAction/index.js";
export { Action, ActionPlugin } from "./types/Action.js";
export type { ActionOptionsType } from "./types/Action.js";

// ============================================================================
// Plugin Definition
// ============================================================================

import { ActionPlugin } from "./types/Action.js";
import { LintAction } from "./actions/LintAction/index.js";

const plugin: ActionPlugin = {
    version: "1.0.0",
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
