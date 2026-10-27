import { render, fireEvent, screen } from "@testing-library/svelte";
import { describe, expect, test, vi } from "vitest";
import BusinessDateFilter from "./BusinessDateFilter.svelte";
import { resolveBusinessDate } from "$lib/filters/businessDate";

const TODAY = "2026-10-27";
const stateFor = (query: string) =>
  resolveBusinessDate(new URLSearchParams(query), TODAY);

describe("BusinessDateFilter (US-291)", () => {
  test("shows the server's today and the matching note", () => {
    render(BusinessDateFilter, { props: { state: stateFor("") } });
    expect(screen.getByLabelText("Business date")).toHaveValue(TODAY);
    expect(
      screen.getByText("Trades on or before 27 Oct 2026")
    ).toBeInTheDocument();
  });

  test("forceAll disables the picker and Today and shows the tax-lot note", () => {
    const { container } = render(BusinessDateFilter, {
      props: { state: stateFor(""), forceAll: true },
    });
    expect(screen.getByLabelText("Business date")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Today" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "All dates" })).toBeEnabled();
    expect(
      screen.getByText(
        "Business date isn't available for tax lots yet: showing all data"
      )
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-business-date-mode]")
    ).toHaveAttribute("data-business-date-mode", "all");
  });

  test("All dates and Today dispatch change and update the note", async () => {
    const { component } = render(BusinessDateFilter, {
      props: { state: stateFor("businessDate=2026-05-06") },
    });
    const onChange = vi.fn();
    component.$on("change", (e: CustomEvent) => onChange(e.detail));

    await fireEvent.click(screen.getByRole("button", { name: "All dates" }));
    expect(onChange).toHaveBeenLastCalledWith({ mode: "all", date: null });
    expect(
      screen.getByText("No date filter: showing all data")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Business date")).toHaveValue("");

    await fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(onChange).toHaveBeenLastCalledWith({ mode: "date", date: TODAY });
  });

  test("(i) toggles the explainer and Close shuts it", async () => {
    render(BusinessDateFilter, { props: { state: stateFor("") } });
    const info = screen.getByRole("button", { name: "About business date" });
    expect(info).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).toBeNull();

    await fireEvent.click(info);
    expect(info).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", { name: "About business date" })
    ).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(info).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).toBeNull();
  });
});
