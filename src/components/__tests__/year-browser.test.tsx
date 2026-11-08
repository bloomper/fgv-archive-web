import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YearBrowser } from "@/components/year-browser.client";

const decade = (value: number) => `decade:${JSON.stringify({ decade: value })}`;

describe("YearBrowser", () => {
  it("shows decades, newest first, and unfolds one at a time", async () => {
    render(<YearBrowser years={[1975, 1961, 1964, 2003, 1961]} hrefPrefix="/list?year=" />);

    expect(screen.getAllByRole("button").map(button => button.textContent)).toEqual([decade(2000), decade(1970), decade(1960)]);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: decade(1960) }));
    expect(screen.getByRole("button", { name: decade(1960) })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/list?year=1961", "/list?year=1964"]);

    await userEvent.click(screen.getByRole("button", { name: decade(1970) }));
    expect(screen.getAllByRole("link").map(link => link.textContent)).toEqual(["1975"]);

    await userEvent.click(screen.getByRole("button", { name: decade(1970) }));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows a single decade's years at once", () => {
    render(<YearBrowser years={[2024, 2021]} hrefPrefix="/list?year=" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").map(link => link.textContent)).toEqual(["2021", "2024"]);
  });

  it("renders nothing without years", () => {
    const { container } = render(<YearBrowser years={[]} hrefPrefix="/list?year=" />);

    expect(container).toBeEmptyDOMElement();
  });
});
