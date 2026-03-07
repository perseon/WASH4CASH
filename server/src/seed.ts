import { prisma } from './lib/prisma'

async function main() {
    const usersCount = await prisma.user.count()
    if (usersCount === 0) {
        console.log('Seeding demo users...')
        await prisma.user.createMany({
            data: [
                { name: 'John Doe', email: 'john@example.com' },
                { name: 'Jane Smith', email: 'jane@example.com' },
                { name: 'Alice Johnson', email: 'alice@example.com' },
            ]
        })
        console.log('✅ Demo users created')
    }

    const machineCount = await prisma.machine.count()
    if (machineCount === 0) {
        console.log('Seeding machines...')
        const machines = []
        for (let i = 1; i <= 4; i++) {
            machines.push({ name: `Washer #${i}`, type: 'WASHER' as const, status: 'IDLE' as const })
            machines.push({ name: `Dryer #${i}`, type: 'DRYER' as const, status: 'IDLE' as const })
        }
        await prisma.machine.createMany({ data: machines })
        console.log('✅ Machines created')
    }

    const programCount = await prisma.program.count()
    if (programCount === 0) {
        console.log('Seeding programs...')
        await prisma.program.createMany({
            data: [
                { name: 'Quick Wash (30 min)', type: 'WASHER', durationMin: 30, price: 4.50 },
                { name: 'Cotton 40° (60 min)', type: 'WASHER', durationMin: 60, price: 6.00 },
                { name: 'Eco Wash (90 min)', type: 'WASHER', durationMin: 90, price: 5.00 },
                { name: 'Synthetics (45 min)', type: 'WASHER', durationMin: 45, price: 5.50 },
                { name: 'High Temp Dry (45 min)', type: 'DRYER', durationMin: 45, price: 4.00 },
                { name: 'Low Temp Dry (60 min)', type: 'DRYER', durationMin: 60, price: 4.00 },
                { name: 'Rapid Dry (20 min)', type: 'DRYER', durationMin: 20, price: 2.50 },
            ]
        })
        console.log('✅ Programs created')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
