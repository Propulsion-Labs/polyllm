/**
 * @file messages.ts
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
