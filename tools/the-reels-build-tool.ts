#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

import { Reel, ContactInfo } from "../src/the-reels/the-reels-types";

import { reelFileSchema, ReelFile, ReelOperatorContactInfo, theReelsDbRoot } from "./the-reels-cms";
import { videoRefFromVideoLink } from "./video-embed-cms";

//
// Process command line
//

if (process.argv.length < 3) {
  console.error(`Usage: ts-node ${process.argv[1]} <path-to-generated-output>`);
  process.exit(1);
}

const reelsDatabaseDestinationFile = process.argv[2];

//
// Read reels data
//

const cmsReels = new Array<ReelFile>();

const reelDbRoot = path.join(theReelsDbRoot, "reels");
const reelFiles = fs.readdirSync(reelDbRoot);

reelFiles.forEach((reelFileName) => {
  const reelFilePath = path.join(reelDbRoot, reelFileName);
  const reelData = fs.readFileSync(reelFilePath, "utf-8");
  const reelJson = JSON.parse(reelData);

  const reel = reelFileSchema.validateSync(reelJson, { stripUnknown: true });

  cmsReels.push(reel);
});

//
// Project data
//

function parseContactInfo(contactInfo: ReelOperatorContactInfo): ContactInfo {
  return {
    email: contactInfo.email,
    instagram: contactInfo.instagram?.replace(/^@/, ""), // Remove leading @ sign
    url: contactInfo.url?.replace(/^(https?:|)\/\//, ""), // Remove leading protocol
  };
}

function reelFromCMSReel(reel: ReelFile): Reel | undefined {
  const videoRef = videoRefFromVideoLink(reel.videoLink, reel.videoAspectRatio);

  if (!videoRef) {
    return undefined;
  }

  return {
    operatorName: reel.operatorName + (reel.memberships ? ", " + reel.memberships.join(", ") : ""),
    operatorActiveSinceYear: reel.operatorActiveSinceYear,
    operatorContactInfo: parseContactInfo(reel.operatorContactInfo),
    videoRef,
  };
}

// Map operator name (without any memberships added) to the projected reel record
const reelsMap = new Map<string /* sort key */, Reel>();

cmsReels.forEach((reelFile) => {
  const reel = reelFromCMSReel(reelFile);

  if (!reel) {
    console.error(`Could not parse reel from ${JSON.stringify(reelFile)}`);
    return;
  }

  reelsMap.set(reelFile.operatorName, reel);
});

// Sort operator names by last name
const operatorNames = Array.from(reelsMap.keys());

function operatorNameSortKeyForOperator(operatorName: string): string {
  // Prioritize ordering by last name
  return operatorName.split(" ").reverse().join("");
}

const sortedOperatorNames = operatorNames.sort((lhs, rhs) =>
  // Horrifically inefficient but it's a tiny dataset
  operatorNameSortKeyForOperator(lhs).localeCompare(operatorNameSortKeyForOperator(rhs))
);

//
// Output data
//

// Ensure output directory exists
const outputDirectory = path.dirname(reelsDatabaseDestinationFile);

if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory);
}

// Write output
const outputStream = fs.createWriteStream(reelsDatabaseDestinationFile, {
  encoding: "utf-8",
  flags: "w",
});

// - Imports
outputStream.write(`import { Reel } from "../the-reels-types";\n`);

// - Write out reels
outputStream.write(`export const TheReels: Reel[] = [\n`);

sortedOperatorNames.forEach((operatorName) => {
  const reel = reelsMap.get(operatorName);

  outputStream.write(JSON.stringify(reel, null, 2));
  outputStream.write(`,\n`);
});

outputStream.write(`];\n`);

// Close file
outputStream.end();
