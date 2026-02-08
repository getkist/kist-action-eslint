import { ActionPlugin } from "./types/Action.js";
import { LintAction } from "./actions/LintAction/index.js";

const plugin: ActionPlugin = {
    name: "@getkist/action-eslint",
    version: "1.0.0",
    actions: { LintAction },
};

export default plugin;
export type { LintActionOptions } from "./actions/LintAction/index.js";
export { LintAction };
export { Action, ActionPlugin, ActionOptionsType } from "./types/Action.js";
