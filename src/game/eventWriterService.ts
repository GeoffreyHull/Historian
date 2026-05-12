import { Event, Faction, WorldState, CascadingConsequence } from "./types";
import {
  buildEventDescriptionContext,
  buildWitnessContext,
} from "./eventHistoryHelper";

const MODEL_ID = "Xenova/flan-t5-base";

const EVENT_TYPE_TONE: Readonly<Record<string, string>> = {
  weather: "atmospheric", location: "evocative", character: "vivid",
  conversation: "tense", action: "urgent", discovery: "mysterious",
  embargo: "grim", rebellion: "fierce", plague: "harrowing",
  trade: "bustling", diplomacy: "solemn", military: "martial",
  religion: "reverent", culture: "festive", economy: "grave",
  infrastructure: "grand", intrigue: "shadowy", migration: "mournful",
  magic: "eerie", disaster: "catastrophic", innovation: "triumphant",
  exploration: "adventurous", justice: "weighty", education: "scholarly",
  romance: "tender", succession: "solemn", naval: "stormy",
  agriculture: "pastoral", mining: "laborious", hunting: "wild",
};

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

  private static readonly GENERATION_PARAMS = {
    repetition_penalty: 1.3,
    num_beams: 4,
    early_stopping: true,
    no_repeat_ngram_size: 3,
  } as const;

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

      const context = worldState && recentEvents
        ? buildEventDescriptionContext(
            worldState,
            recentEvents,
            turnNumber,
            consequences
          )
        : "";

      const toneWord = EVENT_TYPE_TONE[event.eventType] ?? "dramatic";
      const et = event.eventType;
      const descVariants = [
        (ctx: string) => ctx
          ? `Describe in one ${toneWord} medieval sentence: a ${et} event. Context: ${ctx}`
          : `Describe in one vivid medieval sentence: a ${et} event.`,
        (ctx: string) => ctx
          ? `One sentence describing a medieval ${et} event (${toneWord}). Context: ${ctx}`
          : `One sentence describing a medieval ${et} event (${toneWord}).`,
        (_ctx: string) => `Describe in one ${toneWord} medieval sentence: a ${et} event.`,
      ];

      const description = await this.generateWithRetry(
        (i) => descVariants[i](context),
        { max_new_tokens: 60 }
      );

      if (!description) {
        console.log(`[EventGenerator] All description attempts failed for ${et}`);
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
        `[EventGenerator] Generated ${enrichedFragments.length} witness accounts for ${et}`
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
    const variants = [
      (ctx: string) => ctx
        ? `Write one sentence as ${role} hinting at a ${eventType} without naming it. Context: ${ctx}`
        : `Write one sentence as ${role} hinting at a medieval ${eventType} without naming it.`,
      (ctx: string) => ctx
        ? `One sentence from ${role}'s view about unusual signs of a ${eventType}. Context: ${ctx}`
        : `One sentence from ${role}'s view about unusual signs of a medieval ${eventType}.`,
      (_ctx: string) => `One sentence from ${role}'s perspective hinting at a medieval ${eventType}.`,
    ];

    const text = await this.generateWithRetry(
      (i) => variants[i](context),
      { max_new_tokens: 50 },
      10
    );

    return text
      ? `${witnessName} reported: "${text}"`
      : `${witnessName} reported witnessing something unusual.`;
  }

  private async generateWithRetry(
    buildPrompt: (attempt: number) => string,
    params: { max_new_tokens: number },
    minLength: number = 15
  ): Promise<string | null> {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any[] = await this.textPipeline(buildPrompt(attempt), {
          ...params,
          ...TransformersEventWriterService.GENERATION_PARAMS,
        });
        const text = (result[0]?.generated_text ?? "").trim();
        if (this.isValidOutput(text, minLength)) return text;
        console.log(`[EventGenerator] Attempt ${attempt + 1} failed validation. Raw: "${text}"`);
      } catch {
        console.log(`[EventGenerator] Attempt ${attempt + 1} threw error`);
      }
    }
    return null;
  }

  private isValidOutput(text: string, minLength: number = 15): boolean {
    if (text.length < minLength) return false;
    if (/^[^a-zA-Z]*$/.test(text)) return false;
    // Reject repetitive word patterns (same word 3+ times in sequence)
    if (/(\b\w+\b)(\s+\1){2,}/.test(text)) return false;
    // Reject prompt echo — flan-t5's most common failure mode
    if (/^(write|describe|you are|one sentence)/i.test(text)) return false;
    // Reject multi-word phrase repetition
    if (/(\b\w[\w\s]{10,}\b).*\1/.test(text)) return false;
    return true;
  }
}

export const defaultEventWriterService = new TransformersEventWriterService();
