import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstrumentsPicker, KeyPicker, TranspositionPicker } from "@/components/editor/pickers.client";
import { instruments } from "@/components/__tests__/fixtures";
import type { Key, Transposition } from "@/utils/music";

function Keys({ initial }: { initial: Key | null }) {
  const [state, setState] = useState<{ key: Key | null; modulations: Key[] }>({ key: initial, modulations: [] });

  return (
    <>
      <KeyPicker value={state.key} modulations={state.modulations} onChange={(key, modulations) => setState({ key, modulations })} />
      <output>{JSON.stringify(state)}</output>
    </>
  );
}

const state = () => JSON.parse(screen.getByRole("status").textContent ?? "null");

describe("KeyPicker", () => {
  it("picks a key and the keys it modulates to, in order", async () => {
    render(<Keys initial={null} />);
    expect(screen.getByRole("combobox", { name: "mode" })).toBeDisabled();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "tonic" }), "F");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "mode" }), "MINOR");
    expect(state().key).toEqual({ tonic: "F", mode: "MINOR" });

    await userEvent.click(screen.getByRole("button", { name: "addModulation" }));
    await userEvent.click(screen.getByRole("button", { name: "addModulation" }));
    const second = screen.getByRole("group", { name: `modulation:${JSON.stringify({ number: 2 })}` });
    await userEvent.selectOptions(second.querySelector("select")!, "G");
    expect(state().modulations).toEqual([{ tonic: "F", mode: "MINOR" }, { tonic: "G", mode: "MINOR" }]);

    await userEvent.click(screen.getByRole("button", { name: `moveUp:${JSON.stringify({ number: 2 })}` }));
    expect(state().modulations[0].tonic).toBe("G");
    await userEvent.click(screen.getByRole("button", { name: `moveDown:${JSON.stringify({ number: 1 })}` }));
    expect(state().modulations[0].tonic).toBe("F");
    await userEvent.click(screen.getByRole("button", { name: `remove:${JSON.stringify({ number: 1 })}` }));
    expect(state().modulations).toHaveLength(1);
    // A modulation with no key is removed
    await userEvent.selectOptions(screen.getByRole("group", { name: `modulation:${JSON.stringify({ number: 1 })}` }).querySelector("select")!, "C");
    expect(state().modulations[0].tonic).toBe("C");

    await userEvent.selectOptions(screen.getAllByRole("combobox", { name: "tonic" })[0], "");
    expect(state()).toEqual({ key: null, modulations: [] });
  });
});

function Instruments() {
  const [value, setValue] = useState<string[]>([]);

  return <><InstrumentsPicker id="i" instruments={instruments} value={value} onChange={setValue} /><output>{JSON.stringify(value)}</output></>;
}

describe("InstrumentsPicker", () => {
  it("adds instruments in order, moves one first and removes one", async () => {
    render(<Instruments />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "add" }), "trumpet");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "addMore" }), "flute");
    expect(state()).toEqual(["trumpet", "flute"]);
    await userEvent.click(screen.getByRole("button", { name: `first:${JSON.stringify({ name: "Flöjt" })}` }));
    expect(state()).toEqual(["flute", "trumpet"]);
    await userEvent.click(screen.getByRole("button", { name: `remove:${JSON.stringify({ name: "Trumpet" })}` }));
    expect(state()).toEqual(["flute"]);
  });
});

function Transpositions() {
  const [value, setValue] = useState<Transposition | null>(null);

  return <><TranspositionPicker id="t" value={value} onChange={setValue} /><output>{JSON.stringify(value)}</output></>;
}

describe("TranspositionPicker", () => {
  it("picks a pitch and an octave, or none", async () => {
    render(<Transpositions />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "pitch" }), "B_FLAT");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "octave" }), "-1");
    expect(state()).toEqual({ pitch: "B_FLAT", octave: -1 });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "pitch" }), "");
    expect(state()).toBeNull();
  });
});
