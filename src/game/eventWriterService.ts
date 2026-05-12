import { Event, Faction, WorldState, CascadingConsequence } from "./types";
import {
  buildEventDescriptionContext,
  buildWitnessContext,
} from "./eventHistoryHelper";

const MODEL_ID = "Xenova/flan-t5-base";

export type ModelLoadStatus = "idle" | "downloading" | "loading" | "ready" | "error";

export interface ModelLoadProgress {
  status: ModelLoadStatus;
  progress?: number; // 0–100 during download
}

export class TransformersEventWriterService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private textPipeline: any = null;
  private initialized = false;
  private loadPromise: Promise<void> | null = null;
  private onProgress: ((p: ModelLoadProgress) => void) | null = null;

  /**
   * Start loading the model early (call on app mount).
   * Safe to call multiple times — returns the same promise.
   */
  initialize(onProgress?: (p: ModelLoadProgress) => void): Promise<void> {
    if (onProgress) this.onProgress = onProgress;
    if (!this.loadPromise) {
      this.loadPromise = this.doLoad();
    }
    return this.loadPromise;
  }

  private async doLoad(): Promise<void> {
    try {
      this.onProgress?.({ status: "downloading", progress: 0 });
      const { pipeline } = await import("@xenova/transformers");
      this.textPipeline = await pipeline("text2text-generation", MODEL_ID, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (p: any) => {
          if (p.status === "progress") {
            this.onProgress?.({
              status: "downloading",
              progress: Math.round(p.progress ?? 0),
            });
          } else if (p.status === "done" || p.status === "ready") {
            this.onProgress?.({ status: "loading" });
          }
        },
      });
      this.initialized = true;
      this.onProgress?.({ status: "ready" });
    } catch {
      this.onProgress?.({ status: "error" });
      throw new Error("Model failed to load");
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (!this.loadPromise) this.loadPromise = this.doLoad();
    await this.loadPromise;
  }

  async enrichEvents(
    events: Event[],
    turnNumber: number,
    faction: Faction,
    worldState?: WorldState,
    recentEvents?: readonly Event[],
    consequences?: readonly CascadingConsequence[]
  ): Promise<Event[]> {
    try {
      await this.ensureInitialized();
    } catch {
      return events;
    }

    const enriched: Event[] = [];
    for (const event of events) {
      enriched.push(
        await this.enrichEvent(
          event,
          turnNumber,
          faction,
          worldState,
          recentEvents,
          consequences
        )
      );
    }
    return enriched;
  }

  private async enrichEvent(
    event: Event,
    turnNumber: number,
    _faction: Faction,
    worldState?: WorldState,
    recentEvents?: readonly Event[],
    consequences: readonly CascadingConsequence[] = []
  ): Promise<Event> {
    try {
      console.log(
        `[EventGenerator] Enriching event: type=${event.eventType}, id=${event.eventId}`
      );

      // Build context for description generation
      const context = worldState && recentEvents
        ? buildEventDescriptionContext(
            worldState,
            recentEvents,
            turnNumber,
            consequences
          )
        : "";

      const descPrompt = context
        ? `${context}\n\nCurrent event type: ${event.eventType}\n\nWrite one vivid, poetic sentence describing a ${event.eventType} event happening now. Reference or build on recent events if relevant to create narrative continuity. The event should feel like it's part of an ongoing story.`
        : `Write one vivid sentence describing a medieval ${event.eventType} event.`;

      const descResult = await this.textPipeline(descPrompt, {
        max_new_tokens: 60,
      });
      const description = (descResult[0]?.generated_text ?? "").trim();

      if (!this.isValidOutput(description)) {
        console.log(
          `[EventGenerator] Description validation failed for ${event.eventType}. Raw output: "${description}"`
        );
        return event;
      }

      console.log(`[EventGenerator] Generated description: "${description}"`);

      const witnessContext = worldState && recentEvents
        ? buildWitnessContext(
            worldState,
            recentEvents,
            turnNumber,
            consequences
          )
        : "";

      const enrichedFragments = await Promise.all(
        event.evidenceFragments.map((f) =>
          this.generateWitnessAccount(
            f.witnessName,
            f.role,
            event.eventType,
            witnessContext
          ).then((account) => ({
            ...f,
            account,
          }))
        )
      );

      console.log(
        `[EventGenerator] Generated ${enrichedFragments.length} witness accounts for ${event.eventType}`
      );
      enrichedFragments.forEach((f) => {
        console.log(`  - ${f.witnessName} (${f.role}): "${f.account}"`);
      });

      return { ...event, description, evidenceFragments: enrichedFragments };
    } catch (err) {
      console.error(
        `[EventGenerator] Error enriching event ${event.eventType}:`,
        err
      );
      return event;
    }
  }

  private async generateWitnessAccount(
    witnessName: string,
    role: string,
    eventType: string,
    context: string = ""
  ): Promise<string> {
    try {
      const prompt = context
        ? `${context}\n\nA ${eventType} event has just occurred.\n\nYou are ${role}. Write one sentence describing something unusual you personally observed, hinting at this ${eventType} event. Your account should be told from your perspective, reflect the mood of the times, and reference the broader context subtly if relevant. Be mysterious or tangential (don't name the event directly).`
        : `Write one sentence as ${role} describing something unusual you personally observed, hinting at a medieval ${eventType} event without naming the event directly.`;

      const result = await this.textPipeline(prompt, { max_new_tokens: 50 });
      const text = (result[0]?.generated_text ?? "").trim();
      if (this.isValidOutput(text, 10))
        return `${witnessName} reported: "${text}"`;
    } catch { /* fall through */ }
    return `${witnessName} reported witnessing something unusual.`;
  }

  private isValidOutput(text: string, minLength: number = 15): boolean {
    if (text.length < minLength) return false;
    if (/^[^a-zA-Z]*$/.test(text)) return false;
    // Reject repetitive word patterns (same word 3+ times in sequence)
    if (/(\b\w+\b)(\s+\1){2,}/.test(text)) return false;
    return true;
  }
}

export const defaultEventWriterService = new TransformersEventWriterService();
