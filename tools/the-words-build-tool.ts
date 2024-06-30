#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";
import * as yup from "yup";

import { wordKeyFromWord, TheWordsDatabase } from "../src/the-words/the-words-types";

//
// Process command line
//

if (process.argv.length < 2) {
  console.error(`Usage: ts-node ${process.argv[1]} [<path-to-generated-output>]`);
  process.exit(1);
}

const wordsDatabaseDestinationFile = process.argv.length >= 2 ? process.argv[2] : null;

//
// Read data
//

export const wordsDataFile = "./src/the-words/data/the-words.json";

function readTheWordsData() {
  const wordSchema = yup.object({
    word: yup.string().required(),
    definition: yup.string().required(),
  });

  const wordsFileSchema = yup.object({
    "the-words": yup.array().of(wordSchema).required(),
  });

  const wordsData = fs.readFileSync(wordsDataFile, "utf-8");
  const wordsJson = JSON.parse(wordsData);

  const wordsEnvelope = wordsFileSchema.validateSync(wordsJson, { stripUnknown: true });

  return wordsEnvelope["the-words"];
}

const wordsData = readTheWordsData();

//
// Process data
//

const wordsDb: TheWordsDatabase = {
  KeyToDisplayName: new Map(),
  DisplayNameToDefinition: new Map(),
  DisplayNamesInDisplayOrder: [],
};

wordsData.forEach((wordData) => {
  const displayName = wordData.word.replace(/\"/g, "").trim();
  const definition = wordData.definition.replace(/(\r\n|\r|\n)/g, " ").trim();

  // Check for duplicates
  if (wordsDb.DisplayNameToDefinition.has(displayName)) {
    // Ignore this one
    return;
  }

  // Commit primary word key
  const primaryWordKey = wordKeyFromWord(displayName);

  wordsDb.KeyToDisplayName.set(primaryWordKey, displayName);
  wordsDb.DisplayNameToDefinition.set(displayName, definition);
  wordsDb.DisplayNamesInDisplayOrder.push(displayName);

  // Split display name, if required
  const splitDisplayName = displayName.split("/").map((word) => word.trim());

  splitDisplayName.forEach((secondaryDisplayName) => {
    // Syntax validation
    if (!secondaryDisplayName) {
      // Ignore this one
      return;
    }

    // Commit secondary word key, mapping to primary display name
    const secondaryWordKey = wordKeyFromWord(secondaryDisplayName);

    wordsDb.KeyToDisplayName.set(secondaryWordKey, displayName);
  });
});

//
// Output data
//

if (!wordsDatabaseDestinationFile) {
  // Dump database for testing purposes
  console.log(wordsDb);
  process.exit(0);
}

// Ensure output directory exists
const outputDirectory = path.dirname(wordsDatabaseDestinationFile);

if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

// Write output
const outputStream = fs.createWriteStream(wordsDatabaseDestinationFile, {
  encoding: "utf-8",
  flags: "w",
});

// - Imports
outputStream.write(`import { TheWordsDatabase } from "../the-words-types";\n`);
// - Top-level
outputStream.write(`export const theWordsDb: TheWordsDatabase = {\n`);

// - KeyToDisplayName
outputStream.write(` KeyToDisplayName: new Map<string, string>([\n`);

wordsDb.KeyToDisplayName.forEach((value, key) => {
  outputStream.write(`    ["${key}", "${value}"],\n`);
});

outputStream.write(` ]),\n`);

// - DisplayNameToDefinition
outputStream.write(` DisplayNameToDefinition: new Map<string, string>([\n`);

wordsDb.DisplayNameToDefinition.forEach((value, key) => {
  outputStream.write(`    ["${key}", "${value.replace(/"/g, '\\"')}"],\n`);
});

outputStream.write(` ]),\n`);

// - DisplayNamesInDisplayOrder
outputStream.write(`  DisplayNamesInDisplayOrder: [\n`);

wordsDb.DisplayNamesInDisplayOrder.forEach((displayName) => {
  outputStream.write(`  "${displayName}",\n`);
});

outputStream.write(` ],\n`);

// - Close out top-level
outputStream.write(`};\n`);

outputStream.end();
