import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource-variable/playfair-display/wght-italic.css";
import "@fontsource-variable/bitter/wght.css";
import "@fontsource/great-vibes/latin-400.css";
import "../styles/theme.css";
import "../styles/site.css";
import "./table.css";
import { OffersHub } from "./OffersHub";
import { TableMenu } from "./TableMenu";

// One entry for the QR pages: /restaurant-menu/, /bar-menu/ and /offers/ (the entrance poster).
const page = document.body.dataset.venue;
const venue = page === "bar" ? "bar" : "restaurant";

createRoot(document.getElementById("root")!).render(<StrictMode>{page === "offers" ? <OffersHub /> : <TableMenu venue={venue} />}</StrictMode>);
