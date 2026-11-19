import { describe, expect, it } from "vitest";
import { parseQuestionText } from "./question-import";

describe("parseQuestionText", () => {
  it("parses well-formed blocks", () => {
    const r = parseQuestionText("Q: What is 2+2?\na) 3\nb) 4\nc) 5\nd) 6\nAnswer: b\n\nQ2. Pick c\n(a) x\n(b) y\n(c) z\n(d) w\nAns: (c)\nExplanation: because");
    expect(r.errors).toEqual([]);
    expect(r.questions).toHaveLength(2);
    expect(r.questions[0]).toMatchObject({ text: "What is 2+2?", correctOptionId: "b" });
    expect(r.questions[1]).toMatchObject({ correctOptionId: "c", explanation: "because" });
  });

  it("reports missing options and answers per question", () => {
    const r = parseQuestionText("Q: Broken\na) one\nb) two");
    expect(r.questions).toHaveLength(0);
    expect(r.errors.join(" ")).toMatch(/options c, d missing/);
    expect(r.errors.join(" ")).toMatch(/Answer: b/);
  });

  it("rejects empty input", () => {
    expect(parseQuestionText("  \n ").errors).toEqual(["Paste at least one question."]);
  });
});
