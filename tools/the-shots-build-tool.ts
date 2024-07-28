#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";
import { marked } from "marked";

import { Production, Shot, Timestamp } from "../src/the-shots/the-shots-types";

import {
  productionFileSchema,
  productionImdbLinkRegex,
  parseProductionNameAndYear,
  ProductionFile,
  ProductionShot,
  shotDbRoot,
  shotTags,
} from "./the-shots-cms";

import { videoRefFromVideoLink } from "./video-embed-cms";

//
// Process command line
//

if (process.argv.length < 3) {
  console.error(`Usage: ts-node ${process.argv[1]} <path-to-generated-output>`);
  process.exit(1);
}

const shotsDatabaseDestinationFile = process.argv[2];

//
// Read shots data
//

const productions = new Array<ProductionFile>();

const productionDbRoot = path.join(shotDbRoot, "shots");
const productionFiles = fs.readdirSync(productionDbRoot);

productionFiles.forEach((productionFileName) => {
  const productionFilePath = path.join(productionDbRoot, productionFileName);
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

function parseShot(shot: ProductionShot): Shot {
  const videoRef = videoRefFromVideoLink(shot.videoLink, shot.videoAspectRatio);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { videoLink, videoAspectRatio, ...shotWithoutVideoLink } = shot;

  return {
    ...shotWithoutVideoLink,
    timestamp: parseTimestamp(shot.timestamp),
    videoRef,
    // Fix up typing of non-optional fields (yup type inference is being special)
    operatorName: shot.operatorName as string, // Validated by yup above (but typed poorly)
    shortDescription: shot.shortDescription as string,
    description: shot.description as string,
  };
}

function parseProductionImdbLink(productionImdbLink?: string) {
  if (!productionImdbLink) {
    return undefined;
  }

  const productionImdbLinkComponents = productionImdbLink.match(productionImdbLinkRegex); // Validated by yup above

  if (!productionImdbLinkComponents) {
    throw new Error(`Could not parse production IMDb link ${productionImdbLink}`);
  }

  return productionImdbLinkComponents[1].trim(); // [1] = first capture group = `tt\d+`
}

function renderMarkdown(md: string): string {
  const renderedHtml = marked.parse(md) as string;

  return renderedHtml.replace(/\n$/, ""); // Remove the trailing "\n" that `marked` somehow blesses us with
}

function renderShot(shot: Shot): Shot {
  return {
    ...shot,
    description: renderMarkdown(shot.description),
    operatorComments: shot.operatorComments ? renderMarkdown(shot.operatorComments) : undefined,
    equipmentList: shot.equipmentList?.map((e) => {
      return {
        item: renderMarkdown(e.item),
      };
    }),
  };
}

const shotsDb: Production[] = productions
  .filter((production) => production.status === "published")
  .map((production) => {
    return {
      ...parseProductionNameAndYear(production.productionName),
      imdbTitleId: parseProductionImdbLink(production.productionImdbLink),
      status: production.status,
      shots: production.shots.map((shot) => renderShot(parseShot(shot))),
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
const uniqueOperatorNames = [
  ...new Set(
    shotsDb
      .flatMap((production) =>
        production.shots.flatMap((shot) => [shot.operatorName, shot.secondaryOperatorName])
      )
      .filter((x): x is string => !!x)
  ),
];

function operatorNameSortKeyForOperator(operatorName: string): string {
  // Prioritize ordering by last name
  return operatorName.split(" ").reverse().join("");
}

const sortedUniqueOperatorNames = uniqueOperatorNames.sort((lhs, rhs) =>
  // Horrifically inefficient but it's a tiny dataset
  operatorNameSortKeyForOperator(lhs).localeCompare(operatorNameSortKeyForOperator(rhs))
);

outputStream.write(
  `export const TheShotsSortedOperatorNames: string[] = ${JSON.stringify(
    sortedUniqueOperatorNames
  )};\n`
);

// - Tags
outputStream.write(`export const TheShotsTags: string[] = ${JSON.stringify(shotTags)};\n`);

// Close file
outputStream.end();
