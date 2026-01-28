import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createUatUser() {
  const prisma = new PrismaClient();
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'uat-admin' }
    });

    if (existingUser) {
      console.log('❌ UAT user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('uat-password-123', 10);

    const user = await prisma.user.create({
      data: {
        username: 'uat-admin',
        password: hashedPassword,
        role: 'ZOPPER_ADMINISTRATOR',
        validation: 'APPROVED',
        metadata: {
          isUatUser: true,
          companyName: 'Test Company'
        },
        zopperAdminProfile: {
          create: {
            fullName: 'UAT Admin',
            phone: '9999999999'
          }
        }
      },
      include: {
        zopperAdminProfile: true
      }
    });

    console.log('✅ UAT User Created Successfully!');
    console.log('Username:', user.username);
    console.log('Password: uat-password-123');
    console.log('Role:', user.role);
    console.log('Metadata:', user.metadata);
    console.log('Profile:', user.zopperAdminProfile);

  } catch (error) {
    console.error('❌ Error creating UAT user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUatUser();
