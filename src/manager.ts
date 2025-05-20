/**
 * @file manager.ts
 * 
 * PolyLLM
 * Copyright (C) 2025  Propulsion Labs, LLC
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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

  constructor(agent: AiAgentType<T>, messages: Message[]) {
    this.agent = agent;
    this.messages = messages.map(this.agent.fromMessage);
  }

  async onMessaged(message: Message) {
    this.addMessage(message);

    for(let i = 0; i < 10; i++) {
      try {
        const response = await this.agent.prompt(this.messages, this.stream);
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
