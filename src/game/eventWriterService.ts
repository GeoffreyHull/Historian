import { Event, Faction } from "./types";

const MODEL_ID = "Xenova/flan-t5-small";

function parseGenerated(
  text: string,
  fragmentCount: number
): { description: string; accounts: string[] } {
  // Expect numbered output: "1) description 2) account1 3) account2 ..."
  const parts = text
    .split(/\d+\)/)
    .map((s) => s.trim())
    .filter(Boolean);
  const description = parts[0] ?? "";
  const accounts = parts.slice(1, fragmentCount + 1);
  while (accounts.length < fragmentCount) accounts.push("");
  return { description, accounts };
}

export class TransformersEventWriterService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private textPipeline: any = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    const { pipeline } = await import("@xenova/transformers");
    this.textPipeline = await pipeline("text2text-generation", MODEL_ID);
    this.initialized = true;
  }

  async enrichEvents(
    events: Event[],
    turnNumber: number,
    faction: Faction
  ): Promise<Event[]> {
    try {
      await this.ensureInitialized();
    } catch {
      return events;
    }

    const enriched: Event[] = [];
    for (const event of events) {
      enriched.push(await this.enrichEvent(event, turnNumber, faction));
    }
    return enriched;
  }

  private async enrichEvent(
    event: Event,
    turnNumber: number,
    _faction: Faction
  ): Promise<Event> {
    try {
      const names = event.evidenceFragments.map(
        (f) => `${f.witnessName} (${f.role})`
      );
      const prompt =
        `Medieval historical event. Type: ${event.eventType}. Turn: ${turnNumber}. ` +
        `Witnesses: ${names.join(", ")}. ` +
        `Write: 1) One vivid event description sentence. ` +
        names
          .map((n, i) => `${i + 2}) ${n.split(" ")[0]}'s brief account.`)
          .join(" ");

      const result = await this.textPipeline(prompt, { max_new_tokens: 120 });
      const generated = result[0]?.generated_text?.trim() ?? "";
      const { description, accounts } = parseGenerated(
        generated,
        event.evidenceFragments.length
      );

      if (!description) return event;

      return {
        ...event,
        description,
        evidenceFragments: event.evidenceFragments.map((f, i) =>
          accounts[i]
            ? { ...f, account: `${f.witnessName} reported: "${accounts[i]}"` }
            : f
        ),
      };
    } catch {
      return event;
    }
  }
}

export const defaultEventWriterService = new TransformersEventWriterService();
