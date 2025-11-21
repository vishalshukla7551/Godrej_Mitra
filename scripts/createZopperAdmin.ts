import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1) Create the User
  const user = await prisma.user.create({
    data: {
      username: 'zopperadmin1',
      password: 'SomeStrongPassword1!',
      role: 'ZOPPER_ADMINISTRATOR',
      validation: 'APPROVED',
      metadata: null,
    },
  });

  // 2) Create the ZopperAdmin profile linked to that user
  await prisma.zopperAdmin.create({
    data: {
      userId: user.id,
      fullName: 'Main Zopper Admin',
      phone: '9999999999',
    },
  });

  console.log('Created Zopper Administrator and profile:', user.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
