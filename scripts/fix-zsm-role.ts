import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixZsmRole() {
  try {
    console.log('🔍 Checking for users with ZSM role...');
    
    // First, let's see if there are any users with invalid roles
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      }
    });
    
    console.log(`Found ${allUsers.length} total users`);
    
    // Check for any users that might have ZSM role (this will cause an error if they exist)
    const zsmUsers = allUsers.filter(user => (user.role as any) === 'ZSM');
    
    if (zsmUsers.length > 0) {
      console.log(`⚠️  Found ${zsmUsers.length} users with ZSM role:`);
      zsmUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.id})`);
      });
      
      console.log('🔧 Updating ZSM users to ZSE role...');
      
      for (const user of zsmUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ZSE' }
        });
        console.log(`✅ Updated ${user.username} from ZSM to ZSE`);
      }
    } else {
      console.log('✅ No users with ZSM role found');
    }
    
    // Also check ZSM profile table and migrate to ZSE
    console.log('🔍 Checking for ZSM profiles...');
    
    try {
      // This will fail if ZSM table doesn't exist, which is expected
      const zsmProfiles = await (prisma as any).zSM.findMany();
      
      if (zsmProfiles.length > 0) {
        console.log(`⚠️  Found ${zsmProfiles.length} ZSM profiles to migrate`);
        
        for (const zsmProfile of zsmProfiles) {
          // Create ZSE profile
          await prisma.zSE.create({
            data: {
              userId: zsmProfile.userId,
              fullName: zsmProfile.fullName,
              phone: zsmProfile.phone,
              region: zsmProfile.region,
            }
          });
          
          // Delete old ZSM profile
          await (prisma as any).zSM.delete({
            where: { id: zsmProfile.id }
          });
          
          console.log(`✅ Migrated ZSM profile for user ${zsmProfile.userId}`);
        }
      }
    } catch (error) {
      console.log('ℹ️  ZSM table not found or already migrated');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixZsmRole();