import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource-variable/bitter/wght.css";
import "@fontsource/great-vibes/latin-400.css";
import "../styles/theme.css";
import "../styles/site.css";
import "./table.css";
import { TableMenu } from "./TableMenu";

const venue = document.body.dataset.venue === "bar" ? "bar" : "restaurant";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TableMenu venue={venue} />
  </StrictMode>,
);
