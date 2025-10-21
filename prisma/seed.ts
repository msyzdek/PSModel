import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SHAREHOLDERS = [
  {
    name: 'Michal Fronczyk',
    email: 'michal.fronczyk@montrosesoftware.com',
  },
  {
    name: 'Marek Krzynowek',
    email: 'marek.krzynowek@montrosesoftware.com',
  },
  {
    name: 'Karol Kucharczyk',
    email: 'karol.kucharczyk@montrosesoftware.com',
  },
];

async function main() {
  for (const shareholder of SHAREHOLDERS) {
    await prisma.shareholder.upsert({
      where: { email: shareholder.email },
      update: {
        name: shareholder.name,
        active: true,
      },
      create: {
        name: shareholder.name,
        email: shareholder.email,
        active: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error('Error seeding shareholders', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
