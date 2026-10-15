// Applies the saved (or system) colour theme before first paint, so dark-mode
// users never see a white flash. Loaded as a blocking classic script because
// the CSP forbids inline scripts. Mirrors src/lib/theme.tsx (key "theme").
(function () {
  var root = document.documentElement;
  var stored = null;
  try {
    stored = window.localStorage.getItem("theme");
  } catch (e) {
    // Storage blocked: fall back to the system preference.
  }
  var dark = stored === "dark";
  if (stored !== "dark" && stored !== "light") {
    try {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      dark = false;
    }
  }
  if (dark) root.classList.add("dark");
  root.style.colorScheme = dark ? "dark" : "light";
})();
