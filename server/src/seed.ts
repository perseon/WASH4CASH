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
    } else {
        console.log(`Found ${usersCount} users, skipping seed.`)
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
