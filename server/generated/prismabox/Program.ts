import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ProgramPlain = t.Object(
  {
    id: t.Integer(),
    name: t.String(),
    type: t.String(),
    durationMin: t.Integer(),
    price: t.Number(),
  },
  { additionalProperties: false },
);

export const ProgramRelations = t.Object(
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

export const ProgramPlainInputCreate = t.Object(
  {
    name: t.String(),
    type: t.String(),
    durationMin: t.Integer(),
    price: t.Number(),
  },
  { additionalProperties: false },
);

export const ProgramPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    type: t.Optional(t.String()),
    durationMin: t.Optional(t.Integer()),
    price: t.Optional(t.Number()),
  },
  { additionalProperties: false },
);

export const ProgramRelationsInputCreate = t.Object(
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

export const ProgramRelationsInputUpdate = t.Partial(
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

export const ProgramWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          name: t.String(),
          type: t.String(),
          durationMin: t.Integer(),
          price: t.Number(),
        },
        { additionalProperties: false },
      ),
    { $id: "Program" },
  ),
);

export const ProgramWhereUnique = t.Recursive(
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
              type: t.String(),
              durationMin: t.Integer(),
              price: t.Number(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Program" },
);

export const ProgramSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      name: t.Boolean(),
      type: t.Boolean(),
      durationMin: t.Boolean(),
      price: t.Boolean(),
      transactions: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ProgramInclude = t.Partial(
  t.Object(
    { transactions: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const ProgramOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      type: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      durationMin: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      price: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Program = t.Composite([ProgramPlain, ProgramRelations], {
  additionalProperties: false,
});

export const ProgramInputCreate = t.Composite(
  [ProgramPlainInputCreate, ProgramRelationsInputCreate],
  { additionalProperties: false },
);

export const ProgramInputUpdate = t.Composite(
  [ProgramPlainInputUpdate, ProgramRelationsInputUpdate],
  { additionalProperties: false },
);
