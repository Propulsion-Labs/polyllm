/**
 * @file messages.ts
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
