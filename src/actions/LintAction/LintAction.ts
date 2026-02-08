// ============================================================================
// Import
// ============================================================================

import { ESLint } from "eslint";
import { Action, ActionOptionsType } from "../../types/Action.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for the LintAction
 */
export interface LintActionOptions extends ActionOptionsType {
    /** Files or glob patterns to lint (default: src ts files) */
    targetFiles?: string[];
    /** Whether to automatically fix issues (default: false) */
    fix?: boolean;
    /** Path to ESLint config file (default: eslint.config.js) */
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
    private eslint: ESLint;

    constructor() {
        super();
        this.eslint = new ESLint({});
    }

    /**
     * Validates the action options.
     *
     * @param options - The options to validate.
     * @returns True if options are valid.
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
     * Executes the ESLint linting action.
     *
     * @param options - The options for linting.
     * @returns A Promise that resolves when linting completes.
     * @throws {Error} If linting encounters an error.
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
