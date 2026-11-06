import type { IncomingMessage, ServerResponse } from "node:http";
import { route } from "../server/staff.js";

// Public QR table menu data, see tableMenu in server/staff.ts.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return route(req, res, "table-menu");
}
