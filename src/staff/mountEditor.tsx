import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ContentEditor } from "./ContentEditor";

let mounted = false;
export function mountEditor(container: HTMLElement) {
  if (mounted) return;
  mounted = true;
  createRoot(container).render(
    <StrictMode>
      <ContentEditor />
    </StrictMode>,
  );
}
