import { Event, Faction } from "./types";

const MODEL_ID = "Xenova/flan-t5-small";

function buildAccounts(description: string, fragments: Event["evidenceFragments"]): Event["evidenceFragments"] {
  const words = description.split(" ");
  return fragments.map((f, i) => {
    const start = Math.min(i * 3, Math.max(0, words.length - 6));
    const excerpt = words.slice(start, start + 7).join(" ");
    return { ...f, account: `${f.witnessName} reported: "${excerpt}..."` };
  });
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
    _turnNumber: number,
    _faction: Faction
  ): Promise<Event> {
    try {
      const prompt = `Write one vivid sentence describing a medieval ${event.eventType} event.`;
      const result = await this.textPipeline(prompt, { max_new_tokens: 60 });
      const description = (result[0]?.generated_text ?? "").trim();

      // Reject obviously bad outputs (too short, or just punctuation)
      if (description.length < 15 || /^[^a-zA-Z]*$/.test(description)) {
        return event;
      }

      return {
        ...event,
        description,
        evidenceFragments: buildAccounts(description, event.evidenceFragments),
      };
    } catch {
      return event;
    }
  }
}

export const defaultEventWriterService = new TransformersEventWriterService();
