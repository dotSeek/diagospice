import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ContentEditor } from "./ContentEditor";
import { MenuManager } from "./MenuManager";

// The centralised menu manager runs when the server uses the v2 menu model (MENU_MODEL=v2);
// otherwise the original per menu editor. The server answers ?venue=catalogue only in v2.
let mounted = false;
export async function mountEditor(container: HTMLElement) {
  if (mounted) return;
  mounted = true;
  const v2 = await fetch("/api/staff/content?venue=catalogue", { credentials: "same-origin" })
    .then((res) => res.ok)
    .catch(() => false);
  createRoot(container).render(<StrictMode>{v2 ? <MenuManager /> : <ContentEditor />}</StrictMode>);
}
