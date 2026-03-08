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
        const machines = []
        for (let i = 1; i <= 2; i++) {
            machines.push({ name: `Spălare 10kg #${i}`, type: 'WASHER' as const, status: 'IDLE' as const })
            machines.push({ name: `Spălare 14kg #${i + 2}`, type: 'WASHER' as const, status: 'IDLE' as const })
            machines.push({ name: `Uscare 10kg #${i}`, type: 'DRYER' as const, status: 'IDLE' as const })
            machines.push({ name: `Uscare 14kg #${i + 2}`, type: 'DRYER' as const, status: 'IDLE' as const })
        }
        await prisma.machine.createMany({ data: machines })
        console.log('✅ Machines created')
    }

    const programCount = await prisma.program.count()
    if (programCount === 0) {
        console.log('Seeding programs...')
        await prisma.program.createMany({
            data: [
                { name: 'Spălare Rapidă (30 min)', type: 'WASHER', durationMin: 30, price: 4.50 },
                { name: 'Bumbac 40° (60 min)', type: 'WASHER', durationMin: 60, price: 6.00 },
                { name: 'Spălare Eco (90 min)', type: 'WASHER', durationMin: 90, price: 5.00 },
                { name: 'Sintetice (45 min)', type: 'WASHER', durationMin: 45, price: 5.50 },
                { name: 'Uscare Temp Ridicată (45 min)', type: 'DRYER', durationMin: 45, price: 4.00 },
                { name: 'Uscare Temp Scăzută (60 min)', type: 'DRYER', durationMin: 60, price: 4.00 },
                { name: 'Uscare Rapidă (20 min)', type: 'DRYER', durationMin: 20, price: 2.50 },
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
