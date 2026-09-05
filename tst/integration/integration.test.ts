import { jest } from "@jest/globals";

import fs from "fs/promises";
import path from "path";

import { LintAction } from "../../src/actions/LintAction/LintAction.js";

/**
 * These exercise the action against a real ESLint run over real files on
 * disk, rather than a mocked `ESLint` class. That is the part the unit tests
 * cannot cover: whether the options this action builds actually mean to
 * ESLint what the action assumes they mean.
 */
describe("LintAction integration", () => {
    // ESLint 9 refuses to lint anything outside its base path, which is the
    // working directory unless told otherwise — and `LintAction` exposes no
    // `cwd` option. The fixtures therefore have to live under the repository,
    // not in the system temp directory.
    const tmpDir = path.join(process.cwd(), "tst", "integration", `.tmp-${Date.now()}`);
    const srcDir = path.join(tmpDir, "src");
    const configPath = path.join(tmpDir, "eslint.config.mjs");

    let logSpy: ReturnType<typeof jest.spyOn>;

    beforeAll(async () => {
        await fs.mkdir(srcDir, { recursive: true });

        // A flat config with one rule that is easy to violate deliberately and
        // trivially auto-fixable, so both reporting and `fix` can be asserted.
        await fs.writeFile(
            configPath,
            `export default [
    {
        files: ["**/*.js"],
        rules: {
            semi: ["error", "always"],
            "no-unused-vars": "warn",
        },
    },
];
`,
            "utf8",
        );
    });

    beforeEach(() => {
        // The action prints its report with console.log; keep the suite output
        // readable without losing the ability to assert on what was printed.
        logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    });

    afterEach(() => {
        logSpy.mockRestore();
    });

    afterAll(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true });
    });

    it("resolves without throwing when the linted files are clean", async () => {
        const file = path.join(srcDir, "clean.js");
        await fs.writeFile(file, "const answer = 42;\nexport default answer;\n", "utf8");

        const action = new LintAction();

        await expect(
            action.execute({ targetFiles: [file], configPath }),
        ).resolves.toBeUndefined();
    });

    it("rejects when lint errors are found", async () => {
        const file = path.join(srcDir, "broken.js");
        await fs.writeFile(file, "const answer = 42\nexport default answer\n", "utf8");

        const action = new LintAction();

        // A lint step that cannot fail cannot gate anything, so errors stop
        // the pipeline by default.
        await expect(
            action.execute({ targetFiles: [file], configPath }),
        ).rejects.toThrow(/ESLint found \d+ error/);

        const printed = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
        expect(printed).toContain("semi");
    });

    it("reports lint errors without rejecting when failOnError is false", async () => {
        const file = path.join(srcDir, "broken-tolerated.js");
        await fs.writeFile(file, "const answer = 42\nexport default answer\n", "utf8");

        const action = new LintAction();

        await expect(
            action.execute({
                targetFiles: [file],
                configPath,
                failOnError: false,
            }),
        ).resolves.toBeUndefined();

        const printed = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
        expect(printed).toContain("semi");
    });

    it("writes auto-fixes back to disk when fix is enabled", async () => {
        const file = path.join(srcDir, "fixable.js");
        await fs.writeFile(file, "const answer = 42\nexport default answer\n", "utf8");

        const action = new LintAction();
        await action.execute({ targetFiles: [file], configPath, fix: true });

        const fixed = await fs.readFile(file, "utf8");
        expect(fixed).toBe("const answer = 42;\nexport default answer;\n");
    });

    it("leaves the file untouched when fix is not enabled", async () => {
        const file = path.join(srcDir, "untouched.js");
        const original = "const answer = 42\nexport default answer\n";
        await fs.writeFile(file, original, "utf8");

        const action = new LintAction();
        await expect(
            action.execute({ targetFiles: [file], configPath }),
        ).rejects.toThrow();

        // The point of the test: a failing lint run still must not rewrite
        // the source when `fix` was not requested.
        await expect(fs.readFile(file, "utf8")).resolves.toBe(original);
    });

    it("lets ESLint discover the project config when none is named", async () => {
        // `configPath` used to default to "eslint.config.js", which ESLint
        // treats as an explicit path and fails on when absent — so every
        // project using eslint.config.mjs, .cjs or .ts could not run this
        // action at all. Omitting it must fall back to discovery, which here
        // finds the repository's own eslint.config.js.
        const action = new LintAction();

        await expect(
            action.execute({ targetFiles: ["src/index.ts"] }),
        ).resolves.toBeUndefined();
    });

    it("rejects when the config file cannot be read", async () => {
        const file = path.join(srcDir, "clean.js");

        const action = new LintAction();

        await expect(
            action.execute({
                targetFiles: [file],
                configPath: path.join(tmpDir, "does-not-exist.mjs"),
            }),
        ).rejects.toThrow();
    });

    it("rejects before running ESLint when the options are invalid", async () => {
        const action = new LintAction();

        await expect(
            action.execute({ targetFiles: [], configPath }),
        ).rejects.toThrow("Invalid options provided to LintAction.");
    });
});
