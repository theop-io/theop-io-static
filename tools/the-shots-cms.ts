import * as fs from "fs";
import * as path from "path";
import * as yup from "yup";

import { ProductionStatusValues } from "../src/the-shots/the-shots-types";

export const shotDbRoot = "./src/the-shots/data";

export const shotTags = readKnownShotTags(path.join(shotDbRoot, "the-shots-tags.json"));

export const productionNameAndYearRegex = /(.+)\((\d{4})\)/;
export const productionImdbLinkRegex = /^https:\/\/www\.imdb\.com\/title\/(tt\d+)/;

export const productionShotSchema = yup.object({
  // Operator info
  operatorName: yup.string().required(),
  secondaryOperatorName: yup.string(),
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
  tags: yup.array().of(yup.string().oneOf(shotTags).required()),
  videoLink: yup.string(),
  // Content
  shortDescription: yup.string().required(),
  description: yup.string().required(),
  // Optional additional content
  operatorComments: yup.string(),
  equipmentList: yup.array().of(
    yup.object({
      item: yup.string().required(),
    })
  ),
});

export type ProductionShot = yup.InferType<typeof productionShotSchema>;

export const productionFileSchema = yup
  .object({
    productionName: yup.string().required().matches(productionNameAndYearRegex),
    status: yup.string().required().oneOf(ProductionStatusValues),
    productionImdbLink: yup.string().matches(productionImdbLinkRegex, { excludeEmptyString: true }),
    shots: yup.array().of(productionShotSchema).required(),
  })
  .required();

export type ProductionFile = yup.InferType<typeof productionFileSchema>;

//
// Exported utility functions
//

export function parseProductionNameAndYear(productionName: string) {
  const productionNameAndYear = productionName.match(productionNameAndYearRegex); // Validated by yup above

  if (!productionNameAndYear) {
    throw new Error(`Could not parse production name ${productionName}`);
  }

  return {
    productionName: productionNameAndYear[1].trim(), // [1] = first capture group
    productionYear: parseInt(productionNameAndYear[2]), // [2] = second capture group
  };
}

//
// Helpers
//

function readKnownShotTags(sourceFile: string) {
  const shotTagSchema = yup.object({
    "shot-tag": yup.string().required(),
  });

  const shotTagsFileSchema = yup.object({
    "shot-tags": yup.array().of(shotTagSchema).required(),
  });

  const shotTagsData = fs.readFileSync(sourceFile, "utf-8");
  const shotTagsJson = JSON.parse(shotTagsData);

  const shotTagsEnvelope = shotTagsFileSchema.validateSync(shotTagsJson, { stripUnknown: true });

  return shotTagsEnvelope["shot-tags"].flatMap((t) => t["shot-tag"]);
}
