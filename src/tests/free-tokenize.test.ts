/**
 * US-252: tokenize() colours FreeCodeCard samples as plain text. Joining
 * the tokens must give back the source, and each language has its own
 * keywords, comments and string quotes.
 */
import { describe, expect, test } from "vitest";
import { tokenize, type CodeLang } from "$lib/free/tokenize";

function kinds(source: string, lang: CodeLang) {
  return tokenize(source, lang)
    .filter((token) => token.kind)
    .map((token) => [token.kind, token.text]);
}

describe("tokenize", () => {
  test.each([
    ["TypeScript", `const a = new X('it'); // done\nawait a;`],
    ["Python", `for p in xs:  # "loop"\n    print('a#b', "c")`],
  ] as const)("joins back to the %s source", (lang, source) => {
    expect(
      tokenize(source, lang)
        .map((token) => token.text)
        .join("")
    ).toBe(source);
  });

  test("TypeScript: keywords, both quote styles and // comments", () => {
    expect(kinds(`const s = 'a' + "b"; // note`, "TypeScript")).toEqual([
      ["keyword", "const"],
      ["string", "'a'"],
      ["string", '"b"'],
      ["comment", "// note"],
    ]);
  });

  test("Python: its own keywords, # comments, # inside a string", () => {
    expect(kinds(`for p in xs:  # c\n    print("a#b")`, "Python")).toEqual([
      ["keyword", "for"],
      ["keyword", "in"],
      ["comment", "# c"],
      ["string", '"a#b"'],
    ]);
    // `const` is not a Python keyword, and `in` inside a word is not one.
    expect(kinds(`const = print_index`, "Python")).toEqual([]);
  });

  test("an unterminated quote is left uncoloured", () => {
    expect(kinds(`x = 'open`, "Python")).toEqual([]);
  });
});
