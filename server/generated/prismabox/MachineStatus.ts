import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const MachineStatus = t.Union(
  [
    t.Literal("IDLE"),
    t.Literal("BUSY"),
    t.Literal("DONE"),
    t.Literal("MAINTENANCE"),
    t.Literal("BROKEN"),
  ],
  { additionalProperties: false },
);
