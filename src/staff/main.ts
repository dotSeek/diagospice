import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource-variable/bitter/wght.css";
import "@fontsource/great-vibes/latin-400.css";
import "../styles/theme.css";
import "./staff.css";

const loginForm = document.querySelector<HTMLFormElement>("#login")!;
const menus = document.querySelector<HTMLElement>("#menus")!;
const who = document.querySelector<HTMLElement>("#who")!;
const error = document.querySelector<HTMLElement>("#login-error")!;

const show = (signedIn: { user: string; role: string } | null) => {
  loginForm.hidden = Boolean(signedIn);
  menus.hidden = !signedIn;
  if (signedIn) who.textContent = `${signedIn.user} (${signedIn.role})`;
  else loginForm.querySelector<HTMLInputElement>("input[name=username]")?.focus();
};

const checkSession = async () => {
  const res = await fetch("/api/staff/session", { credentials: "same-origin" });
  show(res.ok ? await res.json() : null);
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  const data = new FormData(loginForm);
  const button = loginForm.querySelector("button")!;
  button.disabled = true;
  try {
    const res = await fetch("/api/staff/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
    });
    const body = await res.json();
    if (!res.ok) {
      error.textContent = body.error ?? "Sign in failed.";
      return;
    }
    loginForm.reset();
    show(body);
  } catch {
    error.textContent = "Could not reach the server. Check the connection and try again.";
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#signout")!.addEventListener("click", async () => {
  await fetch("/api/staff/logout", { method: "POST", credentials: "same-origin" });
  show(null);
});

// View opens the PDF in a modal; Ctrl or Cmd click still opens a new tab.
const viewer = document.querySelector<HTMLDialogElement>("#viewer")!;
const frame = document.querySelector<HTMLIFrameElement>("#viewer-frame")!;
const viewerTitle = document.querySelector<HTMLElement>("#viewer-title")!;
const viewerTab = document.querySelector<HTMLAnchorElement>("#viewer-tab")!;
const viewerDownload = document.querySelector<HTMLAnchorElement>("#viewer-download")!;

document.querySelectorAll<HTMLAnchorElement>("[data-view]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const url = `/api/staff/menu?name=${link.dataset.view}`;
    viewerTitle.textContent = link.dataset.title ?? "Menu";
    viewerTab.href = url;
    viewerDownload.href = `${url}&download=1`;
    frame.src = url;
    viewer.showModal();
  });
});

const closeViewer = () => viewer.close();
document.querySelector("#viewer-close")!.addEventListener("click", closeViewer);
viewer.addEventListener("click", (event) => {
  if (event.target === viewer) closeViewer();
});
viewer.addEventListener("close", () => {
  frame.removeAttribute("src");
});

void checkSession();
