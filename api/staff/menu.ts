import type { IncomingMessage, ServerResponse } from "node:http";
import { route } from "../../server/staff.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return route(req, res, "menu");
}
