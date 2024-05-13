#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

// Imported data (from steadishots.org)
import theShotsData from "../src/the-shots/imported-data/the-shots-data";

theShotsData.forEach((importedShot) => {
  // Fix up production names
  const theSuffix = ", The";

  if (importedShot.production.endsWith(theSuffix)) {
    importedShot.production = "The " + importedShot.production.slice(0, -theSuffix.length);
  }
});

// Reading our data from our CMS
import { parseProductionNameAndYear, productionFileSchema, ProductionFile } from "./the-shots-cms";

const shotsSourceDirectory = "src/the-shots/data/shots";

const productionFiles = fs.readdirSync(shotsSourceDirectory);

productionFiles.forEach((productionFileName) => {
  const productionFilePath = path.join(shotsSourceDirectory, productionFileName);
  const productionData = fs.readFileSync(productionFilePath, "utf-8");
  const productionJson = JSON.parse(productionData);

  const production = productionFileSchema.validateSync(productionJson, { stripUnknown: true });

  //const didModifyData = migrateVimeoIdToVimeoLink(productionJson);
  const didModifyData = mergeInImportedEquipmentData(production);

  if (didModifyData) {
    fs.writeFileSync(productionFilePath, JSON.stringify(production, null, 2));
  }
});

function migrateVimeoIdToVimeoLink(production: ProductionFile): boolean {
  let didModifyData = false;

  const shots = production.shots;

  shots.forEach((shot: any) => {
    if (shot.vimeoId) {
      shot.vimeoLink = `https://vimeo.com/${shot.vimeoId}`;
      delete shot.vimeoId;
      didModifyData = true;
    }
  });

  return didModifyData;
}

function mergeInImportedEquipmentData(production: ProductionFile): boolean {
  let didModifyData = false;

  // Try to find importable shots for this production
  const productionNameAndYear = parseProductionNameAndYear(production.productionName);

  const matchingImportedShots = theShotsData.filter(
    (p) => p.production === productionNameAndYear.productionName
  );

  if (!matchingImportedShots.length) {
    return false;
  }

  console.log(
    `Found ${matchingImportedShots.length} matches for ${productionNameAndYear.productionName}`
  );

  production.shots.forEach((shot) => {
    const matchingImportedShot = matchingImportedShots.find(
      (importedShot) => importedShot.shortDescription === shot.shortDescription
    );

    if (!matchingImportedShot) {
      return;
    }

    console.log(`  ${matchingImportedShot.shortDescription}`);

    if (!matchingImportedShot.equipment) {
      // Nothing to import
      return;
    }

    if (shot.equipmentList && shot.equipmentList.length) {
      // Already have data
      return;
    }

    shot.equipmentList = matchingImportedShot.equipment
      .split(/\r?\n/)
      .map((e) => e.trim())
      .filter((e) => !!e)
      .map((e) => {
        return { item: e };
      });

    didModifyData = true;
  });

  return didModifyData;
}
