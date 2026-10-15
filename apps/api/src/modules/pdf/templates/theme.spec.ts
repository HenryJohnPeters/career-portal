import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  DEFAULT_THEME,
  THEME_FONTS,
  fontImportUrl,
  normalizeFont,
  normalizeHexColor,
  normalizeThemeConfig,
  resolveTheme,
} from "./theme";

// The API cannot import libs at build time (rootDir: src); load the web copy at test time.
const libsTemplates = require(
  resolve(__dirname, "../../../../../../libs/shared/types/src/cv-templates"),
) as {
  FONT_PAIRS: { heading: string; body: string }[];
  DEFAULT_THEME_CONFIG: Record<string, string>;
};

describe("theme mirrors the web copy", () => {
  test("every web font pair is allowlisted", () => {
    for (const pair of libsTemplates.FONT_PAIRS) {
      assert.equal(normalizeFont(pair.heading), pair.heading);
      assert.equal(normalizeFont(pair.body), pair.body);
    }
  });

  test("the allowlist has no fonts the web cannot pick", () => {
    const webFonts = new Set(libsTemplates.FONT_PAIRS.flatMap((p) => [p.heading, p.body]));
    assert.deepEqual([...THEME_FONTS].sort(), [...webFonts].sort());
  });

  test("defaults match DEFAULT_THEME_CONFIG", () => {
    assert.deepEqual({ ...DEFAULT_THEME }, libsTemplates.DEFAULT_THEME_CONFIG);
  });
});

describe("normalizeHexColor", () => {
  test("accepts 6-digit hex and lowercases it", () => {
    assert.equal(normalizeHexColor("#2563EB"), "#2563eb");
  });

  test("expands 3-digit hex", () => {
    assert.equal(normalizeHexColor("#AbC"), "#aabbcc");
  });

  test("rejects anything else", () => {
    for (const value of ["red", "#12345", "#1234567", "rgb(0,0,0)", "#000;}</style>", "", null, 5]) {
      assert.equal(normalizeHexColor(value), null, String(value));
    }
  });
});

describe("normalizeFont", () => {
  test("canonicalises case and spacing", () => {
    assert.equal(normalizeFont("  source   sans 3 "), "Source Sans 3");
  });

  test("rejects unknown and injected names", () => {
    assert.equal(normalizeFont("Comic Sans MS"), null);
    assert.equal(normalizeFont("x'); @import url('http://169.254.169.254/'); a{font-family:'y"), null);
    assert.equal(normalizeFont(42), null);
  });
});

describe("normalizeThemeConfig", () => {
  test("drops unknown keys and fills defaults", () => {
    assert.deepEqual(normalizeThemeConfig({ evil: "x", __proto__: { a: 1 } }), { ...DEFAULT_THEME });
  });

  test("invalid values fall back to the default, valid ones are kept", () => {
    const theme = normalizeThemeConfig({
      primaryColor: "#000;}</style><iframe src=x>",
      fontHeading: "Lora",
      fontSize: "huge",
      spacing: "compact",
    });
    assert.equal(theme.primaryColor, DEFAULT_THEME.primaryColor);
    assert.equal(theme.fontHeading, "Lora");
    assert.equal(theme.fontSize, DEFAULT_THEME.fontSize);
    assert.equal(theme.spacing, "compact");
  });

  test("a partial update merges over the base theme", () => {
    const base = normalizeThemeConfig({ primaryColor: "#059669", fontBody: "Inter" });
    const merged = normalizeThemeConfig({ fontHeading: "Raleway" }, base);
    assert.equal(merged.primaryColor, "#059669");
    assert.equal(merged.fontBody, "Inter");
    assert.equal(merged.fontHeading, "Raleway");
  });

  test("non-objects give the defaults", () => {
    for (const raw of [null, undefined, "x", 3, ["#000000"]]) {
      assert.deepEqual(normalizeThemeConfig(raw), { ...DEFAULT_THEME });
    }
  });
});

describe("resolveTheme", () => {
  test("derives light/dark colours without NaN", () => {
    const theme = resolveTheme({ primaryColor: "#abc" });
    assert.equal(theme.primaryLight, "rgba(170,187,204,0.10)");
    assert.match(theme.primaryDark, /^#[0-9a-f]{6}$/);
  });
});

describe("fontImportUrl", () => {
  test("builds a Google Fonts URL from allowlisted families only", () => {
    assert.equal(
      fontImportUrl("Source Sans 3", "x'); @import url(evil"),
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800&display=swap",
    );
  });
});
