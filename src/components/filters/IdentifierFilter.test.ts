import { render, fireEvent } from "@testing-library/svelte";
import { describe, expect, test } from "vitest";
import IdentifierFilter from "./IdentifierFilter.svelte";
import { Identifier } from "@fintekkers/ledger-models/node/wrappers/models/security/identifier";
import {
  identifierTypeNameLabelOf,
  identifierTypeNamePlaceholderOf,
} from "$lib/securityFilterTypes";

describe("IdentifierFilter", () => {
  test("renders the default type options with ledger-models labels", () => {
    // US-207: values and labels both come from ledger-models, in
    // Identifier.getAllTypeNames() (proto-declaration) order.
    const { getAllByRole } = render(IdentifierFilter);
    const options = getAllByRole("option") as HTMLOptionElement[];
    const names = Identifier.getAllTypeNames();
    expect(options.map((o) => o.value)).toEqual(names);
    expect(options.map((o) => o.text)).toEqual(
      names.map((n) => identifierTypeNameLabelOf(n))
    );
  });

  test("honors supportedTypes subset (e.g. prices uses only 4)", () => {
    const { getAllByRole } = render(IdentifierFilter, {
      props: {
        supportedTypes: ["CUSIP", "ISIN", "EXCH_TICKER", "SERIES_ID"],
      },
    });
    const values = (getAllByRole("option") as HTMLOptionElement[]).map(
      (o) => o.value
    );
    expect(values).toEqual(["CUSIP", "ISIN", "EXCH_TICKER", "SERIES_ID"]);
  });

  test("placeholder reflects current identifierType", () => {
    const { getByLabelText, container } = render(IdentifierFilter, {
      props: {
        identifierType: "EXCH_TICKER",
        identifier: "",
      },
    });
    const input = container.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    expect(input.placeholder).toBe(
      identifierTypeNamePlaceholderOf("EXCH_TICKER")
    );
    // Just touch getByLabelText to assert select labeling works.
    expect(getByLabelText("Identifier type")).toBeInTheDocument();
  });

  test("clearOnTypeChange clears identifier when the dropdown changes", async () => {
    const { container } = render(IdentifierFilter, {
      props: {
        identifierType: "CUSIP",
        identifier: "912828ZT0",
      },
    });
    const select = container.querySelector("select") as HTMLSelectElement;
    const input = container.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    expect(input.value).toBe("912828ZT0");
    await fireEvent.change(select, { target: { value: "EXCH_TICKER" } });
    // Read the bound state via the DOM (component-instance reads require
    // `accessors: true` which we'd rather not opt into for one test).
    expect(input.value).toBe("");
  });

  test("clearOnTypeChange=false preserves the value when the type changes", async () => {
    const { container } = render(IdentifierFilter, {
      props: {
        identifierType: "CUSIP",
        identifier: "912828ZT0",
        clearOnTypeChange: false,
      },
    });
    const select = container.querySelector("select") as HTMLSelectElement;
    const input = container.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    await fireEvent.change(select, { target: { value: "EXCH_TICKER" } });
    expect(input.value).toBe("912828ZT0");
  });

  test("dispatches typeChange event with the new type", async () => {
    const events: string[] = [];
    const { container, component } = render(IdentifierFilter, {
      props: { identifierType: "CUSIP", identifier: "" },
    });
    component.$on("typeChange", (e: CustomEvent<string>) =>
      events.push(e.detail)
    );
    const select = container.querySelector("select") as HTMLSelectElement;
    await fireEvent.change(select, { target: { value: "ISIN" } });
    expect(events).toEqual(["ISIN"]);
  });
});
