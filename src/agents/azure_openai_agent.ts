/**
 * @file azure_openai_agent.ts
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

import OpenAI, { AzureOpenAI } from "openai";
import { AiAgentType } from "../agent";
import { AiResponse, FinishReason, Message, Role } from "../messages";

export class AzureOpenAIAgentType
  extends AiAgentType<OpenAI.Chat.Completions.ChatCompletionMessageParam> {
  model: string;
  client: AzureOpenAI;

  constructor(model: string) {
    super();
    this.model = model;

    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_VERSION; // 2025-02-01-preview
    this.client = new AzureOpenAI({
        deployment,
        apiVersion,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
        apiKey: process.env.AZURE_OPENAI_API_KEY || ''
    });
  }

  override async prompt(
    messageChain: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    stream: ReadableStreamDefaultController<Uint8Array> | null,
  ): Promise<AiResponse> {
    const res = await this.client.chat.completions.create({
      messages: messageChain,
      model: this.model,
      tools: this.actionManager.actions.map((action) => ({
        type: "function",
        function: {
          description: action.description,
          name: action.name,
          parameters: action.jsonSchema,
        },
      })),
      stream: true
    });

    let msg = "";
    const tool_calls: {[key: number]: {id: string, arguments: string, name: string}} = [];

    stream?.enqueue(
      new TextEncoder().encode("data: " + JSON.stringify({type: 'start_message'}) + "\n\n"),
    )

    let finish_reason = ""

    for await (const event of res) {
      if(!event.choices || event.choices.length === 0) {
        continue;
      }
      msg += event.choices[0].delta.content ?? "";
      if(event.choices[0].delta.content) {
        stream?.enqueue(
          new TextEncoder().encode("data: " + JSON.stringify({type: 'message_chunk', content: event.choices[0].delta.content}) + "\n\n"),
        );
      }
      
      if(event.choices[0].finish_reason) {
        finish_reason = event.choices[0].finish_reason;
      }

      if (event.choices[0].delta.tool_calls) {
        for(const tc of event.choices[0].delta.tool_calls) {
          if(tool_calls[tc.index]) {
            if(tc.id) {
              tool_calls[tc.index].id = tc.id;
            }
            if(tc.function) {
              tool_calls[tc.index].arguments += tc.function.arguments ?? "";
              tool_calls[tc.index].name += tc.function.name ?? "";
            }
            continue;
          }else {
            tool_calls[tc.index] = {
              id: tc.id ?? "",
              arguments: tc.function?.arguments ?? "",
              name: tc.function?.name ?? "",
            };
          }
        }
      }
    }

    const response: AiResponse = { actions: [] };

    if(finish_reason === 'stop') {
      response.finish_reason = FinishReason.completed;
    }
    else if(finish_reason === 'tool_call') {
      response.finish_reason = FinishReason.tool_call;
    }


    if (msg) {
      response.message = msg;
    }

    for (const tc of Object.values(tool_calls)) {
      try {
        const json = JSON.parse(tc.arguments ?? "{}");
        console.log("jsonned", json, tc)
        response.actions.push({
          uuid: tc.id ?? "",
          action: tc.name ?? "",
          params: json,
        });
      } catch {
        response.actions.push({
          uuid: tc.id ?? "",
          action: tc.name ?? "",
          params: {},
        });
      }
    }

    return response;
  }
  override fromMessage(
    message: Message,
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam {
    if (message.type == "chat") {
      let role: "user" | "assistant" | "system";
      switch (message.role) {
        case Role.User:
          role = "user";
          break;
        case Role.Assistant:
          role = "assistant";
          break;
        case Role.System:
          role = "system";
          break;
        default:
          role = "user";
          break;
      }
      return {
        role: role,
        content: message.content || "",
        tool_calls: message.actions.length > 0
          ? message.actions.map((action) => ({
            type: "function",
            id: action.uuid,
            function: {
              name: action.action,
              arguments: JSON.stringify(action.params),
            },
          }))
          : undefined,
      };
    } else {
      return {
        role: "tool",
        tool_call_id: message.uuid,
        content: message.result,
      };
    }
  }

  override toMessage(
    message: OpenAI.Chat.Completions.ChatCompletionMessageParam,
  ): Message {
    if (message.role == "tool") {
      return {
        type: "action_response",
        uuid: message.tool_call_id,
        result: message.content as string,
      };
    } else {
      let role: Role;

      switch (message.role) {
        case "user":
          role = Role.User;
          break;
        case "assistant":
          role = Role.Assistant;
          break;
        case "system":
          role = Role.System;
          break;
        default:
          throw new Error(
            "Failure when converting to message. Found unexpected role: " +
              message.role,
          );
      }
      return {
        type: "chat",
        role,
        content: message.content as string,
        actions: message.role === "assistant"
          ? message.tool_calls?.map((tc) => ({
            action: tc.function.name,
            // should already be good, considering the only way we got here is because it was once successful in parsing earlier.
            // if I'm wrong, just do some try catch on this json parse, and return an empty object or something.
            params: JSON.parse(tc.function.arguments),
            uuid: tc.id,
          })) ?? []
          : [],
      };
    }
  }
}
