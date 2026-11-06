import type { IncomingMessage, ServerResponse } from "node:http";
import { route } from "../server/staff.js";

// Public live offers for the website's Grand Opening section, see server/content.ts.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return route(req, res, "offers");
}
