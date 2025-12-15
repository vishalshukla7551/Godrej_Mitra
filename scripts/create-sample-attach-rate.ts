import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleAttachRate() {
  try {
    console.log('Creating sample attach rate...');

    // First, let's check if we have any stores
    const stores = await prisma.store.findMany({
      take: 5,
      select: {
        id: true,
        name: true
      }
    });

    console.log('Available stores:', stores);

    if (stores.length === 0) {
      console.log('No stores found. Creating a sample store first...');
      
      // Create a sample store
      const sampleStore = await prisma.store.create({
        data: {
          id: 'store_00001',
          name: 'Sample Store - Delhi',
          city: 'Delhi',
          state: 'Delhi'
        }
      });
      
      console.log('Created sample store:', sampleStore);
      stores.push(sampleStore);
    }

    // Create sample attach rate for the first store
    const storeId = stores[0].id;
    
    const attachRate = await prisma.periodicAttachRate.create({
      data: {
        storeId: storeId,
        start: '01-01-2024',
        end: '31-01-2024',
        attachPercentage: 25.5 // 25.5% stored as whole number
      }
    });

    console.log('Created sample attach rate:', attachRate);
    console.log('✅ Sample data created successfully!');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleAttachRate();