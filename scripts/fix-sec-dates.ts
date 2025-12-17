import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting date normalization for sEC collection...');

  // Convert string fields to proper MongoDB Date type where applicable
  const updates = [
    'updatedAt',
    'createdAt',
    'lastLoginAt'
  ];

  for (const field of updates) {
    try {
      console.log(`Running update for field: ${field}`);
      const res = await prisma.$runCommandRaw({
        update: 'sEC',
        updates: [
          {
            q: { [field]: { $type: 'string' } },
            u: [
              { $set: { [field]: { $toDate: `$${field}` } } }
            ],
            multi: true,
            upsert: false
          }
        ]
      });

      console.log(`Update result for ${field}:`, JSON.stringify(res));
    } catch (err) {
      console.error(`Failed to update field ${field}:`, err);
    }
  }

  console.log('Date normalization complete.');
}

main()
  .catch((e) => {
    console.error('Script failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
