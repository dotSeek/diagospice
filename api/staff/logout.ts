import type { IncomingMessage, ServerResponse } from "node:http";
import { route } from "../../server/staff";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return route(req, res, "logout");
}
