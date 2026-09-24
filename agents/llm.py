"""Agent loop on OpenAI chat completions: the model answers or calls the agent's tools."""

import json
import os
from collections.abc import Callable
from dataclasses import dataclass

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
# Tool calls allowed before the model must answer in plain text.
MAX_ROUNDS = 3


@dataclass
class Context:
    """What a tool can use: the database, the conversation and the turn's outcome."""

    db: Session
    transcript: list[dict]
    handoff: int | None = None


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    parameters: dict
    # Receives the model's arguments; returns the text the model reads back.
    run: Callable[[dict, Context], str]


@dataclass(frozen=True)
class Agent:
    id: str
    # Called on every conversation, so edits to knowledge files apply at once.
    instructions: Callable[[], str]
    tools: tuple[Tool, ...] = ()


def complete(messages: list[dict], tools: tuple[Tool, ...]) -> dict:
    key = os.getenv("OPENAI_API")
    if not key:
        raise HTTPException(503, "L’assistant n’est pas configuré (clé OpenAI).")
    body = {"model": MODEL, "messages": messages}
    if tools:
        body["tools"] = [
            {
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.parameters,
                },
            }
            for t in tools
        ]
    with httpx.Client(timeout=30) as client:
        response = client.post(
            OPENAI_URL, headers={"Authorization": f"Bearer {key}"}, json=body
        )
        response.raise_for_status()
    return response.json()["choices"][0]["message"]


def call_tool(tools: dict[str, Tool], call: dict, context: Context) -> str:
    tool = tools.get(call["function"]["name"])
    try:
        arguments = json.loads(call["function"]["arguments"] or "{}")
    except json.JSONDecodeError:
        return "Arguments illisibles : réessaie avec un JSON valide."
    if not tool or not isinstance(arguments, dict):
        return "Outil inconnu."
    return tool.run(arguments, context)


def run_agent(agent: Agent, context: Context) -> str:
    messages = [
        {"role": "system", "content": agent.instructions()},
        *context.transcript,
    ]
    tools = {tool.name: tool for tool in agent.tools}
    for round_ in range(MAX_ROUNDS):
        # The last round offers no tools, so the model has to reply.
        message = complete(messages, agent.tools if round_ < MAX_ROUNDS - 1 else ())
        calls = message.get("tool_calls")
        if not calls:
            return message.get("content") or ""
        messages.append(
            {
                "role": "assistant",
                "content": message.get("content"),
                "tool_calls": calls,
            }
        )
        messages += [
            {
                "role": "tool",
                "tool_call_id": call["id"],
                "content": call_tool(tools, call, context),
            }
            for call in calls
        ]
    return ""
