import Anthropic from "@anthropic-ai/sdk";
import { Event, Faction } from "./types";

const SYSTEM_PROMPT = `You are a narrative engine for Historian, a medieval historical strategy game.
Generate vivid, specific event descriptions and eyewitness accounts in archaic prose.
Historical setting only — no magic, no modern technology.
Always respond with valid JSON only, no markdown or extra text.`;

function buildPrompt(events: Event[], turnNumber: number, faction: Faction): string {
  const eventList = events
    .map(
      (e, i) =>
        `Event ${i + 1}: type="${e.eventType}", witnesses=[${e.evidenceFragments
          .map((f) => `${f.witnessName} (${f.role})`)
          .join(", ")}]`
    )
    .join("\n");

  return `Turn ${turnNumber}, chronicled for the ${faction} faction.

${eventList}

For each event produce a one-sentence description and one account per witness (1–2 sentences each, written in first-person from the witness's perspective).

Respond with JSON:
{
  "events": [
    {
      "description": "...",
      "accounts": ["witness 1 account", "witness 2 account", "witness 3 account"]
    }
  ]
}`;
}

interface LLMEnrichedEvent {
  description: string;
  accounts: string[];
}

interface LLMResponse {
  events: LLMEnrichedEvent[];
}

export class LLMEventWriterService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  async enrichEvents(events: Event[], turnNumber: number, faction: Faction): Promise<Event[]> {
    const prompt = buildPrompt(events, turnNumber, faction);

    let parsed: LLMResponse;
    try {
      const response = await this.client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      parsed = JSON.parse(text) as LLMResponse;
    } catch {
      return events;
    }

    return events.map((event, i) => {
      const enriched = parsed.events[i];
      if (!enriched?.description) return event;

      const updatedFragments = event.evidenceFragments.map((f, j) => ({
        ...f,
        account:
          enriched.accounts[j] ??
          f.account,
      }));

      return {
        ...event,
        description: enriched.description,
        evidenceFragments: updatedFragments,
      };
    });
  }
}
