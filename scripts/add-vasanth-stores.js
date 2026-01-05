const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const stores = [
  { "name": "Vasanth & Co - T. Nagar", "city": "Chennai" },
  { "name": "Vasanth & Co - Anna Nagar", "city": "Chennai" },
  { "name": "Vasanth & Co - Velachery", "city": "Chennai" },
  { "name": "Vasanth & Co - Tambaram", "city": "Chennai" },
  { "name": "Vasanth & Co - Adyar", "city": "Chennai" },
  { "name": "Vasanth & Co - Porur", "city": "Chennai" },
  { "name": "Vasanth & Co - Ambattur", "city": "Chennai" },
  { "name": "Vasanth & Co - Chromepet", "city": "Chennai" },
  { "name": "Vasanth & Co - RS Puram", "city": "Coimbatore" },
  { "name": "Vasanth & Co - Gandhipuram", "city": "Coimbatore" },
  { "name": "Vasanth & Co - Saibaba Colony", "city": "Coimbatore" },
  { "name": "Vasanth & Co - Peelamedu", "city": "Coimbatore" },
  { "name": "Vasanth & Co - KK Nagar", "city": "Madurai" },
  { "name": "Vasanth & Co - South Gate", "city": "Madurai" },
  { "name": "Vasanth & Co - Cantonment", "city": "Trichy" },
  { "name": "Vasanth & Co - Thillai Nagar", "city": "Trichy" },
  { "name": "Vasanth & Co - New Bus Stand", "city": "Salem" },
  { "name": "Vasanth & Co - Hasthampatti", "city": "Salem" },
  { "name": "Vasanth & Co - Palayamkottai", "city": "Tirunelveli" },
  { "name": "Vasanth & Co - Town", "city": "Tirunelveli" }
];

async function main() {
  console.log('Starting to add Vasanth & Co stores...');

  for (const storeData of stores) {
    try {
      // Generate a unique ID based on store name
      const storeId = storeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const store = await prisma.store.upsert({
        where: { id: storeId },
        update: {
          name: storeData.name,
          city: storeData.city,
        },
        create: {
          id: storeId,
          name: storeData.name,
          city: storeData.city,
          numberOfSec: 0,
        },
      });

      console.log(`✓ Added/Updated: ${store.name} (${store.city})`);
    } catch (error) {
      console.error(`✗ Error adding ${storeData.name}:`, error.message);
    }
  }

  console.log('\nDone! All stores processed.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
