// ============================================================================
// Import
// ============================================================================

import { LintAction, LintActionOptions } from "./LintAction.js";

// ============================================================================
// Export
// ============================================================================

/**
 * Barrel re-export for the LintAction module, so consumers can import both
 * the runtime class and its options type from `./actions/LintAction/index.js`
 * without reaching into `LintAction.ts` directly.
 */
export { LintAction, LintActionOptions };
