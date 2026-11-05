import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { type PickedSpex, SpexPicker } from "@/components/spex/spex-picker.client";

const searchSpexAction = vi.hoisted(() => vi.fn());

vi.mock("@/app/(app)/manage/actions.server", () => ({ searchSpexAction }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const NOBEL = { id: "6", title: "Nobel", year: 1975, revival: false, parentId: null, categoryName: "Chalmersspexet" };
const NOBEL_REVIVAL = { id: "7", title: "Nobel", year: 1992, revival: true, parentId: "6", categoryName: "Chalmersspexet" };

function Picker({ originalsOnly = false }: { originalsOnly?: boolean }) {
  const [value, setValue] = useState<PickedSpex | null>(null);

  return <SpexPicker value={value} onChange={setValue} originalsOnly={originalsOnly} />;
}

describe("SpexPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchSpexAction.mockResolvedValue({ ok: true, data: [NOBEL, NOBEL_REVIVAL] });
  });

  it("picks a spex from the results and can be cleared", async () => {
    render(<Picker />);

    await userEvent.type(screen.getByLabelText("spex"), "No");
    const results = await screen.findByRole("list", { name: "results" });

    await userEvent.click(within(results).getAllByRole("button")[1]);
    expect(screen.getByText(/1992/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "remove" }));
    expect(screen.getByLabelText("spex")).toBeInTheDocument();
  });

  it("offers only originals when asked", async () => {
    render(<Picker originalsOnly />);

    await userEvent.type(screen.getByLabelText("spex"), "No");
    const [original, revival] = within(await screen.findByRole("list", { name: "results" })).getAllByRole("button");

    expect(original).toBeEnabled();
    expect(revival).toBeDisabled();
  });
});
