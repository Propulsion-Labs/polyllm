/**
 * @file action_manager.ts
 * 
 * MIT License
 * 
 * Copyright (c) 2025 Propulsion Labs, LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */

import { ZodTypeAny, z } from "zod";
import type { AiManager } from "./manager";
import { zodToJsonSchema } from 'zod-to-json-schema';

export class Action {
  name: string;
  description: string;
  // deno-lint-ignore no-explicit-any
  jsonSchema?: { [key: string]: any };
  // deno-lint-ignore no-explicit-any
  fn: (params: any, manager: AiManager<any>) => (Promise<string | void> | string | void);

  /**
   * @param name The name of the action, preferably use snake_case
   * @param description A short description of what the action does for the AI
   * @param fn The action itself. Do not trust the params given to be the params expected. Check everything. Types, names, value bounds. Anything you can.
   */
  constructor(
    name: string,
    description: string,
    // deno-lint-ignore no-explicit-any
    fn: (params: { [key: string]: any }, manager: AiManager<any>) => (Promise<string | void> | string | void),
    // deno-lint-ignore no-explicit-any
    jsonSchema?: { [key: string]: any },
  ) {
    this.name = name;
    this.description = description;
    this.fn = fn;
    this.jsonSchema = jsonSchema;
  }
}

export class ZodAction<T extends ZodTypeAny> extends Action {
  zodSchema: T;

  constructor(
    name: string,
    description: string,
    zodSchema: T,
    fn: (params: z.infer<typeof zodSchema>, manager: AiManager<any>) =>  (Promise<string | void> | string | void),
  ) {
    super(name, description, fn, zodToJsonSchema(zodSchema));
    this.zodSchema = zodSchema;
    this.fn = fn;
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
    let parameters = params;
    if(action instanceof ZodAction) {
      // preform some extra type validation
      const result = action.zodSchema.safeParse(params);
      if (!result.success) {
        return Promise.resolve(
          `Action ${name} failed validation: ${result.error.message}`
        )
      }
      parameters = result.data;
    }
    const res = action.fn(parameters, manager);
    if(res instanceof Promise) {
      return res;
    }
    return Promise.resolve(res);
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
