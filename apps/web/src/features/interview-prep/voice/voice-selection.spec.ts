import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getVoiceQualityTier, inferVoiceGender, selectVoice, type VoiceLike } from "./voice-selection";

const voice = (name: string, lang = "en-US", localService = true): VoiceLike => ({
  name,
  lang,
  localService,
});

describe("inferVoiceGender", () => {
  test("uses whole words, so names containing 'man' or 'male' are not misread", () => {
    assert.equal(inferVoiceGender("Samantha"), "female");
    assert.equal(inferVoiceGender("Google UK English Female"), "female");
    assert.equal(inferVoiceGender("Google UK English Male"), "male");
    assert.equal(inferVoiceGender("Microsoft Sonia Online (Natural) - English (United Kingdom)"), "female");
    assert.equal(inferVoiceGender("Microsoft Libby Online (Natural)"), "female");
    assert.equal(inferVoiceGender("Microsoft Guy Online (Natural)"), "male");
    assert.equal(inferVoiceGender("Daniel"), "male");
  });

  test("returns any for unknown or conflicting names", () => {
    assert.equal(inferVoiceGender("Google US English"), "any");
    assert.equal(inferVoiceGender("Alex and Samantha"), "any");
    assert.equal(inferVoiceGender(""), "any");
  });
});

describe("getVoiceQualityTier", () => {
  test("ranks neural voices high and novelty voices low", () => {
    assert.equal(getVoiceQualityTier(voice("Microsoft Aria Online (Natural)")), "high");
    assert.equal(getVoiceQualityTier(voice("Zarvox")), "low");
    assert.equal(getVoiceQualityTier(voice("Karen")), "standard");
  });
});

describe("selectVoice", () => {
  const profile = {
    language: "en-US",
    preferredVoiceNames: ["samantha", "karen"],
    gender: "female" as const,
  };

  test("returns null when no voices are installed", () => {
    assert.equal(selectVoice([], profile), null);
  });

  test("prefers a listed voice even when a high-quality voice of the right gender exists", () => {
    const voices = [voice("Karen", "en-AU"), voice("Samantha"), voice("Microsoft Zira Online (Natural)")];
    assert.equal(selectVoice(voices, profile)?.name, "Samantha");
  });

  test("falls back to the wanted gender, high quality first", () => {
    const voices = [voice("Daniel"), voice("Fiona"), voice("Microsoft Jenny Online (Natural)")];
    assert.equal(selectVoice(voices, { language: "en-US", gender: "female" })?.name, "Microsoft Jenny Online (Natural)");
    assert.equal(selectVoice(voices, { language: "en-US", gender: "male" })?.name, "Daniel");
  });

  test("prefers the requested language", () => {
    const voices = [voice("Thomas", "fr-FR"), voice("Daniel", "en-GB")];
    assert.equal(selectVoice(voices, { language: "en-US", gender: "male" })?.name, "Daniel");
  });
});
