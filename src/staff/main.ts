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

void checkSession();
