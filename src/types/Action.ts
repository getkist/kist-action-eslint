/**
 * Base Action types for kist action plugins
 * These types match the kist Action interface for compatibility
 */

/**
 * Action options type - a generic record of key-value pairs
 */
export type ActionOptionsType = Record<string, unknown>;

/**
 * Abstract base class for all kist actions
 * Provides logging and execution interface
 */
export abstract class Action<T extends ActionOptionsType = ActionOptionsType> {
    /**
     * Gets the unique name of the action.
     */
    get name(): string {
        return this.constructor.name;
    }

    /**
     * Validates options before execution
     * Override in subclasses for specific validation
     */
    validateOptions(_options: T): boolean {
        return true;
    }

    /**
     * Execute the action with given options
     * Must be implemented by subclasses
     */
    abstract execute(options: T): Promise<void>;

    /**
     * Provides a description of the action
     */
    describe(): string {
        return `${this.name} action`;
    }

    /**
     * Log an info message
     */
    protected logInfo(message: string): void {
        console.log(`[${this.name}] ${message}`);
    }

    /**
     * Log an error message
     */
    protected logError(message: string, error?: unknown): void {
        console.error(`[${this.name}] ERROR: ${message}`, error || "");
    }

    /**
     * Log a debug message
     */
    protected logDebug(message: string): void {
        if (process.env.DEBUG) {
            console.debug(`[${this.name}] DEBUG: ${message}`);
        }
    }

    /**
     * Log a warning message
     */
    protected logWarning(message: string): void {
        console.warn(`[${this.name}] WARNING: ${message}`);
    }
}

/**
 * Plugin interface for kist action packages
 */
export interface ActionPlugin {
    /** Plugin name */
    name: string;
    /** Plugin version */
    version: string;
    /** Map of action names to action classes */
    actions: Record<string, new () => Action>;
}
