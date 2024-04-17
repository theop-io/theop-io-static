#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

const shotsSourceDirectory = "src/the-shots/data/shots";

const productionFiles = fs.readdirSync(shotsSourceDirectory);

productionFiles.forEach((productionFileName) => {
  const productionFilePath = path.join(shotsSourceDirectory, productionFileName);
  const productionData = fs.readFileSync(productionFilePath, "utf-8");
  const productionJson = JSON.parse(productionData);

  const didModifyData = migrateVimeoIdToVimeoLink(productionJson);

  if (didModifyData) {
    fs.writeFileSync(productionFilePath, JSON.stringify(productionJson, null, 2));
  }
});

function migrateVimeoIdToVimeoLink(production: any): boolean
{
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
