import { ActionManager } from "./action_manager";
import type { AiResponse, Message } from "./messages";

export abstract class AiAgentType<T> {
    actionManager: ActionManager = new ActionManager();
  
    abstract prompt(messageChain: T[], stream: ReadableStreamDefaultController<Uint8Array> | null): Promise<AiResponse>;
    abstract fromMessage(message: Message): T;
    abstract toMessage(message: T): Message;
}