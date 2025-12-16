/**
 * createAllUsers.ts
 * 
 * Script to create all types of users with their profiles
 * All users are created with validation: APPROVED
 * 
 * Usage:
 * 1. Update the user configurations below
 * 2. Run: npx tsx scripts/createAllUsers.ts
 * 
 * Note: ABM requires ZBM to exist first, ASE requires ZSE to exist first
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// USER CONFIGURATIONS - MODIFY THESE
// ============================================

const USERS_CONFIG = {
  // Zopper Administrator
  zopperAdmin: {
    username: 'ZopperAdmin',
    password: 'Zopperad@7408',
    fullName: 'Zopper Admin',
    phone: '0000000000',
  },

  // Samsung Administrator
  samsungAdmin: {
    username: 'SamsungAdmin',
    password: 'Samsung@123',
    fullName: 'Samsung Admin',
    phone: '1111111111',
  },

  // ZBM (Zonal Business Manager) - Create first as ABM depends on it
  zbm: {
    username: 'ZBM001',
    password: 'ZBM@123',
    fullName: 'Zonal Business Manager',
    phone: '4444444444',
    region: 'North Region',
  },

  // ABM (Area Business Manager) - Requires zbmId
  abm: {
    username: 'ABM001',
    password: 'ABM@123',
    fullName: 'Area Business Manager',
    phone: '2222222222',
    storeIds: [], // Add store IDs if needed
  },

  // ZSE (Zonal Sales Executive) - Create first as ASE depends on it
  zse: {
    username: 'ZSE001',
    password: 'ZSE@123',
    fullName: 'Zonal Sales Executive',
    phone: '5555555555',
    region: 'South Region',
  },

  // ASE (Area Sales Executive) - Requires zseId
  ase: {
    username: 'ASE001',
    password: 'ASE@123',
    fullName: 'Area Sales Executive',
    phone: '3333333333',
    storeIds: [], // Add store IDs if needed
  },

  // Note: SEC users are NOT created through this script
  // SEC users register themselves via OTP and are stored in the SEC collection
  // They don't have entries in the User table
};

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('='.repeat(60));
  console.log('Creating All Users with Profiles');
  console.log('='.repeat(60));
  console.log('');

  const createdUsers: any[] = [];

  try {
    // 1. Create Zopper Administrator
    console.log('📝 Creating Zopper Administrator...');
    try {
      const zopperAdminPassword = await bcrypt.hash(USERS_CONFIG.zopperAdmin.password, 10);
      const zopperAdminUser = await prisma.user.create({
        data: {
          username: USERS_CONFIG.zopperAdmin.username,
          password: zopperAdminPassword,
          role: 'ZOPPER_ADMINISTRATOR',
          validation: 'APPROVED',
        },
      });

      await prisma.zopperAdmin.create({
        data: {
          userId: zopperAdminUser.id,
          fullName: USERS_CONFIG.zopperAdmin.fullName,
          phone: USERS_CONFIG.zopperAdmin.phone,
        },
      });

      createdUsers.push({
        role: 'ZOPPER_ADMINISTRATOR',
        username: USERS_CONFIG.zopperAdmin.username,
        password: USERS_CONFIG.zopperAdmin.password,
        userId: zopperAdminUser.id,
      });
      console.log('✅ Zopper Administrator created\n');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('⏭️  Zopper Administrator already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // 2. Create Samsung Administrator
    console.log('📝 Creating Samsung Administrator...');
    try {
      const samsungAdminPassword = await bcrypt.hash(USERS_CONFIG.samsungAdmin.password, 10);
      const samsungAdminUser = await prisma.user.create({
        data: {
          username: USERS_CONFIG.samsungAdmin.username,
          password: samsungAdminPassword,
          role: 'SAMSUNG_ADMINISTRATOR',
          validation: 'APPROVED',
        },
      });

      await prisma.samsungAdmin.create({
        data: {
          userId: samsungAdminUser.id,
          fullName: USERS_CONFIG.samsungAdmin.fullName,
          phone: USERS_CONFIG.samsungAdmin.phone,
        },
      });

      createdUsers.push({
        role: 'SAMSUNG_ADMINISTRATOR',
        username: USERS_CONFIG.samsungAdmin.username,
        password: USERS_CONFIG.samsungAdmin.password,
        userId: samsungAdminUser.id,
      });
      console.log('✅ Samsung Administrator created\n');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('⏭️  Samsung Administrator already exists, skipping...\n');
      } else {
        throw error;
      }
    }

    // 3. Create ZBM (must be created before ABM)
    console.log('📝 Creating ZBM...');
    let zbmId: string | null = null;
    try {
      const zbmPassword = await bcrypt.hash(USERS_CONFIG.zbm.password, 10);
      const zbmUser = await prisma.user.create({
        data: {
          username: USERS_CONFIG.zbm.username,
          password: zbmPassword,
          role: 'ZBM',
          validation: 'APPROVED',
        },
      });

      const zbmProfile = await prisma.zBM.create({
        data: {
          userId: zbmUser.id,
          fullName: USERS_CONFIG.zbm.fullName,
          phone: USERS_CONFIG.zbm.phone,
          region: USERS_CONFIG.zbm.region,
        },
      });

      zbmId = zbmProfile.id;

      createdUsers.push({
        role: 'ZBM',
        username: USERS_CONFIG.zbm.username,
        password: USERS_CONFIG.zbm.password,
        userId: zbmUser.id,
      });
      console.log('✅ ZBM created\n');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('⏭️  ZBM already exists, fetching existing...\n');
        // Fetch existing ZBM ID
        const existingZbmUser = await prisma.user.findUnique({
          where: { username: USERS_CONFIG.zbm.username },
        });
        if (existingZbmUser) {
          const existingZbm = await prisma.zBM.findUnique({
            where: { userId: existingZbmUser.id },
          });
          if (existingZbm) zbmId = existingZbm.id;
        }
      } else {
        throw error;
      }
    }

    // 4. Create ABM (requires zbmId)
    console.log('📝 Creating ABM...');
    if (!zbmId) {
      console.log('⚠️  Cannot create ABM: ZBM ID not found. Please create ZBM first.\n');
    } else {
      try {
        const abmPassword = await bcrypt.hash(USERS_CONFIG.abm.password, 10);
        const abmUser = await prisma.user.create({
          data: {
            username: USERS_CONFIG.abm.username,
            password: abmPassword,
            role: 'ABM',
            validation: 'APPROVED',
          },
        });

        await prisma.aBM.create({
          data: {
            userId: abmUser.id,
            fullName: USERS_CONFIG.abm.fullName,
            phone: USERS_CONFIG.abm.phone,
            storeIds: USERS_CONFIG.abm.storeIds,
            zbmId: zbmId,
          },
        });

        createdUsers.push({
          role: 'ABM',
          username: USERS_CONFIG.abm.username,
          password: USERS_CONFIG.abm.password,
          userId: abmUser.id,
        });
        console.log('✅ ABM created\n');
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log('⏭️  ABM already exists, skipping...\n');
        } else {
          throw error;
        }
      }
    }

    // 5. Create ZSE (must be created before ASE)
    console.log('📝 Creating ZSE...');
    let zseId: string | null = null;
    try {
      const zsePassword = await bcrypt.hash(USERS_CONFIG.zse.password, 10);
      const zseUser = await prisma.user.create({
        data: {
          username: USERS_CONFIG.zse.username,
          password: zsePassword,
          role: 'ZSE',
          validation: 'APPROVED',
        },
      });

      const zseProfile = await prisma.zSE.create({
        data: {
          userId: zseUser.id,
          fullName: USERS_CONFIG.zse.fullName,
          phone: USERS_CONFIG.zse.phone,
          region: USERS_CONFIG.zse.region,
        },
      });

      zseId = zseProfile.id;

      createdUsers.push({
        role: 'ZSE',
        username: USERS_CONFIG.zse.username,
        password: USERS_CONFIG.zse.password,
        userId: zseUser.id,
      });
      console.log('✅ ZSE created\n');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('⏭️  ZSE already exists, fetching existing...\n');
        // Fetch existing ZSE ID
        const existingZseUser = await prisma.user.findUnique({
          where: { username: USERS_CONFIG.zse.username },
        });
        if (existingZseUser) {
          const existingZse = await prisma.zSE.findUnique({
            where: { userId: existingZseUser.id },
          });
          if (existingZse) zseId = existingZse.id;
        }
      } else {
        throw error;
      }
    }

    // 6. Create ASE (requires zseId)
    console.log('📝 Creating ASE...');
    if (!zseId) {
      console.log('⚠️  Cannot create ASE: ZSE ID not found. Please create ZSE first.\n');
    } else {
      try {
        const asePassword = await bcrypt.hash(USERS_CONFIG.ase.password, 10);
        const aseUser = await prisma.user.create({
          data: {
            username: USERS_CONFIG.ase.username,
            password: asePassword,
            role: 'ASE',
            validation: 'APPROVED',
          },
        });

        await prisma.aSE.create({
          data: {
            userId: aseUser.id,
            fullName: USERS_CONFIG.ase.fullName,
            phone: USERS_CONFIG.ase.phone,
            storeIds: USERS_CONFIG.ase.storeIds,
            zseId: zseId,
          },
        });

        createdUsers.push({
          role: 'ASE',
          username: USERS_CONFIG.ase.username,
          password: USERS_CONFIG.ase.password,
          userId: aseUser.id,
        });
        console.log('✅ ASE created\n');
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log('⏭️  ASE already exists, skipping...\n');
        } else {
          throw error;
        }
      }
    }

    // Print Summary
    console.log('='.repeat(60));
    console.log('✅ User Creation Complete!');
    console.log('='.repeat(60));
    console.log('');

    if (createdUsers.length > 0) {
      console.log('📋 NEWLY CREATED USERS:');
      console.log('');

      createdUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.role}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   User ID: ${user.userId}`);
        if (user.storeId) {
          console.log(`   Store ID: ${user.storeId}`);
        }
        console.log('');
      });

      console.log('⚠️  IMPORTANT: Save these credentials securely!');
    } else {
      console.log('ℹ️  No new users were created (all already exist)');
    }
    console.log('='.repeat(60));
    console.log('');
    console.log('📱 SEC USERS:');
    console.log('   SEC users are NOT created through this script.');
    console.log('   They register themselves via OTP authentication.');
    console.log('   SEC users are stored in the SEC collection (not User table).');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
