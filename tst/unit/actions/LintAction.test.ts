import { LintAction } from "../../../src/actions/LintAction/LintAction.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("LintAction", () => {
    let action: LintAction;
    const testDir = path.join(__dirname, "../fixtures");
    const testFile = path.join(testDir, "test.ts");
    const eslintConfig = path.join(testDir, "eslint.config.js");

    beforeAll(async () => {
        // Create test fixtures directory
        await fs.mkdir(testDir, { recursive: true });

        // Create a minimal ESLint config for testing
        const configContent = `export default [
    {
        files: ["**/*.ts"],
        rules: {
            "no-unused-vars": "warn"
        }
    }
];`;
        await fs.writeFile(eslintConfig, configContent, "utf8");
    });

    beforeEach(async () => {
        action = new LintAction();
        // Create a sample TS file for testing
        const sampleTS = `const x = 1;
const y = 2;
console.log(x + y);
`;
        await fs.writeFile(testFile, sampleTS, "utf8");
    });

    afterEach(async () => {
        // Clean up test file
        try {
            await fs.unlink(testFile);
        } catch { /* ignore */ }
    });

    afterAll(async () => {
        // Clean up test directory
        try {
            await fs.unlink(eslintConfig);
        } catch { /* ignore */ }
        try {
            await fs.rmdir(testDir);
        } catch { /* ignore */ }
    });

    describe("name", () => {
        it("should return the action name", () => {
            expect(action.name).toBe("LintAction");
        });
    });

    describe("describe", () => {
        it("should return a description", () => {
            expect(action.describe()).toContain("ESLint");
        });
    });

    describe("validateOptions", () => {
        it("should return true for valid options", () => {
            const result = action.validateOptions({
                targetFiles: ["src/**/*.ts"],
                fix: false,
            });
            expect(result).toBe(true);
        });

        it("should return true for empty options (uses defaults)", () => {
            const result = action.validateOptions({});
            expect(result).toBe(true);
        });

        it("should return false when targetFiles is not an array", () => {
            const result = action.validateOptions({
                targetFiles: "src/**/*.ts" as unknown as string[],
            });
            expect(result).toBe(false);
        });

        it("should return false when targetFiles is empty array", () => {
            const result = action.validateOptions({
                targetFiles: [],
            });
            expect(result).toBe(false);
        });

        it("should return false when fix is not a boolean", () => {
            const result = action.validateOptions({
                fix: "true" as unknown as boolean,
            });
            expect(result).toBe(false);
        });
    });

    describe("execute", () => {
        it("should lint files successfully", async () => {
            // This test may fail if there are actual lint errors
            // Using the fixture file we control
            await expect(
                action.execute({
                    targetFiles: [testFile],
                    configPath: eslintConfig,
                })
            ).resolves.not.toThrow();
        });

        it("should throw error for invalid options", async () => {
            await expect(
                action.execute({
                    targetFiles: [],
                })
            ).rejects.toThrow("Invalid options");
        });

        it("should handle non-existent files gracefully", async () => {
            await expect(
                action.execute({
                    targetFiles: ["/nonexistent/path/*.ts"],
                    configPath: eslintConfig,
                })
            ).rejects.toThrow();
        });
    });
});
