import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });



const userData = [
    { name: "John Doe", email: "john.doe@example.com" },
    { name: "Jane Doe", email: "jane.doe@example.com" },
];

async function main() {
    console.log("Start seeding...");
    for (const user of userData) {
        const created = await prisma.user.create({
            data: user,
        });
        console.log(`Created user with id: ${created.id}`);
    }
    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });