// ============================================================================
// Import
// ============================================================================

import { ESLint } from "eslint";
import { Action, ActionOptionsType } from "../../types/Action.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the LintAction. All fields are optional; omitted fields fall
 * back to the defaults documented below and are resolved inside
 * {@link LintAction.execute}, not at the type level.
 *
 * @example
 * ```yaml
 * steps:
 *   - action: LintAction
 *     options:
 *       targetFiles:
 *         - "src/**\/*.ts"
 *         - "tst/**\/*.ts"
 *       fix: true
 *       configPath: "eslint.config.js"
 * ```
 */
export interface LintActionOptions extends ActionOptionsType {
    /** Files or glob patterns to lint (default: ["src/**\/*.ts"]) */
    targetFiles?: string[];
    /** Whether to automatically apply ESLint's suggested fixes to disk before reporting results (default: false) */
    fix?: boolean;
    /** Path to the ESLint flat config file used to override the resolved configuration (default: "eslint.config.js") */
    configPath?: string;
}

// ============================================================================
// Classes
// ============================================================================

/**
 * LintAction handles linting TypeScript and JavaScript files using ESLint.
 * This action can be configured to run in strict mode or automatically fix issues.
 */
export class LintAction extends Action<LintActionOptions> {
    /**
     * The ESLint instance used to lint files. A placeholder instance is
     * created in the constructor and then replaced in {@link execute} once
     * the resolved `fix` and `configPath` options are known, since ESLint's
     * configuration (fix mode, config file override) can only be set at
     * construction time.
     */
    private eslint: ESLint;

    constructor() {
        super();
        this.eslint = new ESLint({});
    }

    /**
     * Validates the action options before linting begins. Only checks
     * fields that are present, since every option is optional; a missing
     * field is always considered valid because {@link execute} substitutes
     * its default. On failure, the specific validation error is reported
     * via {@link Action.logError} rather than thrown, so callers must check
     * the return value.
     *
     * @param options - The options to validate.
     * @returns True if `targetFiles`, `fix`, and `configPath` (when present) all have the expected type/shape; false otherwise.
     */
    validateOptions(options: LintActionOptions): boolean {
        if (options.targetFiles !== undefined) {
            if (!Array.isArray(options.targetFiles)) {
                this.logError("Invalid options: 'targetFiles' must be an array.");
                return false;
            }
            if (options.targetFiles.length === 0) {
                this.logError("Invalid options: 'targetFiles' must contain at least one file or pattern.");
                return false;
            }
        }
        if (options.fix !== undefined && typeof options.fix !== "boolean") {
            this.logError("Invalid options: 'fix' must be a boolean.");
            return false;
        }
        if (options.configPath !== undefined && typeof options.configPath !== "string") {
            this.logError("Invalid options: 'configPath' must be a string.");
            return false;
        }
        return true;
    }

    /**
     * Executes the ESLint linting action: resolves defaults, rebuilds the
     * {@link eslint} instance with the requested `fix`/`configPath` options,
     * lints `targetFiles`, optionally writes auto-fixes back to disk, prints
     * a "stylish"-formatted report to stdout, and logs a summary. This
     * method never rejects with the underlying error count — a non-zero
     * error/warning count is only logged, not thrown; only unexpected
     * failures (e.g. an invalid config file, a crash inside ESLint) reject
     * the returned Promise.
     *
     * @param options - The options for linting.
     * @returns A Promise that resolves when linting completes, regardless of whether lint errors/warnings were found.
     * @throws {Error} If `options` fail {@link validateOptions}, or if ESLint itself throws (e.g. an unreadable config file or invalid glob).
     */
    async execute(options: LintActionOptions): Promise<void> {
        if (!this.validateOptions(options)) {
            throw new Error("Invalid options provided to LintAction.");
        }

        const {
            targetFiles = ["src/**/*.ts"],
            fix = false,
            configPath = "eslint.config.js",
        } = options;

        this.logInfo(`Starting ESLint on: ${targetFiles.join(", ")}`);

        try {
            // Update ESLint instance with correct configuration
            this.eslint = new ESLint({ fix, overrideConfigFile: configPath });
            const results = await this.eslint.lintFiles(targetFiles);

            if (fix) {
                await ESLint.outputFixes(results);
                this.logInfo("Applied automatic fixes where possible.");
            }

            // Count errors and warnings
            const errorCount = results.reduce((acc, r) => acc + r.errorCount, 0);
            const warningCount = results.reduce((acc, r) => acc + r.warningCount, 0);

            // Format and output results
            const formatter = await this.eslint.loadFormatter("stylish");
            const formattedResults = await formatter.format(results);
            if (formattedResults) {
                console.log(formattedResults);
            }

            if (errorCount > 0) {
                this.logWarning(`ESLint found ${errorCount} error(s) and ${warningCount} warning(s).`);
            } else if (warningCount > 0) {
                this.logInfo(`ESLint completed with ${warningCount} warning(s).`);
            } else {
                this.logInfo("ESLint linting completed successfully with no issues.");
            }
        } catch (error) {
            this.logError("ESLint encountered an error.", error);
            throw error;
        }
    }

    /**
     * Provides a description of the action.
     *
     * @returns A string description of the action.
     */
    describe(): string {
        return "Runs ESLint on specified files and directories, with optional auto-fixing.";
    }
}
