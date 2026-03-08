import { prisma } from "../lib/prisma";

async function resetMachines() {
    console.log("🔄 [Reset] Setting all machines to IDLE...");

    try {
        const result = await prisma.machine.updateMany({
            data: {
                status: 'IDLE',
                expectedEndTime: null,
                totalDurationSeconds: null
            }
        });

        console.log(`✅ [Reset] Successfully reset ${result.count} machines.`);
    } catch (error) {
        console.error("❌ [Reset] Failed to reset machines:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

resetMachines();
