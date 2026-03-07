import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const MachinePlain = t.Object(
  {
    id: t.Integer(),
    name: t.String(),
    type: t.Union([t.Literal("WASHER"), t.Literal("DRYER")], {
      additionalProperties: false,
    }),
    status: t.Union(
      [
        t.Literal("IDLE"),
        t.Literal("BUSY"),
        t.Literal("DONE"),
        t.Literal("MAINTENANCE"),
        t.Literal("BROKEN"),
      ],
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const MachineRelations = t.Object(
  {
    transactions: t.Array(
      t.Object(
        {
          id: t.Integer(),
          machineId: t.Integer(),
          programId: t.Integer(),
          amount: t.Number(),
          status: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const MachinePlainInputCreate = t.Object(
  {
    name: t.String(),
    type: t.Union([t.Literal("WASHER"), t.Literal("DRYER")], {
      additionalProperties: false,
    }),
    status: t.Optional(
      t.Union(
        [
          t.Literal("IDLE"),
          t.Literal("BUSY"),
          t.Literal("DONE"),
          t.Literal("MAINTENANCE"),
          t.Literal("BROKEN"),
        ],
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const MachinePlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    type: t.Optional(
      t.Union([t.Literal("WASHER"), t.Literal("DRYER")], {
        additionalProperties: false,
      }),
    ),
    status: t.Optional(
      t.Union(
        [
          t.Literal("IDLE"),
          t.Literal("BUSY"),
          t.Literal("DONE"),
          t.Literal("MAINTENANCE"),
          t.Literal("BROKEN"),
        ],
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const MachineRelationsInputCreate = t.Object(
  {
    transactions: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.Integer({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const MachineRelationsInputUpdate = t.Partial(
  t.Object(
    {
      transactions: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.Integer({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const MachineWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          name: t.String(),
          type: t.Union([t.Literal("WASHER"), t.Literal("DRYER")], {
            additionalProperties: false,
          }),
          status: t.Union(
            [
              t.Literal("IDLE"),
              t.Literal("BUSY"),
              t.Literal("DONE"),
              t.Literal("MAINTENANCE"),
              t.Literal("BROKEN"),
            ],
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    { $id: "Machine" },
  ),
);

export const MachineWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object({ id: t.Integer() }, { additionalProperties: false }),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.Integer() })], {
          additionalProperties: false,
        }),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.Integer(),
              name: t.String(),
              type: t.Union([t.Literal("WASHER"), t.Literal("DRYER")], {
                additionalProperties: false,
              }),
              status: t.Union(
                [
                  t.Literal("IDLE"),
                  t.Literal("BUSY"),
                  t.Literal("DONE"),
                  t.Literal("MAINTENANCE"),
                  t.Literal("BROKEN"),
                ],
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Machine" },
);

export const MachineSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      name: t.Boolean(),
      type: t.Boolean(),
      status: t.Boolean(),
      transactions: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const MachineInclude = t.Partial(
  t.Object(
    {
      type: t.Boolean(),
      status: t.Boolean(),
      transactions: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const MachineOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Machine = t.Composite([MachinePlain, MachineRelations], {
  additionalProperties: false,
});

export const MachineInputCreate = t.Composite(
  [MachinePlainInputCreate, MachineRelationsInputCreate],
  { additionalProperties: false },
);

export const MachineInputUpdate = t.Composite(
  [MachinePlainInputUpdate, MachineRelationsInputUpdate],
  { additionalProperties: false },
);
