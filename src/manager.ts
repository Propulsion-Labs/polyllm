/**
 * @file manager.ts
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

import type { AiAgentType } from "./agent";
import {
FinishReason,
  type Message,
  ofActionMessageResponse,
  ofChatMessage,
  Role,
} from "./messages";


export class AiManager<T> {
  agent: AiAgentType<T>;
  messages: T[];
  stream: ReadableStreamDefaultController<Uint8Array> | null = null;

  constructor(agent: AiAgentType<T>, messages: Message[]=[]) {
    this.agent = agent;
    this.messages = messages.map(this.agent.fromMessage);
  }

  async onMessaged(message: Message) {
    this.addMessage(message);

    for(let i = 0; i < 10; i++) {
      try {
        const response = await this.agent.prompt(this.messages, this.stream ?? undefined);
        this.addMessage(
          ofChatMessage(Role.Assistant, response.message, response.actions),
        );
  
        for (const tc of response.actions) {
          const actionResult = await this.agent.actionManager.takeAction(
            tc.action,
            tc.params,
            this,
          );
  
          this.addMessage(
            ofActionMessageResponse(
              actionResult ?? "action completed successfully",
              tc.uuid,
            ),
          );
        }
        if(response.finish_reason == FinishReason.completed) {
          break;
        }
      }catch(e) {
        console.error(e);
        break;
      }
    }
    
  }

  getMessages(): Message[] {
    return this.messages.map(this.agent.toMessage);
  }

  addMessage(msg: Message) {
    this.messages.push(this.agent.fromMessage(msg));
  }
}
