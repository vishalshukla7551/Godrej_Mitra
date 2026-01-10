import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StoreData {
  id?: string;
  name: string;
  city?: string;
  numberOfCanvasser?: number;
}

async function loadStoreDataFromExcel() {
  try {
    console.log('🚀 Starting store data import from Excel...');

    // Read the Excel file
    const excelFilePath = path.join(process.cwd(), 'Vasanth & Co Store List.xlsx');
    
    if (!fs.existsSync(excelFilePath)) {
      throw new Error(`Excel file not found at: ${excelFilePath}`);
    }

    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Use the first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('📊 Raw Excel data preview:');
    console.log('First 5 rows:', rawData.slice(0, 5));
    
    if (rawData.length < 2) {
      throw new Error('Excel file appears to be empty or has no data rows');
    }

    // Get headers from first row
    const headers = rawData[0] as string[];
    console.log('📋 Headers found:', headers);

    // Convert to objects
    const storeRecords: StoreData[] = [];
    
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as any[];
      if (!row || row.length === 0) continue; // Skip empty rows
      
      const storeData: StoreData = {
        name: '',
        city: undefined,
        numberOfCanvasser: 1 // Default to 1 Canvasser per store
      };

      // Handle the specific format: "STORE NAME - (CODE)"
      const showroomValue = row[0];
      if (showroomValue && typeof showroomValue === 'string') {
        const showroomStr = showroomValue.toString().trim();
        
        // Extract store name and code from format like "PALAYAMKOTTAI - (1302)"
        const match = showroomStr.match(/^(.+?)\s*-\s*\((\d+)\)$/);
        if (match) {
          const storeName = match[1].trim();
          const storeCode = match[2].trim();
          
          // Keep the full name with code for display
          storeData.name = showroomStr; // Full name: "PALAYAMKOTTAI - (1302)"
          
          // Generate simple sequential ID
          const storeNumber = String(i).padStart(3, '0');
          storeData.id = `store_${storeNumber}`;
          
          // Try to extract city from store name (many store names contain city info)
          // Common patterns: city names are often the first part
          const cityMatch = storeName.match(/^([A-Z\s]+?)(?:\s+\d+|\s*-|\s*$)/);
          if (cityMatch) {
            storeData.city = cityMatch[1].trim();
          } else {
            // If no pattern match, set city as Tamil Nadu
            storeData.city = "Tamil Nadu";
          }
        } else {
          // Fallback: use the entire string as store name
          storeData.name = showroomStr;
          const storeNumber = String(i).padStart(3, '0');
          storeData.id = `store_${storeNumber}`;
          // Set city as Tamil Nadu for stores without clear format
          storeData.city = "Tamil Nadu";
        }
      }

      // Validate required fields
      if (storeData.name) {
        storeRecords.push(storeData);
      } else {
        console.log(`⚠️  Skipping row ${i + 1}: Missing store name`);
      }
    }

    console.log(`📦 Processed ${storeRecords.length} store records from Excel`);
    
    if (storeRecords.length === 0) {
      throw new Error('No valid store records found in Excel file');
    }

    // Show sample of processed data
    console.log('📋 Sample processed records:');
    storeRecords.slice(0, 3).forEach((store, index) => {
      console.log(`  ${index + 1}. Name: "${store.name}", City: "${store.city || 'N/A'}", Canvassers: ${store.numberOfCanvasser}`);
    });

    // Clear existing stores
    console.log('🗑️  Removing existing stores from database...');
    const deletedCount = await prisma.store.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.count} existing stores`);

    // Insert new stores
    console.log('💾 Inserting new store data...');
    const insertedStores = [];
    
    for (const storeData of storeRecords) {
      try {
        // Use the pre-generated simple ID
        const store = await prisma.store.create({
          data: {
            id: storeData.id!, // Use the simple store_001, store_002, etc.
            name: storeData.name,
            city: storeData.city,
            numberOfCanvasser: storeData.numberOfCanvasser || 1,
            samsungIncentiveInfo: []
          }
        });
        
        insertedStores.push(store);
      } catch (error) {
        console.error(`❌ Error inserting store "${storeData.name}":`, error);
      }
    }

    console.log(`✅ Successfully inserted ${insertedStores.length} stores`);

    // Update stores with null or unclear cities to "Tamil Nadu"
    console.log('🔄 Updating unclear city names to "Tamil Nadu"...');
    
    // Get all stores and filter in JavaScript to avoid MongoDB regex issues
    const allStores = await prisma.store.findMany({
      select: { id: true, name: true, city: true }
    });

    const storesNeedingCityUpdate = allStores.filter(store => {
      const city = store.city;
      return !city || 
             city === "" || 
             city.includes("-") || 
             city.includes("(") || 
             city.includes(")") || 
             /\d/.test(city) || // Contains numbers
             city.length > 25; // Likely a store name, not a city
    });

    console.log(`Found ${storesNeedingCityUpdate.length} stores with unclear cities`);

    let updatedCityCount = 0;
    for (const store of storesNeedingCityUpdate) {
      try {
        await prisma.store.update({
          where: { id: store.id },
          data: { city: "Tamil Nadu" }
        });
        updatedCityCount++;
        console.log(`  ✓ Updated ${store.name}: "${store.city || 'null'}" → "Tamil Nadu"`);
      } catch (error) {
        console.error(`  ❌ Failed to update ${store.name}:`, error);
      }
    }

    console.log(`✅ Updated ${updatedCityCount} stores to have city "Tamil Nadu"`);

    // Display final summary
    console.log('\n📊 IMPORT SUMMARY:');
    console.log(`Total stores processed: ${storeRecords.length}`);
    console.log(`Successfully inserted: ${insertedStores.length}`);
    console.log(`Failed insertions: ${storeRecords.length - insertedStores.length}`);
    console.log(`Cities updated to "Tamil Nadu": ${updatedCityCount}`);

    // Show final stores by city
    const finalStores = await prisma.store.findMany({
      select: { city: true }
    });
    
    const storesByCity = finalStores.reduce((acc, store) => {
      const city = store.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🏙️  Final Stores by City:');
    Object.entries(storesByCity)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .forEach(([city, count]) => {
        console.log(`  ${city}: ${count} stores`);
      });

    return insertedStores;

  } catch (error) {
    console.error('❌ Error loading store data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  loadStoreDataFromExcel()
    .then((stores) => {
      console.log(`\n🎉 Store data import completed successfully! ${stores.length} stores loaded.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Store data import failed:', error);
      process.exit(1);
    });
}

export { loadStoreDataFromExcel };