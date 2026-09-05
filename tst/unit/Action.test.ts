import { jest } from "@jest/globals";

import { Action, ActionOptionsType } from "../../src/types/Action.js";

/**
 * `Action` is abstract and its logging helpers are protected, so exercising
 * them needs a concrete subclass that both implements `execute` and widens
 * the helpers enough to call them directly.
 */
class ProbeAction extends Action {
    executed: ActionOptionsType | undefined;

    async execute(options: ActionOptionsType): Promise<void> {
        this.executed = options;
    }

    info(message: string): void {
        this.logInfo(message);
    }

    error(message: string, error?: unknown): void {
        this.logError(message, error);
    }

    debug(message: string): void {
        this.logDebug(message);
    }

    warn(message: string): void {
        this.logWarning(message);
    }
}

class DescribedAction extends ProbeAction {
    describe(): string {
        return "a described action";
    }
}

describe("Action", () => {
    let action: ProbeAction;

    beforeEach(() => {
        action = new ProbeAction();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("derives its name from the concrete subclass", () => {
        expect(action.name).toBe("ProbeAction");
        expect(new DescribedAction().name).toBe("DescribedAction");
    });

    it("accepts any options by default", () => {
        expect(action.validateOptions({})).toBe(true);
        expect(action.validateOptions({ anything: 1 })).toBe(true);
    });

    it("falls back to a name-derived description", () => {
        expect(action.describe()).toBe("ProbeAction action");
    });

    it("uses an overridden description when the subclass provides one", () => {
        expect(new DescribedAction().describe()).toBe("a described action");
    });

    it("runs execute with the options it is given", async () => {
        await action.execute({ fix: true });
        expect(action.executed).toEqual({ fix: true });
    });

    it("prefixes informational output with the action name", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);
        action.info("hello");
        expect(spy).toHaveBeenCalledWith("[ProbeAction] hello");
    });

    it("prefixes warnings with the action name", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
        action.warn("careful");
        expect(spy).toHaveBeenCalledWith("[ProbeAction] WARNING: careful");
    });

    it("logs an error with its cause when one is supplied", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
        const cause = new Error("boom");
        action.error("failed", cause);
        expect(spy).toHaveBeenCalledWith("[ProbeAction] ERROR: failed", cause);
    });

    it("substitutes an empty string when an error has no cause", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
        action.error("failed");
        expect(spy).toHaveBeenCalledWith("[ProbeAction] ERROR: failed", "");
    });

    describe("debug logging", () => {
        const original = process.env.DEBUG;

        afterEach(() => {
            if (original === undefined) {
                delete process.env.DEBUG;
            } else {
                process.env.DEBUG = original;
            }
        });

        it("stays silent unless DEBUG is set", () => {
            delete process.env.DEBUG;
            const spy = jest.spyOn(console, "debug").mockImplementation(() => undefined);
            action.debug("noisy");
            expect(spy).not.toHaveBeenCalled();
        });

        it("prints when DEBUG is set", () => {
            process.env.DEBUG = "1";
            const spy = jest.spyOn(console, "debug").mockImplementation(() => undefined);
            action.debug("noisy");
            expect(spy).toHaveBeenCalledWith("[ProbeAction] DEBUG: noisy");
        });
    });
});
