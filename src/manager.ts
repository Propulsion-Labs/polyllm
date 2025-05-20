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
