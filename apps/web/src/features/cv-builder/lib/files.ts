/*
 * Browser file helpers shared by the CV builder and cover letters:
 * safe filenames, text downloads, clipboard and the PDF preview window.
 */

/** A filesystem-safe name: no path separators, control or reserved characters. */
export function toSafeFilename(name: string, extension: string, fallback = "Document"): string {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 100)
    .trim();
  return `${cleaned || fallback}.${extension}`;
}

/** Copy text; falls back to a hidden textarea where the Clipboard API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context — try the legacy path.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Open a placeholder tab synchronously, inside the click handler: browsers
 * block window.open() once an await has passed. Returns null when blocked.
 */
export function openPendingWindow(message: string): Window | null {
  const win = window.open("", "_blank");
  if (!win) return null;
  try {
    win.opener = null;
    win.document.title = message;
    win.document.body.style.cssText =
      "font:15px system-ui,sans-serif;color:#475569;display:grid;place-items:center;height:100vh;margin:0";
    win.document.body.textContent = message;
  } catch {
    // The placeholder text is cosmetic.
  }
  return win;
}

/** Show a Blob (e.g. a PDF) in a window opened with openPendingWindow. */
export function showBlobInWindow(win: Window, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  win.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
