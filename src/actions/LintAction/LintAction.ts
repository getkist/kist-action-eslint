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
    /**
     * Path to an ESLint flat config file that overrides the resolved
     * configuration. Omit it — the default — to let ESLint discover the
     * project's own config, which is the only way `eslint.config.mjs`,
     * `.cjs` and `.ts` projects work.
     */
    configPath?: string;
    /**
     * Whether lint errors fail the step (default: true).
     *
     * A lint step that cannot fail cannot gate anything, so errors stop the
     * pipeline by default. Set this to false to report them and carry on.
     * Warnings never fail the step either way.
     */
    failOnError?: boolean;
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
     * The ESLint instance used to lint files, built in {@link execute} once
     * the resolved `fix` and `configPath` options are known — ESLint's
     * configuration can only be set at construction time.
     *
     * Not created in the constructor: kist instantiates an action just to
     * read its `name`, and building an ESLint instance resolves
     * configuration, so the placeholder was real work done on every
     * registration and then thrown away.
     */
    private eslint?: ESLint;

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
        if (options.failOnError !== undefined && typeof options.failOnError !== "boolean") {
            this.logError("Invalid options: 'failOnError' must be a boolean.");
            return false;
        }
        return true;
    }

    /**
     * Executes the ESLint linting action: resolves defaults, rebuilds the
     * {@link eslint} instance with the requested `fix`/`configPath` options,
     * lints `targetFiles`, optionally writes auto-fixes back to disk, prints
     * a "stylish"-formatted report to stdout, and logs a summary. Lint
     * errors reject the returned Promise unless `failOnError` is set to
     * false; warnings never do.
     *
     * @param options - The options for linting.
     * @returns A Promise that resolves when linting completes without errors, or with errors when `failOnError` is false.
     * @throws {Error} If `options` fail {@link validateOptions}, if ESLint itself throws (e.g. an unreadable config file or invalid glob), or if lint errors were found and `failOnError` is left at its default.
     */
    async execute(options: LintActionOptions): Promise<void> {
        if (!this.validateOptions(options)) {
            throw new Error("Invalid options provided to LintAction.");
        }

        const {
            targetFiles = ["src/**/*.ts"],
            fix = false,
            configPath,
            failOnError = true,
        } = options;

        this.logInfo(`Starting ESLint on: ${targetFiles.join(", ")}`);

        // Set inside the try, acted on after it, so a lint failure is not
        // caught and re-reported as "ESLint encountered an error".
        let lintFailure: string | undefined;

        try {
            // `overrideConfigFile` is only passed when the caller named one.
            // It used to default to "eslint.config.js", which ESLint reads as
            // an explicit path and fails on when absent — so every project
            // using eslint.config.mjs, .cjs or .ts could not run this action
            // at all.
            this.eslint = new ESLint({
                fix,
                ...(configPath ? { overrideConfigFile: configPath } : {}),
            });
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
                const summary = `ESLint found ${errorCount} error(s) and ${warningCount} warning(s).`;
                // Recorded rather than thrown here so the pipeline halts on
                // it below. Merely logging it let a build with lint errors
                // finish green, which is the one thing a lint step exists to
                // prevent.
                if (failOnError) {
                    lintFailure = summary;
                } else {
                    this.logWarning(summary);
                }
            } else if (warningCount > 0) {
                this.logInfo(`ESLint completed with ${warningCount} warning(s).`);
            } else {
                this.logInfo("ESLint linting completed successfully with no issues.");
            }
        } catch (error) {
            this.logError("ESLint encountered an error.", error);
            throw error;
        }

        if (lintFailure) {
            this.logError(lintFailure);
            throw new Error(lintFailure);
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
