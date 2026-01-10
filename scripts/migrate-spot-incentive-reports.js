#!/usr/bin/env node

/**
 * MIGRATE SPOT INCENTIVE REPORTS SCRIPT
 * 
 * This script migrates SpotIncentiveReport records from using secId to canvasserId
 * by mapping the old SEC ObjectIds to the new Canvasser ObjectIds based on phone numbers
 * 
 * SAFETY FEATURES:
 * 1. Dry run mode by default
 * 2. Backup creation before migration
 * 3. Detailed logging
 */

const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run
const BACKUP_DIR = './migration-backups';
const LOG_FILE = `${BACKUP_DIR}/spot-reports-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Logging function
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Get MongoDB connection from Prisma DATABASE_URL
function getMongoUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return databaseUrl;
}

// Create mapping from SEC ObjectIds to Canvasser ObjectIds
async function createSecToCanvasserMapping() {
  let mongoClient;
  try {
    const mongoUrl = getMongoUrl();
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    
    const db = mongoClient.db();
    
    // Get all SEC records with their ObjectIds and phone numbers
    const secRecords = await db.collection('SEC').find({}, { 
      projection: { _id: 1, phone: 1 } 
    }).toArray();
    
    log(`Found ${secRecords.length} SEC records`);
    
    // Get all Canvasser records with their ObjectIds and phone numbers
    const canvasserRecords = await prisma.canvasser.findMany({
      select: { id: true, phone: true }
    });
    
    log(`Found ${canvasserRecords.length} Canvasser records`);
    
    // Create mapping: SEC ObjectId -> Canvasser ObjectId
    const mapping = new Map();
    
    for (const secRecord of secRecords) {
      const phone = secRecord.phone;
      const canvasserRecord = canvasserRecords.find(c => c.phone === phone);
      
      if (canvasserRecord) {
        mapping.set(secRecord._id.toString(), canvasserRecord.id);
        log(`Mapped SEC ${secRecord._id} (${phone}) -> Canvasser ${canvasserRecord.id}`);
      } else {
        log(`No Canvasser found for SEC ${secRecord._id} (${phone})`, 'WARN');
      }
    }
    
    log(`Created mapping for ${mapping.size} SEC -> Canvasser pairs`);
    return mapping;
    
  } catch (error) {
    log(`Error creating mapping: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// Create backup of SpotIncentiveReport data
async function createBackup() {
  let mongoClient;
  try {
    log('Creating backup of SpotIncentiveReport data...');
    
    const mongoUrl = getMongoUrl();
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    
    const db = mongoClient.db();
    const reports = await db.collection('SpotIncentiveReport').find({}).toArray();
    
    const backupFile = `${BACKUP_DIR}/spot-reports-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(reports, null, 2));
    
    log(`Backup created: ${backupFile} (${reports.length} records)`);
    return backupFile;
    
  } catch (error) {
    log(`Error creating backup: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// Main migration function
async function migrateSpotIncentiveReports() {
  const stats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0
  };
  
  let mongoClient;
  
  try {
    log('=== SPOT INCENTIVE REPORTS MIGRATION STARTED ===');
    log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    
    // Create SEC to Canvasser mapping
    const secToCanvasserMap = await createSecToCanvasserMapping();
    
    // Create backup
    const backupFile = await createBackup();
    
    // Connect to MongoDB for direct updates
    const mongoUrl = getMongoUrl();
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    const db = mongoClient.db();
    const collection = db.collection('SpotIncentiveReport');
    
    // Get all SpotIncentiveReport records with secId
    const reports = await collection.find({ 
      secId: { $exists: true, $ne: null } 
    }).toArray();
    
    stats.total = reports.length;
    log(`Found ${stats.total} SpotIncentiveReport records with secId`);
    
    // Process each report
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      const secId = report.secId.toString();
      const canvasserId = secToCanvasserMap.get(secId);
      
      log(`Processing ${i + 1}/${reports.length}: Report ${report._id}`);
      
      if (canvasserId) {
        if (!DRY_RUN) {
          // Update the document: add canvasserId and remove secId
          await collection.updateOne(
            { _id: report._id },
            {
              $set: { canvasserId: canvasserId },
              $unset: { secId: "" }
            }
          );
        }
        
        log(`  Mapped secId ${secId} -> canvasserId ${canvasserId}`);
        stats.migrated++;
      } else {
        log(`  No Canvasser mapping found for secId ${secId}`, 'WARN');
        stats.skipped++;
      }
    }
    
    // Final statistics
    log('=== MIGRATION COMPLETED ===');
    log(`Total reports: ${stats.total}`);
    log(`Migrated: ${stats.migrated}`);
    log(`Skipped: ${stats.skipped}`);
    log(`Errors: ${stats.errors}`);
    log(`Backup file: ${backupFile}`);
    
    if (DRY_RUN) {
      log('*** THIS WAS A DRY RUN - NO DATA WAS ACTUALLY MODIFIED ***');
      log('To run the actual migration, set DRY_RUN=false');
    }
    
    return stats;
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// CLI handling
async function main() {
  try {
    await migrateSpotIncentiveReports();
  } catch (error) {
    log(`Script failed: ${error.message}`, 'ERROR');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  migrateSpotIncentiveReports
};