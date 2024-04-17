#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

const shotsSourceDirectory = "src/the-shots/data/shots";

const productionFiles = fs.readdirSync(shotsSourceDirectory);

productionFiles.forEach((productionFileName) => {
  const productionFilePath = path.join(shotsSourceDirectory, productionFileName);
  const productionData = fs.readFileSync(productionFilePath, "utf-8");

  try {
    const productionJson = JSON.parse(productionData);

    const productionNameAndYearRegex = /(.+)\((\d{4})\)/;
    const productionNameAndYear = productionJson.productionName.match(productionNameAndYearRegex);

    if (!productionNameAndYear) {
      throw new Error(`Could not parse production name ${productionJson.productionName}`);
    }

    const productionName = productionNameAndYear[1].trim(); // [1] = first capture group
    const productionYear = parseInt(productionNameAndYear[2]); // [2] = second capture group

    const revisedProductionFileName = `${productionName
      .replace(/[\(\)]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "-")}-${productionYear}.json`.toLowerCase();

    if (productionFileName !== revisedProductionFileName) {
      console.log(`Renaming ${productionFileName} -> ${revisedProductionFileName}`);
      
      fs.renameSync(
        path.join(shotsSourceDirectory, productionFileName),
        path.join(shotsSourceDirectory, revisedProductionFileName)
      );
    }
  } catch (error) {
    console.error(`Could not process ${productionFileName}: ${error}`);
  }
});
