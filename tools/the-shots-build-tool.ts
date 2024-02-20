#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";
import * as yup from "yup";

import {
  Production,
  ProductionStatusValues,
  OperatorNameRegex,
  Shot,
  Timestamp,
} from "../src/the-shots/the-shots-types";

//
// Process command line
//

if (process.argv.length < 3) {
  console.error(
    `Usage: ts-node ${process.argv[1]} <path-to-shots-data-directory> [<path-to-generated-output>]`
  );
  process.exit(1);
}

const shotsSourceDirectory = process.argv[2];
const shotsDatabaseDestinationFile = process.argv.length >= 3 ? process.argv[3] : null;

//
// Define data shape
//

const productionNameAndYearRegex = /(.+)\((\d{4})\)/;

const productionShotSchema = yup.object({
  timestamp: yup.string().matches(/^\d+:(?:\d{2}:)?\d{2}$/, { excludeEmptyString: true }),
  episode: yup.string(),
  link: yup.string().matches(/^https:\/\/vimeo.com\/\d+/, { excludeEmptyString: true }),
  shortDescription: yup.string().required(),
  description: yup.string().required(),
  operatorComments: yup.string(),
  equipment: yup.string(),
});

const productionFileSchema = yup
  .object({
    // Shot info
    productionName: yup.string().required().matches(productionNameAndYearRegex),
    status: yup.string().required().oneOf(ProductionStatusValues),
    // Operator info
    operatorName: yup.string().required().matches(OperatorNameRegex),
    secondaryOperatorName: yup.string().matches(OperatorNameRegex, { excludeEmptyString: true }),
    // Shots
    shots: yup.array().of(productionShotSchema),
  })
  .required();

//
// Read data
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

const shotsDb: Production[] = productions
  .filter((production) => production.status === "published")
  .map((production) => {
    return {
      ...parseProductionNameAndYear(production.productionName),
      status: production.status,
      operatorName: production.operatorName as string, // Validated by yup above (but typed poorly)
      secondaryOperatorName: production.secondaryOperatorName,
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
outputStream.write(`export const TheShotsProductions: Production[] = [\n`);

shotsDb.forEach((production) => {
  outputStream.write(JSON.stringify(production, null, 2));
  outputStream.write(`,\n`);
});

outputStream.write(`];\n`);

// - Unique and sorted operators
function operatorNameSortKeyForOperator(operatorName: string): string {
  const operatorNameSegments = operatorName.match(OperatorNameRegex); // Validated by yup above

  const firstName = operatorNameSegments[1]; // [1] = first capture group
  const lastName = operatorNameSegments[2]; // [2] = second capture group

  return `${lastName}${firstName}`; // used for `.sort()` below
}

const operatorsMap = new Map<string, string>();
{
  shotsDb.forEach((shot) => {
    operatorsMap.set(operatorNameSortKeyForOperator(shot.operatorName), shot.operatorName);

    if (shot.secondaryOperatorName) {
      operatorsMap.set(
        operatorNameSortKeyForOperator(shot.secondaryOperatorName),
        shot.secondaryOperatorName
      );
    }
  });
}

const sortedOperatorNames = Array.from(operatorsMap.keys()).sort();

outputStream.write(`export const TheShotsSortedOperatorNames: string[] = [\n`);

sortedOperatorNames.forEach((operatorNameSortKey) => {
  outputStream.write(`  "${operatorsMap.get(operatorNameSortKey)}",\n`);
});

outputStream.write(`];\n`);

// Close file
outputStream.end();
