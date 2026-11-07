import { vi } from "vitest";

/** What the components ask useDialogs() with, as far as the tests look. */
export type DialogOptions = {
  title?: string;
  description?: string;
  destructive?: boolean;
  defaultValue?: string;
  items?: { id: string; label: string }[];
};

/** useDialogs() whose answers a test sets. */
export function dialogs() {
  return {
    confirm: vi.fn<(options: DialogOptions) => Promise<boolean>>(async () => true),
    prompt: vi.fn<(options: DialogOptions) => Promise<string | null>>(async () => "Svar"),
    choose: vi.fn<(options: DialogOptions) => Promise<string | null>>(async () => null),
  };
}

/** Instruments as the pickers and the API's fragments have them. */
export const instruments = [
  { id: "trumpet", nameSv: "Trumpet", nameEn: "Trumpet", group: "BRASS" as const, position: 1, defaultTransposition: { pitch: "B_FLAT" as const, octave: 0 } },
  { id: "flute", nameSv: "Flöjt", nameEn: "Flute", group: "WOODWIND" as const, position: 1, defaultTransposition: { pitch: "C" as const, octave: 0 } },
];
