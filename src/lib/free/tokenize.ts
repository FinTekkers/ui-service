// Splits a code sample into plain-text tokens for FreeCodeCard to colour.
// No {@html}: joining every token's text gives back the source exactly.
export type CodeLang = "TypeScript" | "Python";

export type TokenKind = "keyword" | "string" | "comment" | "";

export interface CodeToken {
  text: string;
  kind: TokenKind;
}

// Space-separated words, not quoted ones: free-mock-guard.test.ts reads the
// keyword followed by a quote as an import of whatever comes next.
const KEYWORDS: Record<CodeLang, string[]> = {
  TypeScript: "import from const new await".split(" "),
  Python: "from import for in".split(" "),
};

const COMMENT: Record<CodeLang, string> = {
  TypeScript: "\\/\\/[^\\n]*",
  Python: "#[^\\n]*",
};

// One capture group, so String.split keeps the matches. Strings come before
// comments in the alternation only for readability: the leftmost match wins,
// so a "#" or "//" inside a string stays part of the string.
function tokenPattern(lang: CodeLang): RegExp {
  const strings = `"[^"\\n]*"|'[^'\\n]*'`;
  const keywords = `\\b(?:${KEYWORDS[lang].join("|")})\\b`;
  return new RegExp(`(${strings}|${COMMENT[lang]}|${keywords})`, "g");
}

function kindOf(text: string, lang: CodeLang): TokenKind {
  if (text.startsWith('"') || text.startsWith("'")) return "string";
  if (text.startsWith(lang === "Python" ? "#" : "//")) return "comment";
  if (KEYWORDS[lang].includes(text)) return "keyword";
  return "";
}

export function tokenize(source: string, lang: CodeLang): CodeToken[] {
  // split() with one capture group alternates text, match, text, ...: only
  // the odd entries matched the pattern, so only they get a colour.
  return source
    .split(tokenPattern(lang))
    .map((text, i) => ({ text, kind: i % 2 ? kindOf(text, lang) : "" }))
    .filter((token) => token.text !== "");
}
