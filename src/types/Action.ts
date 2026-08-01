/**
 * Base Action types for kist action plugins.
 * These types match the kist Action interface for compatibility: any
 * package that wants its actions to be usable as kist.yaml pipeline steps
 * must implement/extend these shapes, since kist's core loads plugins
 * structurally (via `ActionPlugin.registerActions`) rather than through a
 * shared runtime dependency.
 */

/**
 * Action options type - a generic record of key-value pairs. Concrete
 * actions should extend this with their own strongly-typed option fields
 * (see {@link LintActionOptions} in kist-action-eslint's `LintAction.ts`
 * for an example) rather than relying on the untyped index signature
 * directly.
 */
export type ActionOptionsType = Record<string, unknown>;

/**
 * Abstract base class for all kist actions. Provides a consistent logging
 * interface (prefixed with the action's class name) and the
 * validate/execute/describe contract that kist's pipeline runner invokes
 * for each step.
 *
 * @typeParam T - The shape of this action's options, extending {@link ActionOptionsType}.
 */
export abstract class Action<T extends ActionOptionsType = ActionOptionsType> {
    /**
     * Gets the unique name of the action, derived from the runtime class
     * name of the concrete subclass (e.g. `"LintAction"`). Used to prefix
     * all log output so multi-action pipeline runs can be attributed to
     * the action that produced them.
     *
     * @returns The constructor name of the concrete action instance.
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * Validates options before execution. The base implementation is a
     * permissive no-op that accepts anything; subclasses should override
     * this to check required fields and types, reporting problems via
     * {@link logError} before returning `false` so {@link execute} can
     * short-circuit with a clear error.
     *
     * @param _options - The options to validate. Unused in the base implementation.
     * @returns `true` unless overridden by a subclass to perform real validation.
     */
    validateOptions(_options: T): boolean {
        return true;
    }

    /**
     * Execute the action with the given options. Must be implemented by
     * subclasses; this is where the action's actual side effects (file
     * I/O, spawning tools, etc.) happen.
     *
     * @param options - The options for this run, typically validated via {@link validateOptions} first.
     * @returns A Promise that resolves once the action's work is complete.
     * @throws Subclasses are expected to throw (or reject) when the action fails, so the pipeline runner can halt/report the failure.
     */
    abstract execute(options: T): Promise<void>;

    /**
     * Provides a human-readable description of the action, e.g. for CLI
     * help output or pipeline documentation. Subclasses should override
     * this with a specific summary of what they do.
     *
     * @returns A short description of the action. Defaults to `"<name> action"` if not overridden.
     */
    describe(): string {
        return `${this.name} action`;
    }

    /**
     * Log an informational message, prefixed with the action's {@link name}.
     *
     * @param message - The message to log to stdout via `console.log`.
     */
    protected logInfo(message: string): void {
        console.log(`[${this.name}] ${message}`);
    }

    /**
     * Log an error message, prefixed with the action's {@link name}. Does
     * not throw; callers are still responsible for deciding whether the
     * error should abort execution (e.g. by throwing after calling this).
     *
     * @param message - The error message to log to stderr via `console.error`.
     * @param error - Optional underlying error/cause to log alongside the message.
     */
    protected logError(message: string, error?: unknown): void {
        console.error(`[${this.name}] ERROR: ${message}`, error || "");
    }

    /**
     * Log a debug message, prefixed with the action's {@link name}. Only
     * printed when the `DEBUG` environment variable is set, so this is
     * safe to call liberally without spamming normal pipeline output.
     *
     * @param message - The debug message to log via `console.debug`.
     */
    protected logDebug(message: string): void {
        if (process.env.DEBUG) {
            console.debug(`[${this.name}] DEBUG: ${message}`);
        }
    }

    /**
     * Log a warning message, prefixed with the action's {@link name}. Used
     * for non-fatal conditions the action can recover from or complete
     * despite (e.g. lint errors found but not thrown).
     *
     * @param message - The warning message to log to stderr via `console.warn`.
     */
    protected logWarning(message: string): void {
        console.warn(`[${this.name}] WARNING: ${message}`);
    }
}

/**
 * Plugin interface for kist action packages. A package's default export
 * should satisfy this shape so kist's plugin loader can discover the
 * actions it provides and surface package metadata to users. Actions can
 * be exposed either statically via `actions`, or lazily via
 * `registerActions` (preferred, since it avoids constructing every action
 * class up front); when both are present, `registerActions` should be
 * treated as authoritative.
 *
 * @example
 * ```typescript
 * const plugin: ActionPlugin = {
 *     version: "1.0.0",
 *     description: "ESLint integration for kist",
 *     author: "kist",
 *     repository: "https://github.com/getkist/kist-action-eslint",
 *     keywords: ["kist", "kist-action", "eslint", "lint"],
 *     registerActions() {
 *         return { LintAction };
 *     },
 * };
 * export default plugin;
 * ```
 */
export interface ActionPlugin {
    /** Plugin name (default: derived from the package name if omitted) */
    name?: string;
    /** Plugin version, typically kept in sync with the package's `package.json` version */
    version: string;
    /** Short human-readable summary of what the plugin provides */
    description?: string;
    /** Plugin author or maintaining organization */
    author?: string;
    /** Repository URL for the plugin's source code */
    repository?: string;
    /** Keywords used for plugin discovery/search tooling */
    keywords?: string[];
    /** Static map of action names to action constructors, for plugins that don't need lazy registration */
    actions?: Record<string, new () => Action>;
    /** Factory that lazily builds and returns the map of action names to action constructors this plugin provides; preferred over `actions` */
    registerActions?: () => Record<string, new () => Action>;
}
