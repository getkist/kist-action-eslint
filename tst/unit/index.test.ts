import { createRequire } from "module";

import plugin, { Action, ActionPlugin, LintAction } from "../../src/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { name: string; version: string };

describe("package entry point", () => {
    it("re-exports the action and the base contracts", () => {
        expect(LintAction).toBeDefined();
        expect(Action).toBeDefined();
        expect(new LintAction()).toBeInstanceOf(Action);
    });

    it("exports a plugin manifest as the default export", () => {
        const manifest: ActionPlugin = plugin;
        expect(typeof manifest.version).toBe("string");
        expect(manifest.description).toBeTruthy();
        expect(manifest.keywords).toEqual(expect.arrayContaining(["kist", "kist-action"]));
    });

    // The manifest version is hand-written, so it silently drifts from the
    // published version unless something compares the two.
    it("declares the same version as package.json", () => {
        expect(plugin.version).toBe(pkg.version);
    });

    it("registers its actions by the name pipeline steps use", () => {
        expect(plugin.registerActions).toBeDefined();
        const actions = plugin.registerActions!();
        expect(Object.keys(actions)).toEqual(["LintAction"]);
        expect(new actions.LintAction()).toBeInstanceOf(LintAction);
    });
});
