#!/usr/bin/env ts-node

/**
 * Vocabulary Data Validation Script
 *
 * Validates generated JSON vocabulary files against schema and checks data integrity.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const VOCABULARY_DIR = path.join(__dirname, '../src/assets/vocabulary');

// Zod schemas mirroring TypeScript types
const VocabularyWordSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  definition: z.string().min(1),
  fillInBlank: z.string().min(1),
  examples: z.array(z.string()).optional(),
  synonyms: z.array(z.string()).optional(),
});

const VocabularyLevelSchema = z.object({
  id: z.enum(['basic', 'intermediate', 'advanced', 'expert', 'professional']),
  name: z.string().min(1),
  words: z.array(VocabularyWordSchema).min(1),
});

const VocabularyListSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  levels: z.array(VocabularyLevelSchema).min(1),
});

interface ValidationResult {
  file: string;
  success: boolean;
  wordCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Check if fillInBlank contains a blank placeholder
 */
function hasBlankPlaceholder(text: string): boolean {
  return text.includes('___') || text.includes('____') || text.includes('_____');
}

/**
 * Check for duplicate word IDs in a level
 */
function hasDuplicateIds(words: z.infer<typeof VocabularyWordSchema>[]): string[] {
  const ids = words.map((w) => w.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  return [...new Set(duplicates)];
}

/**
 * Validate a single vocabulary JSON file
 */
function validateFile(filePath: string): ValidationResult {
  const fileName = path.basename(filePath);
  const result: ValidationResult = {
    file: fileName,
    success: true,
    wordCount: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Read and parse JSON
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Validate against schema
    const validationResult = VocabularyListSchema.safeParse(data);

    if (!validationResult.success) {
      result.success = false;
      result.errors.push(`Schema validation failed: ${validationResult.error.message}`);
      return result;
    }

    const list = validationResult.data;

    // Count total words
    result.wordCount = list.levels.reduce((total, level) => total + level.words.length, 0);

    // Data integrity checks
    for (const level of list.levels) {
      // Check for duplicate IDs
      const duplicateIds = hasDuplicateIds(level.words);
      if (duplicateIds.length > 0) {
        result.errors.push(`Duplicate word IDs in ${level.id}: ${duplicateIds.join(', ')}`);
        result.success = false;
      }

      // Check fillInBlank placeholders and empty strings
      for (const word of level.words) {
        if (!hasBlankPlaceholder(word.fillInBlank)) {
          result.warnings.push(
            `Word "${word.word}" (${word.id}): fillInBlank missing blank placeholder`
          );
        }

        if (word.word.trim() === '') {
          result.errors.push(`Word ${word.id}: word field is empty`);
          result.success = false;
        }

        if (word.definition.trim() === '') {
          result.errors.push(`Word ${word.id}: definition field is empty`);
          result.success = false;
        }

        if (word.fillInBlank.trim() === '') {
          result.errors.push(`Word ${word.id}: fillInBlank field is empty`);
          result.success = false;
        }
      }
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Failed to read/parse file: ${error}`);
    return result;
  }
}

/**
 * Run validation on all vocabulary files
 */
async function validateAllFiles() {
  console.log('Validating vocabulary data...\n');

  // Find all JSON files
  const files = fs
    .readdirSync(VOCABULARY_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => path.join(VOCABULARY_DIR, file))
    .sort();

  if (files.length === 0) {
    console.error('❌ No JSON files found in', VOCABULARY_DIR);
    process.exit(1);
  }

  // Validate each file
  const results: ValidationResult[] = [];
  let totalWords = 0;
  let hasErrors = false;

  for (const file of files) {
    const result = validateFile(file);
    results.push(result);
    totalWords += result.wordCount;

    // Display result
    if (result.success) {
      console.log(`✅ ${result.file}: ${result.wordCount} words validated`);
      if (result.warnings.length > 0) {
        result.warnings.forEach((warning) => console.log(`   ⚠️  ${warning}`));
      }
    } else {
      console.log(`❌ ${result.file}: VALIDATION FAILED`);
      result.errors.forEach((error) => console.log(`   • ${error}`));
      hasErrors = true;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`Total lists: ${results.length}`);
  console.log(`Total words: ${totalWords}`);
  console.log(`All files valid: ${hasErrors ? '❌' : '✅'}`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  if (hasErrors) {
    console.error('\n❌ Validation failed. Please fix errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All vocabulary data is valid!');
    process.exit(0);
  }
}

// Run validation
validateAllFiles();
