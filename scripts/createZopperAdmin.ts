import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const plainPassword = 'Zopperad@7408';
  
  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 1) Create the User
  const user = await prisma.user.create({
    data: {
      username: 'ZopperAdmin',
      password: hashedPassword,
      role: 'ZOPPER_ADMINISTRATOR',
      validation: 'APPROVED',
      metadata: null,
    },
  });

  // 2) Create the ZopperAdmin profile linked to that user
  await prisma.zopperAdmin.create({
    data: {
      userId: user.id,
      fullName: 'Zopper Admin',
      phone: '0000000000',
    },
  });

  console.log('✅ Created Zopper Administrator and profile');
  console.log('   User ID:', user.id);
  console.log('   Username:', user.username);
  console.log('   Password:', plainPassword);
  console.log('   Role:', user.role);
  console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
