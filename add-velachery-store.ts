import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addVelacheryStore() {
  try {
    console.log('Adding VELACHERY store to database...');
    
    // Based on the pattern, VELACHERY should be store_140 with name "VELACHERY - (1114)"
    const storeId = 'store_140';
    
    const store = await prisma.store.upsert({
      where: { id: storeId },
      update: {
        name: 'VELACHERY - (1114)',
        city: 'Chennai',
        numberOfCanvasser: 1
      },
      create: {
        id: storeId,
        name: 'VELACHERY - (1114)',
        city: 'Chennai',
        numberOfCanvasser: 1
      }
    });

    console.log('✅ Successfully added VELACHERY store:');
    console.log('   ID:', store.id);
    console.log('   Name:', store.name);
    console.log('   City:', store.city);
    console.log('   Number of Canvassers:', store.numberOfCanvasser);
    
  } catch (error) {
    console.error('❌ Error adding VELACHERY store:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addVelacheryStore();