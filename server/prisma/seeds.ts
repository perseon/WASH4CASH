import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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