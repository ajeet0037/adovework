#!/usr/bin/env node

/**
 * Verification script for code improvements
 * Checks that all improvements are properly integrated
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Files that should exist
const requiredFiles = [
  'lib/utils/sanitize.ts',
  'lib/utils/env.ts',
  'lib/utils/errorHandler.ts',
];

// Files that should import sanitize
const filesWithSanitize = [
  'app/api/convert/excel-to-pdf/route.ts',
  'app/api/convert/word-to-pdf/route.ts',
  'app/api/convert/pdf-to-excel/route.ts',
  'app/api/convert/pdf-to-word/route.ts',
  'app/api/convert/ppt-to-pdf/route.ts',
  'app/api/convert/pdf-to-ppt/route.ts',
];

// Files that should be updated
const updatedFiles = [
  'components/layout/Header.tsx',
  'app/api/cleanup/route.ts',
  'lib/constants/limits.ts',
  'lib/utils/fileValidation.ts',
];

let errors = [];
let warnings = [];
let success = [];

console.log('🔍 Verifying Code Improvements...\n');

// Check required files exist
console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${file} exists`);
  } else {
    errors.push(`❌ ${file} is missing`);
  }
});

// Check files import sanitize
console.log('\n🔒 Checking filename sanitization...');
filesWithSanitize.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('sanitizeFilenameWithExtension')) {
      success.push(`✅ ${file} uses sanitization`);
    } else {
      warnings.push(`⚠️  ${file} may not be using sanitization`);
    }
  } else {
    errors.push(`❌ ${file} not found`);
  }
});

// Check updated files
console.log('\n📝 Checking updated files...');
updatedFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${file} exists`);
  } else {
    warnings.push(`⚠️  ${file} not found (may have been moved)`);
  }
});

// Check Header.tsx fix
console.log('\n🔧 Checking Header.tsx fix...');
const headerPath = path.join(projectRoot, 'components/layout/Header.tsx');
if (fs.existsSync(headerPath)) {
  const content = fs.readFileSync(headerPath, 'utf-8');
  if (content.includes('${category.color}') && !content.includes('className={`')) {
    errors.push('❌ Header.tsx may still have syntax error');
  } else if (content.includes('className={`') && content.includes('${category.color}')) {
    success.push('✅ Header.tsx syntax fixed');
  }
}

// Check cleanup route fix
console.log('\n🔐 Checking cleanup route security...');
const cleanupPath = path.join(projectRoot, 'app/api/cleanup/route.ts');
if (fs.existsSync(cleanupPath)) {
  const content = fs.readFileSync(cleanupPath, 'utf-8');
  if (content.includes("'default-cleanup-secret'")) {
    errors.push('❌ Cleanup route still has default secret');
  } else if (content.includes('CLEANUP_SECRET') && content.includes('process.env')) {
    success.push('✅ Cleanup route security fixed');
  }
}

// Check constants consolidation
console.log('\n📊 Checking constants consolidation...');
const limitsPath = path.join(projectRoot, 'lib/constants/limits.ts');
const validationPath = path.join(projectRoot, 'lib/utils/fileValidation.ts');
if (fs.existsSync(limitsPath) && fs.existsSync(validationPath)) {
  const limitsContent = fs.readFileSync(limitsPath, 'utf-8');
  const validationContent = fs.readFileSync(validationPath, 'utf-8');
  
  if (validationContent.includes('PREMIUM_FILE_LIMITS') && !validationContent.includes('from')) {
    errors.push('❌ fileValidation.ts still has duplicate constants');
  } else if (validationContent.includes('from') && validationContent.includes('limits')) {
    success.push('✅ Constants consolidated');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY\n');

if (success.length > 0) {
  console.log('✅ Successes:');
  success.forEach(msg => console.log(`   ${msg}`));
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(msg => console.log(`   ${msg}`));
  console.log();
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(msg => console.log(`   ${msg}`));
  console.log();
  process.exit(1);
} else {
  console.log('🎉 All verifications passed!\n');
  console.log(`✅ ${success.length} checks passed`);
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warnings`);
  }
  process.exit(0);
}

