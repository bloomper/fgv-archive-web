import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DialogsProvider, useDialogs } from "@/components/dialogs.client";

function Asker() {
  const { confirm, prompt } = useDialogs();
  const [answer, setAnswer] = useState("none");

  return (
    <>
      <button onClick={async () => setAnswer(String(await confirm({
        title: "Radera?",
        confirmLabel: "Radera",
        destructive: true,
      })))}>ask
      </button>
      <button onClick={async () => setAnswer(String(await prompt({ title: "Ny spellista", label: "Namn" })))}>name
      </button>
      <output>{answer}</output>
    </>
  );
}

const show = () => render(<DialogsProvider><Asker /></DialogsProvider>);

describe("DialogsProvider", () => {
  it("confirms in an in-app dialog and resolves false when cancelled", async () => {
    show();

    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Radera" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("true"));

    await userEvent.click(screen.getByRole("button", { name: "ask" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "cancel" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("false"));
  });

  it("prompts for trimmed text and resolves null when cancelled", async () => {
    show();

    await userEvent.click(screen.getByRole("button", { name: "name" }));
    await userEvent.type(within(await screen.findByRole("dialog")).getByLabelText("Namn"), "  Duetter {Enter}");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Duetter"));

    await userEvent.click(screen.getByRole("button", { name: "name" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("null"));
  });
});
