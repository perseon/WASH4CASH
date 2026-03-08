import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

// PrismaLibSql is a factory – pass config directly, it creates the libsql client internally
const adapter = new PrismaLibSql({ url: dbUrl });

export const prisma = new PrismaClient({ adapter });


