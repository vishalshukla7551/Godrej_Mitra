import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Shape of documents in sec_users.json exported from SECUser collection
interface RawSecUserDoc {
  _id?: { $oid: string };
  phone: string;
  isActive?: boolean;
  lastLoginAt?: { $date: string } | string | null;
  createdAt?: { $date: string } | string | null;
  updatedAt?: { $date: string } | string | null;
  secId?: string;
  name?: string;
}

function normalizeDate(input: RawSecUserDoc['createdAt']): Date | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return new Date(input);
  if (typeof (input as any).$date === 'string') return new Date((input as any).$date);
  return undefined;
}

async function main() {
  const filePath = path.join(process.cwd(), 'sec_users.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const docs: RawSecUserDoc[] = JSON.parse(raw);

  console.log(`Loaded ${docs.length} SECUser documents from sec_users.json`);

  for (const doc of docs) {
    const phone = doc.phone?.trim();
    if (!phone) {
      console.warn('Skipping document without phone', doc);
      continue;
    }

    const lastLoginAt = normalizeDate(doc.lastLoginAt);
    const createdAt = normalizeDate(doc.createdAt);
    const updatedAt = normalizeDate(doc.updatedAt);

    // We use phone as the unique key for Canvasser in Prisma.
    // Upsert ensures the script is idempotent.
    await prisma.canvasser.upsert({
      where: { phone },
      update: {
        fullName: doc.name ?? undefined,
        lastLoginAt: lastLoginAt ?? undefined,
        // Let Prisma manage updatedAt using @updatedAt
      },
      create: {
        phone,
        fullName: doc.name ?? undefined,
        lastLoginAt: lastLoginAt ?? undefined,
        // If createdAt is provided, we use it; otherwise default(now())
        createdAt: createdAt ?? undefined,
      },
    });

    console.log(`Upserted SEC for phone ${phone}`);
  }

  console.log('Import completed.');
}

main()
  .catch((e) => {
    console.error('Import failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
