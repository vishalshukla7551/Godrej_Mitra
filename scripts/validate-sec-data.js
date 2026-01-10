#!/usr/bin/env node

/**
 * SEC DATA VALIDATION SCRIPT
 * 
 * This script validates the SEC data before migration to identify
 * any potential issues or conflicts.
 */

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateSecData() {
  try {
    console.log('=== SEC DATA VALIDATION ===\n');
    
    // Load SEC data
    const secDataPath = './sec_users.json';
    if (!fs.existsSync(secDataPath)) {
      throw new Error('sec_users.json file not found');
    }
    
    const rawData = fs.readFileSync(secDataPath, 'utf8');
    const secUsers = JSON.parse(rawData);
    
    console.log(`📊 Total SEC users: ${secUsers.length}\n`);
    
    // Validation statistics
    const stats = {
      total: secUsers.length,
      validPhone: 0,
      invalidPhone: 0,
      hasName: 0,
      hasSecId: 0,
      duplicatePhones: 0,
      existingCanvassers: 0
    };
    
    const phoneNumbers = new Set();
    const duplicates = new Set();
    const invalidPhones = [];
    
    // Check existing Canvassers
    const existingCanvassers = await prisma.canvasser.findMany({
      select: { phone: true, fullName: true, employeeId: true }
    });
    const existingPhones = new Set(existingCanvassers.map(c => c.phone));
    
    console.log(`📋 Existing Canvassers in database: ${existingCanvassers.length}\n`);
    
    // Validate each SEC user
    for (const secUser of secUsers) {
      const phone = secUser.phone;
      
      // Phone validation
      if (!phone || typeof phone !== 'string' || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        stats.invalidPhone++;
        invalidPhones.push({ phone, id: secUser._id });
      } else {
        stats.validPhone++;
      }
      
      // Check for duplicates
      if (phoneNumbers.has(phone)) {
        duplicates.add(phone);
        stats.duplicatePhones++;
      } else {
        phoneNumbers.add(phone);
      }
      
      // Check if already exists as Canvasser
      if (existingPhones.has(phone)) {
        stats.existingCanvassers++;
      }
      
      // Check for name and secId
      if (secUser.name) stats.hasName++;
      if (secUser.secId) stats.hasSecId++;
    }
    
    // Print validation results
    console.log('📈 VALIDATION RESULTS:');
    console.log(`✅ Valid phone numbers: ${stats.validPhone}`);
    console.log(`❌ Invalid phone numbers: ${stats.invalidPhone}`);
    console.log(`👤 Users with names: ${stats.hasName}`);
    console.log(`🆔 Users with SEC IDs: ${stats.hasSecId}`);
    console.log(`🔄 Duplicate phone numbers: ${duplicates.size}`);
    console.log(`📞 Already exist as Canvassers: ${stats.existingCanvassers}\n`);
    
    // Show invalid phones
    if (invalidPhones.length > 0) {
      console.log('❌ INVALID PHONE NUMBERS:');
      invalidPhones.slice(0, 10).forEach(item => {
        console.log(`   ${item.phone} (ID: ${item.id?.$oid || item.id})`);
      });
      if (invalidPhones.length > 10) {
        console.log(`   ... and ${invalidPhones.length - 10} more`);
      }
      console.log();
    }
    
    // Show duplicates
    if (duplicates.size > 0) {
      console.log('🔄 DUPLICATE PHONE NUMBERS:');
      Array.from(duplicates).slice(0, 10).forEach(phone => {
        console.log(`   ${phone}`);
      });
      if (duplicates.size > 10) {
        console.log(`   ... and ${duplicates.size - 10} more`);
      }
      console.log();
    }
    
    // Show existing Canvassers that will be updated
    if (stats.existingCanvassers > 0) {
      console.log('📞 EXISTING CANVASSERS (will be updated):');
      const conflictingCanvassers = existingCanvassers.filter(c => phoneNumbers.has(c.phone));
      conflictingCanvassers.slice(0, 10).forEach(canvasser => {
        console.log(`   ${canvasser.phone} - ${canvasser.fullName || 'No name'} (ID: ${canvasser.employeeId || 'No ID'})`);
      });
      if (conflictingCanvassers.length > 10) {
        console.log(`   ... and ${conflictingCanvassers.length - 10} more`);
      }
      console.log();
    }
    
    // Migration recommendations
    console.log('💡 MIGRATION RECOMMENDATIONS:');
    if (stats.invalidPhone > 0) {
      console.log(`⚠️  ${stats.invalidPhone} users have invalid phone numbers and will be skipped`);
    }
    if (duplicates.size > 0) {
      console.log(`⚠️  ${duplicates.size} duplicate phone numbers found - only the last occurrence will be kept`);
    }
    if (stats.existingCanvassers > 0) {
      console.log(`ℹ️  ${stats.existingCanvassers} users already exist as Canvassers and will be updated`);
    }
    
    const migratable = stats.validPhone - duplicates.size;
    console.log(`✅ ${migratable} users can be successfully migrated`);
    
    console.log('\n🚀 Ready for migration! Run the migration script when ready.');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateSecData();