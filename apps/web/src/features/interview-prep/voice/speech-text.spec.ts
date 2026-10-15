import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CHUNK_LENGTH, humanizeSpeechText, splitSpeechChunks } from "./speech-text";

describe("humanizeSpeechText", () => {
  const cases: [string, string][] = [
    [
      "Which is faster: O(n) or O(log n) lookups, e.g. in a HashMap vs. a TreeMap?",
      "Which is faster: O of n or O of log n lookups, for example in a Hash Map versus a Tree Map?",
    ],
    ["What is the output of console.log(typeof null)?", "What is the output of console dot log, typeof null?"],
    [
      "Which of the following are valid React hooks? (Select all that apply)",
      "Which of the following are valid React hooks? Select all that apply",
    ],
    ["How does Node.js handle I/O?", "How does Node dot js handle I O?"],
    ["Explain CI/CD pipelines.", "Explain C I C D pipelines."],
    [
      "What's the difference between SQL and NoSQL databases?",
      "What's the difference between S Q L and No S Q L databases?",
    ],
    ["Name tools like Docker, Kubernetes, etc.", "Name tools like Docker, Kubernetes, and so on"],
    ["Sorting is O(n^2) in the worst case, i.e. quadratic.", "Sorting is O of n squared in the worst case, that is quadratic."],
    ["Version 3.5 of the API", "Version 3 point 5 of the A P I"],
    ["Call useState() and useEffect() — in that order.", "Call use State and use Effect, in that order."],
    ["Read/write REST APIs over HTTPS & HTTP", "Read or write REST A P Is over H T T P S and H T T P"],
  ];

  for (const [input, expected] of cases) {
    test(input, () => {
      assert.equal(humanizeSpeechText(input), expected);
    });
  }

  test("keeps words that merely contain abbreviation letters", () => {
    assert.equal(humanizeSpeechText("Use the eg variable"), "Use the eg variable");
    assert.equal(humanizeSpeechText("The vsync setting"), "The vsync setting");
  });

  test("collapses whitespace and handles empty input", () => {
    assert.equal(humanizeSpeechText("  hello \n  world  "), "hello world");
    assert.equal(humanizeSpeechText(""), "");
  });
});

describe("splitSpeechChunks", () => {
  test("keeps short text in one chunk", () => {
    assert.deepEqual(splitSpeechChunks("One. Two? Three!"), ["One. Two? Three!"]);
  });

  test("never exceeds the maximum chunk length", () => {
    const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ") + ". " + "Short end.";
    const chunks = splitSpeechChunks(long);
    assert.ok(chunks.length > 1);
    for (const chunk of chunks) assert.ok(chunk.length <= MAX_CHUNK_LENGTH, chunk);
    assert.equal(chunks.join(" ").replace(/\s+/g, " "), long);
  });

  test("prefers clause boundaries in long sentences", () => {
    const clause = "a".repeat(100);
    const chunks = splitSpeechChunks(`${clause}, ${clause}, ${clause}.`, 120);
    assert.deepEqual(chunks, [`${clause},`, `${clause},`, `${clause}.`]);
  });

  test("returns no chunks for empty text", () => {
    assert.deepEqual(splitSpeechChunks(""), []);
  });
});
