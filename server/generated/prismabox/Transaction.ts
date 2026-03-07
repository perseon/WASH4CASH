import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TransactionPlain = t.Object(
  {
    id: t.Integer(),
    machineId: t.Integer(),
    programId: t.Integer(),
    amount: t.Number(),
    status: t.String(),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const TransactionRelations = t.Object(
  {
    machine: t.Object(
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
    program: t.Object(
      {
        id: t.Integer(),
        name: t.String(),
        type: t.Union([t.Literal("WASHER"), t.Literal("DRYER")], {
          additionalProperties: false,
        }),
        durationMin: t.Integer(),
        price: t.Number(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const TransactionPlainInputCreate = t.Object(
  { amount: t.Number(), status: t.String() },
  { additionalProperties: false },
);

export const TransactionPlainInputUpdate = t.Object(
  { amount: t.Optional(t.Number()), status: t.Optional(t.String()) },
  { additionalProperties: false },
);

export const TransactionRelationsInputCreate = t.Object(
  {
    machine: t.Object(
      {
        connect: t.Object(
          {
            id: t.Integer({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
    program: t.Object(
      {
        connect: t.Object(
          {
            id: t.Integer({ additionalProperties: false }),
          },
          { additionalProperties: false },
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const TransactionRelationsInputUpdate = t.Partial(
  t.Object(
    {
      machine: t.Object(
        {
          connect: t.Object(
            {
              id: t.Integer({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
      program: t.Object(
        {
          connect: t.Object(
            {
              id: t.Integer({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
);

export const TransactionWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.Integer(),
          machineId: t.Integer(),
          programId: t.Integer(),
          amount: t.Number(),
          status: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Transaction" },
  ),
);

export const TransactionWhereUnique = t.Recursive(
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
              machineId: t.Integer(),
              programId: t.Integer(),
              amount: t.Number(),
              status: t.String(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Transaction" },
);

export const TransactionSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      machineId: t.Boolean(),
      programId: t.Boolean(),
      amount: t.Boolean(),
      status: t.Boolean(),
      createdAt: t.Boolean(),
      machine: t.Boolean(),
      program: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TransactionInclude = t.Partial(
  t.Object(
    { machine: t.Boolean(), program: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const TransactionOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      machineId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      programId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      amount: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      status: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Transaction = t.Composite(
  [TransactionPlain, TransactionRelations],
  { additionalProperties: false },
);

export const TransactionInputCreate = t.Composite(
  [TransactionPlainInputCreate, TransactionRelationsInputCreate],
  { additionalProperties: false },
);

export const TransactionInputUpdate = t.Composite(
  [TransactionPlainInputUpdate, TransactionRelationsInputUpdate],
  { additionalProperties: false },
);
