#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";
import * as yup from "yup";

import {
  Production,
  ProductionStatusValues,
  Shot,
  Timestamp,
} from "../src/the-shots/the-shots-types";

//
// Process command line
//

if (process.argv.length < 4) {
  console.error(
    `Usage: ts-node ${process.argv[1]} <path-to-shots-data-directory> <path-to-shot-tags-file> [<path-to-generated-output>]`
  );
  process.exit(1);
}

const shotsSourceDirectory = process.argv[2];
const shotTagsSourceFile = process.argv[3];
const shotsDatabaseDestinationFile = process.argv.length >= 4 ? process.argv[4] : null;

//
// Read list of known/allowed shot tags
//

function readKnownShotTags(sourceFile: string) {
  const shotTagSchema = yup.object({
    "shot-tag": yup.string().required(),
  });

  const shotTagsFileSchema = yup.object({
    "shot-tags": yup.array().of(shotTagSchema),
  });

  const shotTagsData = fs.readFileSync(sourceFile, "utf-8");
  const shotTagsJson = JSON.parse(shotTagsData);

  const shotTagsEnvelope = shotTagsFileSchema.validateSync(shotTagsJson, { stripUnknown: true });

  return shotTagsEnvelope["shot-tags"].flatMap((t) => t["shot-tag"]);
}

const shotTags = readKnownShotTags(shotTagsSourceFile);

//
// Define data shape
//

const productionNameAndYearRegex = /(.+)\((\d{4})\)/;
const productionImdbLinkRegex = /^https:\/\/www\.imdb\.com\/title\/(tt\d+)/;
const operatorNameRegex = /(\p{Letter}+) (\p{Letter}+)/u;

export const productionShotSchema = yup.object({
  // Operator info
  operatorName: yup.string().required().matches(operatorNameRegex),
  secondaryOperatorName: yup.string().matches(operatorNameRegex, { excludeEmptyString: true }),
  // Optional metadata
  timestamp: yup.string().matches(/^\d+:(?:\d{2}:)?\d{2}$/, { excludeEmptyString: true }),
  directorName: yup.string(),
  dpName: yup.string(),
  episodic: yup.object({
    season: yup
      .number()
      .integer()
      // .transform() empty strings left behind when there _was_ a number and it was removed
      // (DecapCMS handles this somewhat poorly)
      .transform((value, originalValue) => (originalValue === "" ? undefined : value)),
    episode: yup
      .number()
      .integer()
      .transform((value, originalValue) => (originalValue === "" ? undefined : value)),
    episodeTitle: yup.string(),
  }),
  tags: yup.array().of(yup.string().oneOf(shotTags)),
  vimeoId: yup
    .number()
    .integer()
    .transform((value, originalValue) => (originalValue === "" ? undefined : value)),
  // Content
  shortDescription: yup.string().required(),
  description: yup.string().required(),
  // Optional additional content
  operatorComments: yup.string(),
  equipment: yup.string(),
});

export const productionFileSchema = yup
  .object({
    productionName: yup.string().required().matches(productionNameAndYearRegex),
    status: yup.string().required().oneOf(ProductionStatusValues),
    productionImdbLink: yup.string().matches(productionImdbLinkRegex, { excludeEmptyString: true }),
    shots: yup.array().of(productionShotSchema),
  })
  .required();

//
// Read shots data
//

const productions = new Array<yup.InferType<typeof productionFileSchema>>();

const productionFiles = fs.readdirSync(shotsSourceDirectory);

productionFiles.forEach((productionFileName) => {
  const productionFilePath = path.join(shotsSourceDirectory, productionFileName);
  const productionData = fs.readFileSync(productionFilePath, "utf-8");
  const productionJson = JSON.parse(productionData);

  const production = productionFileSchema.validateSync(productionJson, { stripUnknown: true });

  productions.push(production);
});

//
// Project data
//

function parseTimestamp(timestamp?: string): Timestamp | undefined {
  if (!timestamp) {
    return undefined;
  }

  const timestampSegments = timestamp.split(":");

  return {
    hours: timestampSegments.length == 3 ? parseInt(timestampSegments[0]) : 0,
    minutes: parseInt(timestampSegments[timestampSegments.length - 2]),
    seconds: parseInt(timestampSegments[timestampSegments.length - 1]),
  };
}

function parseShot(shot: yup.InferType<typeof productionShotSchema>): Shot {
  return {
    ...shot,
    timestamp: parseTimestamp(shot.timestamp),
    // Fix up typing of non-optional fields (yup type inference is being special)
    operatorName: shot.operatorName as string, // Validated by yup above (but typed poorly)
    shortDescription: shot.shortDescription as string,
    description: shot.description as string,
  };
}

function parseProductionNameAndYear(productionName: string) {
  const productionNameAndYear = productionName.match(productionNameAndYearRegex); // Validated by yup above

  return {
    productionName: productionNameAndYear[1].trim(), // [1] = first capture group
    productionYear: parseInt(productionNameAndYear[2]), // [2] = second capture group
  };
}

function parseProductionImdbLink(productionImdbLink?: string) {
  if (!productionImdbLink) {
    return undefined;
  }

  const productionImdbLinkComponents = productionImdbLink.match(productionImdbLinkRegex); // Validated by yup above

  return productionImdbLinkComponents[1].trim(); // [1] = first capture group = `tt\d+`
}

const shotsDb: Production[] = productions
  .filter((production) => production.status === "published")
  .map((production) => {
    return {
      ...parseProductionNameAndYear(production.productionName),
      imdbTitleId: parseProductionImdbLink(production.productionImdbLink),
      status: production.status,
      shots: production.shots.map((shot) => parseShot(shot)),
    };
  });

//
// Output data
//

// Ensure output directory exists
const outputDirectory = path.dirname(shotsDatabaseDestinationFile);

if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

// Write output
const outputStream = fs.createWriteStream(shotsDatabaseDestinationFile, {
  encoding: "utf-8",
  flags: "w",
});

// - Imports
outputStream.write(`import { Production } from "../the-shots-types";\n`);

// - Productions
//   - sort while ignoring "The " prefix
const productionsMap = new Map<string /* sort key */, Production>();

shotsDb.forEach((production) =>
  productionsMap.set(
    `${production.productionName} ${production.productionYear}`.replace(/^The +/, ""),
    production
  )
);

const sortedProductionNames = Array.from(productionsMap.keys()).sort();

outputStream.write(`export const TheShotsProductions: Production[] = [\n`);

sortedProductionNames.forEach((sortedProductionName) => {
  const production = productionsMap.get(sortedProductionName);

  outputStream.write(JSON.stringify(production, null, 2));
  outputStream.write(`,\n`);
});

outputStream.write(`];\n`);

// - Unique and sorted operators (to save a small bit of effort at runtime)
function operatorNameSortKeyForOperator(operatorName: string): string {
  const operatorNameSegments = operatorName.match(operatorNameRegex); // Validated by yup above

  const firstName = operatorNameSegments[1]; // [1] = first capture group
  const lastName = operatorNameSegments[2]; // [2] = second capture group

  return `${lastName}${firstName}`; // used for `.sort()` below
}

const operatorsMap = new Map<string, string>();
{
  shotsDb.forEach((production) => {
    production.shots.forEach((shot) => {
      operatorsMap.set(operatorNameSortKeyForOperator(shot.operatorName), shot.operatorName);

      if (shot.secondaryOperatorName) {
        operatorsMap.set(
          operatorNameSortKeyForOperator(shot.secondaryOperatorName),
          shot.secondaryOperatorName
        );
      }
    });
  });
}

const sortedOperatorNameKeys = Array.from(operatorsMap.keys()).sort();

outputStream.write(`export const TheShotsSortedOperatorNames: string[] = [\n`);

sortedOperatorNameKeys.forEach((operatorNameSortKey) => {
  outputStream.write(`  "${operatorsMap.get(operatorNameSortKey)}",\n`);
});

outputStream.write(`];\n`);

// - Tags
outputStream.write(`export const TheShotsTags: string[] = ${JSON.stringify(shotTags)};\n`);

// Close file
outputStream.end();
