#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

import { wordKeyFromWord, TheWordsDatabase } from "../src/the-words/the-words-types";

//
// Process command line
//

if (process.argv.length < 3) {
  console.error(
    `Usage: ts-node ${process.argv[1]} <path-to-words-text-file> [<path-to-generated-output>]`
  );
  process.exit(1);
}

const wordsSourceFile = process.argv[2];
const wordsDatabaseDestinationFile = process.argv.length >= 3 ? process.argv[3] : null;

//
// Read data
//

const wordsData = fs.readFileSync(wordsSourceFile, "utf-8");

//
// Process data
//

const wordsDb: TheWordsDatabase = {
  KeyToDisplayName: new Map(),
  DisplayNameToDefinition: new Map(),
  DisplayNamesInDisplayOrder: [],
};

const wordKeyToLineNumber = new Map<string, number>();

// Initial cleaning
const wordsList = wordsData.split(/\r?\n/).map((line) => line.trim());

// Parse `term - definition`
wordsList.forEach((line, index) => {
  function syntaxError(message: string) {
    console.error(`${message} on line ${index + 1}:`);
    console.error("  " + line);

    process.exit(5);
  }

  // Filter out empty and comment-only lines here so we still get accurate line numbers
  if (!line || line.startsWith(";")) {
    return;
  }

  // Split line into term (word) and definition
  const separatorIndex = line.indexOf("-");

  if (separatorIndex < 0) {
    syntaxError("Missing '=' separator");
  }

  const displayName = line.slice(0, separatorIndex).trim();
  const definition = line.slice(separatorIndex + 1).trim();

  if (!displayName) {
    syntaxError("Missing Term to the left of the '-' separator");
  }

  if (!definition) {
    syntaxError("Missing Definition to the right of the '-' separator");
  }

  if (displayName.includes('"')) {
    syntaxError(`Term "${displayName}" should not include a quote (")`);
  }

  // Check for duplicates
  const primaryWordKey = wordKeyFromWord(displayName);

  if (wordKeyToLineNumber.has(primaryWordKey)) {
    syntaxError(
      `Word "${displayName}" previously defined on line ${wordKeyToLineNumber.get(
        primaryWordKey
      )}, redefined`
    );
  }

  // Commit primary word key
  wordKeyToLineNumber.set(primaryWordKey, index);

  wordsDb.KeyToDisplayName.set(primaryWordKey, displayName);
  wordsDb.DisplayNameToDefinition.set(displayName, definition);
  wordsDb.DisplayNamesInDisplayOrder.push(displayName);

  // Split display name, if required
  const splitDisplayName = displayName.split("/").map((word) => word.trim());

  splitDisplayName.forEach((secondaryDisplayName) => {
    // Syntax validation
    if (!secondaryDisplayName) {
      syntaxError(`Word "${displayName}" contains empty sections between slashes`);
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
