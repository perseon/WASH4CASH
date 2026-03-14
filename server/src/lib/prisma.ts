import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { MachineStatus, MachineType, POSState } from "../types";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

// PrismaLibSql is a factory – pass config directly, it creates the libsql client internally
const adapter = new PrismaLibSql({ url: dbUrl });

export const prisma = new PrismaClient({ adapter });
export { MachineStatus, MachineType, POSState };
