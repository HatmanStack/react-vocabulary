#!/usr/bin/env ts-node

/**
 * XML to JSON Migration Script
 *
 * Parses the Android app's array.xml file and generates JSON vocabulary files.
 * One JSON file per list (A-H), following the VocabularyList schema.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'xml2js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type definitions for parsed XML
interface StringArray {
  $: { name: string };
  item: string[];
}

interface ParsedXml {
  resources: {
    'string-array': StringArray[];
  };
}

// Constants
const LISTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const LEVELS = ['basic', 'intermediate', 'advanced', 'expert', 'professional'];
const LEVEL_NAMES = {
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
  professional: 'Professional',
};

// Paths
const XML_SOURCE = path.join(__dirname, '../../../app/src/main/res/values/array.xml');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/vocabulary');

/**
 * Decode HTML entities in strings
 */
function decodeHtmlEntities(text: string): string {
  return text.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

/**
 * Parse XML file and return arrays map
 */
async function parseXmlFile(): Promise<Map<string, string[]>> {
  console.log(`Reading XML from ${XML_SOURCE}...`);

  if (!fs.existsSync(XML_SOURCE)) {
    throw new Error(`XML source file not found: ${XML_SOURCE}`);
  }

  const xmlContent = fs.readFileSync(XML_SOURCE, 'utf-8');

  return new Promise((resolve, reject) => {
    parseString(xmlContent, (err: Error | null, result: ParsedXml) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('Parsing XML...');
      const arraysMap = new Map<string, string[]>();

      result.resources['string-array'].forEach((array) => {
        const name = array.$.name;
        const items = array.item.map(decodeHtmlEntities);
        arraysMap.set(name, items);
      });

      console.log(`Parsed ${arraysMap.size} arrays from XML`);
      resolve(arraysMap);
    });
  });
}

/**
 * Generate word ID
 */
function generateWordId(list: string, level: string, index: number): string {
  return `${list}-${level}-${index}`;
}

/**
 * Migrate data for all lists
 */
async function migrateData() {
  try {
    const arraysMap = await parseXmlFile();

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let totalWords = 0;

    for (const list of LISTS) {
      console.log(`\nProcessing List ${list.toUpperCase()}...`);
      const levels = [];

      for (const level of LEVELS) {
        // Build array names
        const wordListName = `${list}${level}WordList`;
        const defListName = `${list}${level}DefinitionWordList`;
        const fillInName = `${list}${level}FillInTheBlank`;

        // Get arrays
        const words = arraysMap.get(wordListName) || [];
        const definitions = arraysMap.get(defListName) || [];
        const fillInBlanks = arraysMap.get(fillInName) || [];

        // Skip if arrays are empty (might be placeholder)
        if (words.length === 0) {
          console.log(`  ⚠️  Skipping ${level} - no data found`);
          continue;
        }

        // Validate lengths match
        if (words.length !== definitions.length || words.length !== fillInBlanks.length) {
          console.warn(
            `  ⚠️  Length mismatch in ${level}: words=${words.length}, defs=${definitions.length}, fillIn=${fillInBlanks.length}`
          );
        }

        // Combine into word objects, filtering out empty entries
        const vocabWords = words
          .map((word, index) => ({
            id: generateWordId(list, level, index),
            word,
            definition: definitions[index] || '',
            fillInBlank: fillInBlanks[index] || '',
          }))
          .filter((w) => w.word.trim() !== '' && w.definition.trim() !== '');

        // Only add level if it has valid words
        if (vocabWords.length > 0) {
          levels.push({
            id: level,
            name: LEVEL_NAMES[level as keyof typeof LEVEL_NAMES],
            words: vocabWords,
          });

          totalWords += vocabWords.length;
          console.log(`  ✅ ${level}: ${vocabWords.length} words`);
        } else {
          console.log(`  ⚠️  Skipping ${level} - no valid data`);
        }
      }

      // Build list object
      const listData = {
        id: `list-${list}`,
        name: `List ${list.toUpperCase()}`,
        levels,
      };

      // Write JSON file
      const outputPath = path.join(OUTPUT_DIR, `list-${list}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(listData, null, 2), 'utf-8');
      console.log(`  📄 Generated ${outputPath}`);
    }

    console.log(
      `\n✅ Migration complete! ${LISTS.length} files generated, ${totalWords} total words.`
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
