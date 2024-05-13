#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";
import * as yup from "yup";

import theShotsData from "../src/the-shots/imported-data/the-shots-data";
import { productionFileSchema, productionShotSchema } from "./the-shots-cms";

type ProductionFile = yup.InferType<typeof productionFileSchema>;

const productions = new Map<string, ProductionFile>();

theShotsData.forEach((importedShot) => {
  let productionName = importedShot.production;

  {
    const theSuffix = ", The";

    if (productionName.endsWith(theSuffix)) {
      productionName = "The " + productionName.slice(0, -theSuffix.length);
    }
  }

  const production =
    productions.get(productionName) ??
    ((): ProductionFile => {
      const production: ProductionFile = {
        productionName: `${productionName} (1900)`,
        status: "draft",
        shots: [],
      };

      productions.set(productionName, production);

      return production;
    })();

  production.shots.push({
    // Required data
    operatorName: `${importedShot.operatorFirstName} ${importedShot.operatorLastName}`,
    // Optional metadata
    episodic: { episodeTitle: importedShot.episode },
    // Content
    shortDescription: importedShot.shortDescription,
    description: importedShot.description,
    // Optional additional content
    operatorComments: importedShot.operatorComments,
    secondaryOperatorName: importedShot.altOperator,
  });
});

productions.forEach((production) => {
  fs.writeFileSync(
    path.join(
      "src/the-shots/data/shots",
      `${production.productionName
        .replace(/[\(\)]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "-")}.json`.toLowerCase()
    ),
    JSON.stringify(production, null, 2 /* pretty-print */)
  );
});
