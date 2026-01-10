#!/usr/bin/env node

/**
 * PRODUCTION SAFE DATABASE SEC TO CANVASSER MIGRATION SCRIPT
 * 
 * This script safely migrates SEC user data from the database SEC collection
 * to the Canvasser model without losing any production data.
 * 
 * SAFETY FEATURES:
 * 1. Dry run mode by default
 * 2. Backup creation before migration
 * 3. Rollback capability
 * 4. Detailed logging
 * 5. Data validation
 */

const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to dry run
const BACKUP_DIR = './migration-backups';
const LOG_FILE = `${BACKUP_DIR}/db-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;

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

// Load SEC data from database
async function loadSecDataFromDatabase() {
  let mongoClient;
  try {
    const mongoUrl = getMongoUrl();
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    
    const db = mongoClient.db();
    
    // Try different possible collection names for SEC data
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    log(`Available collections: ${collectionNames.join(', ')}`);
    
    // Look for SEC-related collections
    const possibleSecCollections = [
      'SEC', 'sec', 'Sec', 'secs', 'SECS', 'Secs',
      'secUsers', 'sec_users', 'SECUsers', 'SecUsers'
    ];
    
    let secCollection = null;
    let secCollectionName = null;
    
    for (const name of possibleSecCollections) {
      if (collectionNames.includes(name)) {
        secCollection = db.collection(name);
        secCollectionName = name;
        break;
      }
    }
    
    if (!secCollection) {
      throw new Error(`No SEC collection found. Available collections: ${collectionNames.join(', ')}`);
    }
    
    log(`Found SEC collection: ${secCollectionName}`);
    
    const secUsers = await secCollection.find({}).toArray();
    log(`Loaded ${secUsers.length} SEC users from database collection: ${secCollectionName}`);
    
    return secUsers;
  } catch (error) {
    log(`Error loading SEC data from database: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

// Create backup of existing Canvasser data
async function createBackup() {
  try {
    log('Creating backup of existing Canvasser data...');
    
    const existingCanvassers = await prisma.canvasser.findMany();
    const backupFile = `${BACKUP_DIR}/canvasser-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    fs.writeFileSync(backupFile, JSON.stringify(existingCanvassers, null, 2));
    log(`Backup created: ${backupFile} (${existingCanvassers.length} records)`);
    
    return backupFile;
  } catch (error) {
    log(`Error creating backup: ${error.message}`, 'ERROR');
    throw error;
  }
}

// Validate SEC user data
function validateSecUser(secUser) {
  const errors = [];
  
  if (!secUser.phone || typeof secUser.phone !== 'string') {
    errors.push('Missing or invalid phone number');
  }
  
  if (secUser.phone && secUser.phone.length !== 10) {
    errors.push(`Invalid phone number length: ${secUser.phone}`);
  }
  
  return errors;
}

// Transform SEC user to Canvasser format
function transformSecToCanvasser(secUser) {
  // Extract fields from SEC user
  const phone = secUser.phone;
  const fullName = secUser.name || secUser.fullName || null;
  const employeeId = secUser.secId || secUser.employeeId || null;
  const lastLoginAt = secUser.lastLoginAt ? new Date(secUser.lastLoginAt) : null;
  const createdAt = secUser.createdAt ? new Date(secUser.createdAt) : new Date();
  const updatedAt = secUser.updatedAt ? new Date(secUser.updatedAt) : new Date();
  
  return {
    phone,
    fullName,
    employeeId,
    lastLoginAt,
    createdAt,
    updatedAt,
    // Set default values for new fields
    email: secUser.email || null,
    kycInfo: secUser.kycInfo || null,
    storeId: secUser.storeId || null,
    city: secUser.city || null,
    AgencyName: secUser.AgencyName || null,
    AgentCode: secUser.AgentCode || null,
  };
}

// Check for existing Canvasser with same phone
async function checkExistingCanvasser(phone) {
  try {
    const existing = await prisma.canvasser.findUnique({
      where: { phone }
    });
    return existing;
  } catch (error) {
    log(`Error checking existing canvasser for phone ${phone}: ${error.message}`, 'ERROR');
    return null;
  }
}

// Migrate single SEC user to Canvasser
async function migrateSingleUser(secUser, stats) {
  const validationErrors = validateSecUser(secUser);
  if (validationErrors.length > 0) {
    log(`Validation failed for SEC user ${secUser.phone}: ${validationErrors.join(', ')}`, 'WARN');
    stats.skipped++;
    return;
  }
  
  const canvasserData = transformSecToCanvasser(secUser);
  
  try {
    // Check if Canvasser already exists
    const existing = await checkExistingCanvasser(canvasserData.phone);
    
    if (existing) {
      log(`Canvasser already exists for phone ${canvasserData.phone}, updating...`);
      
      if (!DRY_RUN) {
        await prisma.canvasser.update({
          where: { phone: canvasserData.phone },
          data: {
            fullName: canvasserData.fullName || existing.fullName,
            employeeId: canvasserData.employeeId || existing.employeeId,
            lastLoginAt: canvasserData.lastLoginAt || existing.lastLoginAt,
            updatedAt: new Date(),
          }
        });
      }
      stats.updated++;
    } else {
      log(`Creating new Canvasser for phone ${canvasserData.phone}`);
      
      if (!DRY_RUN) {
        await prisma.canvasser.create({
          data: canvasserData
        });
      }
      stats.created++;
    }
  } catch (error) {
    log(`Error migrating SEC user ${secUser.phone}: ${error.message}`, 'ERROR');
    stats.errors++;
  }
}

// Main migration function
async function migrateSecToCanvasser() {
  const stats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  try {
    log('=== DATABASE SEC TO CANVASSER MIGRATION STARTED ===');
    log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    
    // Load SEC data from database
    const secUsers = await loadSecDataFromDatabase();
    stats.total = secUsers.length;
    
    if (secUsers.length === 0) {
      log('No SEC users found in database. Migration completed with no changes.');
      return;
    }
    
    // Create backup
    const backupFile = await createBackup();
    
    // Process each SEC user
    log('Starting migration process...');
    for (let i = 0; i < secUsers.length; i++) {
      const secUser = secUsers[i];
      log(`Processing ${i + 1}/${secUsers.length}: ${secUser.phone}`);
      await migrateSingleUser(secUser, stats);
    }
    
    // Final statistics
    log('=== MIGRATION COMPLETED ===');
    log(`Total SEC users: ${stats.total}`);
    log(`Created: ${stats.created}`);
    log(`Updated: ${stats.updated}`);
    log(`Skipped: ${stats.skipped}`);
    log(`Errors: ${stats.errors}`);
    log(`Backup file: ${backupFile}`);
    
    if (DRY_RUN) {
      log('*** THIS WAS A DRY RUN - NO DATA WAS ACTUALLY MODIFIED ***');
      log('To run the actual migration, set DRY_RUN=false');
    }
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'ERROR');
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
        console.error('Usage: node migrate-database-sec-to-canvasser.js rollback <backup-file>');
        process.exit(1);
      }
      await rollback(backupFile);
    } else {
      await migrateSecToCanvasser();
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
  migrateSecToCanvasser,
  rollback,
  loadSecDataFromDatabase,
  transformSecToCanvasser
};