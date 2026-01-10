#!/usr/bin/env node

/**
 * CLEANUP CANVASSER DATA SCRIPT
 * 
 * This script removes the old JSON-based Canvasser records and keeps only
 * the 35 real SEC users that were migrated from the database.
 * 
 * SAFETY FEATURES:
 * 1. Dry run mode by default
 * 2. Backup creation before cleanup
 * 3. Identifies records by migration source
 * 4. Detailed logging
 */

const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run
const BACKUP_DIR = './migration-backups';
const LOG_FILE = `${BACKUP_DIR}/cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;

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

// Get real SEC phone numbers from database
async function getRealSecPhoneNumbers() {
  let mongoClient;
  try {
    const mongoUrl = getMongoUrl();
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    
    const db = mongoClient.db();
    const secCollection = db.collection('SEC');
    
    const secUsers = await secCollection.find({}, { projection: { phone: 1 } }).toArray();
    const phoneNumbers = secUsers.map(user => user.phone).filter(phone => phone);
    
    log(`Found ${phoneNumbers.length} real SEC phone numbers in database`);
    return new Set(phoneNumbers);
  } catch (error) {
    log(`Error loading SEC phone numbers: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// Create backup of current Canvasser data
async function createBackup() {
  try {
    log('Creating backup of current Canvasser data...');
    
    const allCanvassers = await prisma.canvasser.findMany();
    const backupFile = `${BACKUP_DIR}/cleanup-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    fs.writeFileSync(backupFile, JSON.stringify(allCanvassers, null, 2));
    log(`Backup created: ${backupFile} (${allCanvassers.length} records)`);
    
    return backupFile;
  } catch (error) {
    log(`Error creating backup: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Main cleanup function
async function cleanupCanvasserData() {
  const stats = {
    totalCanvassers: 0,
    realSecCanvassers: 0,
    jsonCanvassers: 0,
    deleted: 0,
    kept: 0,
    errors: 0
  };
  
  try {
    log('=== CANVASSER DATA CLEANUP STARTED ===');
    log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE CLEANUP'}`);
    
    // Get real SEC phone numbers from database
    const realSecPhones = await getRealSecPhoneNumbers();
    
    // Get all current Canvassers
    const allCanvassers = await prisma.canvasser.findMany();
    stats.totalCanvassers = allCanvassers.length;
    
    log(`Total Canvassers in database: ${stats.totalCanvassers}`);
    log(`Real SEC phone numbers: ${realSecPhones.size}`);
    
    // Create backup
    const backupFile = await createBackup();
    
    // Analyze and categorize Canvassers
    const toKeep = [];
    const toDelete = [];
    
    for (const canvasser of allCanvassers) {
      if (realSecPhones.has(canvasser.phone)) {
        // This is a real SEC user - keep it
        toKeep.push(canvasser);
        stats.realSecCanvassers++;
      } else {
        // This is from the JSON file - delete it
        toDelete.push(canvasser);
        stats.jsonCanvassers++;
      }
    }
    
    log(`Canvassers to keep (real SEC): ${toKeep.length}`);
    log(`Canvassers to delete (from JSON): ${toDelete.length}`);
    
    // Show sample of records to be deleted
    if (toDelete.length > 0) {
      log('Sample records to be deleted:');
      toDelete.slice(0, 10).forEach(c => {
        log(`  - ${c.phone}: ${c.fullName || 'No name'} (ID: ${c.employeeId || 'None'})`);
      });
      if (toDelete.length > 10) {
        log(`  ... and ${toDelete.length - 10} more`);
      }
    }
    
    // Show sample of records to be kept
    if (toKeep.length > 0) {
      log('Sample records to be kept:');
      toKeep.slice(0, 10).forEach(c => {
        log(`  + ${c.phone}: ${c.fullName || 'No name'} (ID: ${c.employeeId || 'None'})`);
      });
      if (toKeep.length > 10) {
        log(`  ... and ${toKeep.length - 10} more`);
      }
    }
    
    // Perform cleanup
    if (toDelete.length > 0) {
      log('Starting cleanup process...');
      
      if (!DRY_RUN) {
        // Delete records that are not real SEC users
        const phoneNumbersToDelete = toDelete.map(c => c.phone);
        
        const deleteResult = await prisma.canvasser.deleteMany({
          where: {
            phone: {
              in: phoneNumbersToDelete
            }
          }
        });
        
        stats.deleted = deleteResult.count;
        stats.kept = toKeep.length;
        
        log(`Deleted ${stats.deleted} JSON-based Canvasser records`);
        log(`Kept ${stats.kept} real SEC-based Canvasser records`);
      } else {
        stats.deleted = toDelete.length;
        stats.kept = toKeep.length;
        log(`Would delete ${stats.deleted} JSON-based Canvasser records`);
        log(`Would keep ${stats.kept} real SEC-based Canvasser records`);
      }
    } else {
      log('No cleanup needed - all Canvassers are real SEC users');
    }
    
    // Final statistics
    log('=== CLEANUP COMPLETED ===');
    log(`Total Canvassers before: ${stats.totalCanvassers}`);
    log(`Real SEC Canvassers: ${stats.realSecCanvassers}`);
    log(`JSON-based Canvassers: ${stats.jsonCanvassers}`);
    log(`Deleted: ${stats.deleted}`);
    log(`Kept: ${stats.kept}`);
    log(`Errors: ${stats.errors}`);
    log(`Backup file: ${backupFile}`);
    
    if (DRY_RUN) {
      log('*** THIS WAS A DRY RUN - NO DATA WAS ACTUALLY MODIFIED ***');
      log('To run the actual cleanup, set DRY_RUN=false');
    }
    
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Rollback function
async function rollback(backupFile) {
  try {
    log(`Rolling back from backup: ${backupFile}`);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    // Delete all current Canvasser records
    await prisma.canvasser.deleteMany();
    log('Deleted all current Canvasser records');
    
    // Restore from backup
    for (const canvasser of backupData) {
      await prisma.canvasser.create({
        data: {
          id: canvasser.id,
          fullName: canvasser.fullName,
          phone: canvasser.phone,
          employeeId: canvasser.employeeId,
          email: canvasser.email,
          kycInfo: canvasser.kycInfo,
          lastLoginAt: canvasser.lastLoginAt ? new Date(canvasser.lastLoginAt) : null,
          storeId: canvasser.storeId,
          city: canvasser.city,
          AgencyName: canvasser.AgencyName,
          AgentCode: canvasser.AgentCode,
          createdAt: new Date(canvasser.createdAt),
          updatedAt: new Date(canvasser.updatedAt),
        }
      });
    }
    
    log(`Rollback completed. Restored ${backupData.length} records.`);
  } catch (error) {
    log(`Rollback failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// CLI handling
async function main() {
  const command = process.argv[2];
  
  try {
    if (command === 'rollback') {
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('Usage: node cleanup-canvasser-data.js rollback <backup-file>');
        process.exit(1);
      }
      await rollback(backupFile);
    } else {
      await cleanupCanvasserData();
    }
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
  cleanupCanvasserData,
  rollback,
  getRealSecPhoneNumbers
};