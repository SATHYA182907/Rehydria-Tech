/**
 * Plain-text question import, so admins can paste a whole question bank at once.
 * Runtime-agnostic (used by the admin form preview and re-validated by the server action).
 *
 *   Q: Which pin reads analog input on an Arduino Uno?
 *   a) D13
 *   b) A0
 *   c) GND
 *   d) VIN
 *   Answer: b
 *
 * Blocks are separated by a blank line. An optional "Explanation:" line is kept for admins.
 */
export type ImportOptionId = "a" | "b" | "c" | "d";

export interface ParsedQuestion {
  text: string;
  options: { id: ImportOptionId; text: string }[];
  correctOptionId: ImportOptionId;
  explanation: string | null;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  errors: string[];
}

const IDS: ImportOptionId[] = ["a", "b", "c", "d"];

export function parseQuestionText(source: string): ParseResult {
  const blocks = source
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];

  blocks.forEach((block, i) => {
    const n = i + 1;
    let text = "";
    let answer: string | null = null;
    let explanation: string | null = null;
    const options: Partial<Record<ImportOptionId, string>> = {};
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      let m: RegExpMatchArray | null;
      if ((m = line.match(/^(?:q\d*|question\s*\d*)\s*[:.)]\s*(.+)$/i))) text = m[1]!.trim();
      else if ((m = line.match(/^\(?([a-d])\s*[).:]\s*(.+)$/i))) options[m[1]!.toLowerCase() as ImportOptionId] = m[2]!.trim();
      else if ((m = line.match(/^(?:answer|ans|correct)\s*[:.-]\s*\(?([a-d])\)?/i))) answer = m[1]!.toLowerCase();
      else if ((m = line.match(/^explanation\s*[:.-]\s*(.+)$/i))) explanation = m[1]!.trim();
      else if (!text) text = line;
      else if (line) text = `${text} ${line}`;
    }
    const missing = IDS.filter((id) => !options[id]);
    if (!text) errors.push(`Question ${n}: question text is missing.`);
    else if (text.length > 600) errors.push(`Question ${n}: question text is too long (600 characters max).`);
    if (missing.length) errors.push(`Question ${n}: option${missing.length > 1 ? "s" : ""} ${missing.join(", ")} missing.`);
    if (!answer) errors.push(`Question ${n}: add a line like "Answer: b".`);
    if (IDS.some((id) => (options[id]?.length ?? 0) > 300)) errors.push(`Question ${n}: an option is too long (300 characters max).`);
    if (text && !missing.length && answer) {
      questions.push({ text, options: IDS.map((id) => ({ id, text: options[id]! })), correctOptionId: answer as ImportOptionId, explanation });
    }
  });
  if (blocks.length === 0) errors.push("Paste at least one question.");
  return { questions, errors };
}
