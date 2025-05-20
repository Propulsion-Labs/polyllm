import type { AiManager } from "./manager";

export class Action {
  name: string;
  description: string;
  // deno-lint-ignore no-explicit-any
  jsonSchema?: { [key: string]: any };
  // deno-lint-ignore no-explicit-any
  fn: (params: { [key: string]: any }, manager: AiManager<any>) => Promise<string | void>;

  /**
   * @param name The name of the action, preferably use snake_case
   * @param description A short description of what the action does for the AI
   * @param fn The action itself. Do not trust the params given to be the params expected. Check everything. Types, names, value bounds. Anything you can.
   */
  constructor(
    name: string,
    description: string,
    // deno-lint-ignore no-explicit-any
    fn: (params: { [key: string]: any }, manager: AiManager<any>) => Promise<string | void>,
    // deno-lint-ignore no-explicit-any
    jsonSchema?: { [key: string]: any },
  ) {
    this.name = name;
    this.description = description;
    this.fn = fn;
    this.jsonSchema = jsonSchema;
  }
}

export class ActionManager {
  actions: Action[] = [];

  // deno-lint-ignore no-explicit-any
  takeAction(name: string, params: { [key: string]: any }, manager: AiManager<any>) {
    const action = this.actions.find((action) => action.name === name);
    if (!action) {
      throw new Error(`Action ${name} not found`);
    }
    return action.fn(params, manager);
  }

  addAction(action: Action) {
    this.actions.push(action);
  }

  addActions(actions: Action[]) {
    this.actions.push(...actions);
  }

  removeAction(name: string) {
    this.actions = this.actions.filter((action) => action.name !== name);
  }

  removeActions(names: string[]) {
    this.actions = this.actions.filter(a => names.includes(a.name));
  }

  ephemeralContext(actions: Action[]) {
    return new EphemeralActionContext(this, actions);
  }
}

export class EphemeralActionContext implements Disposable {
  actionManager: ActionManager;
  actionNames: string[];

  constructor(actionManager: ActionManager, actions: Action[]) {
    this.actionManager = actionManager;
    this.actionManager.addActions(actions);
    this.actionNames = actions.map(a => a.name);
  }

  [Symbol.dispose](): void {
    this.actionManager.removeActions(this.actionNames);
  }
}
