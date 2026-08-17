/**
 * Tolerant JSON reader for model output.
 *
 * A deep analysis can run into the output token ceiling, which leaves the JSON
 * cut off mid-array. Rather than throwing everything away we rewind to the last
 * complete value and close the structure, so a long match still renders with the
 * events the model did manage to emit.
 */

function stripWrapper(text: string): string {
  const withoutFences = text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "");
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1) return withoutFences.trim();
  if (end > start) return withoutFences.slice(start, end + 1).trim();
  return withoutFences.slice(start).trim();
}

interface RepairCandidate {
  index: number;
  stack: string[];
}

function repairTruncated(text: string): string | null {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastComplete: RepairCandidate | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
        if (stack[stack.length - 1] === "[") {
          lastComplete = { index: i, stack: [...stack] };
        }
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char);
    } else if (char === "}" || char === "]") {
      stack.pop();
      lastComplete = { index: i, stack: [...stack] };
    }
  }

  if (!lastComplete || lastComplete.stack.length === 0) return null;

  const closers = lastComplete.stack
    .slice()
    .reverse()
    .map((opener) => (opener === "{" ? "}" : "]"))
    .join("");

  return `${text.slice(0, lastComplete.index + 1)}${closers}`;
}

export interface LooseParseResult<T> {
  data: T;
  repaired: boolean;
}

export function parseLooseJson<T>(raw: string): LooseParseResult<T> {
  const cleaned = stripWrapper(raw);

  try {
    return { data: JSON.parse(cleaned) as T, repaired: false };
  } catch {
    const repaired = repairTruncated(cleaned);
    if (repaired) {
      try {
        return { data: JSON.parse(repaired) as T, repaired: true };
      } catch {
        // fall through to the shared error below
      }
    }
    throw new Error(
      "Gemini returned a response that could not be read as JSON. Try analysing a shorter clip."
    );
  }
}
