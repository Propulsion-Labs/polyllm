export type AiActionCall = {action: string; params: { [key: string]: string }; uuid: string;}

export enum FinishReason {
    "completed" = "completed",
    "tool_call" = "tool_call",
}

export interface AiResponse {
    actions: AiActionCall[],
    message?: string;
    finish_reason?: FinishReason;
}

export enum Role {
    User='user',
    Assistant='assistant',
    System='system'
}

export interface ChatMessage {
    type: "chat";
    role: Role;
    content?: string;
    actions: AiActionCall[];
}

export interface ActionMessageResponse {
    type: "action_response";
    result: string;
    uuid: string;
}

export function ofChatMessage(role: Role, content?: string, actions?: AiActionCall[]): ChatMessage {
    return {
        type: "chat",
        role,
        content,
        actions: actions ?? []
    };
}

export function ofActionMessageResponse(
    result: string,
    uuid: string,
): ActionMessageResponse {
    return {
        type: "action_response",
        result,
        uuid,
    };
}

export type Message = ChatMessage | ActionMessageResponse;
