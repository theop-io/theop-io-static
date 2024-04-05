// See https://github.com/rgiese/www-grumpycorp-com/blob/master/src/assets/index.ts

import * as fs from "fs";
import * as path from "path";
import svgo from "svgo";

//
// Process command line
//

if (process.argv.length < 3) {
  console.error(
    `Usage: ts-node ${process.argv[1]} <path-to-svg-source-directory> <path-to-generated-css-file>`
  );
  process.exit(1);
}

const svgSourceDirectory = process.argv[2];
const cssOutputFile = process.argv[3];

//
// Transforming SVGs
//

function cssFromSvg(name: string, inputSvg: string): string {
  // Capture viewBox attribute from input SVG and also optimize the SVG code while we're at it
  let viewBoxAttributeValue = "";

  const captureViewBox: svgo.CustomPlugin = {
    name: "captureViewBox",
    fn: () => {
      return {
        element: {
          enter: (node) => {
            if (node.name === "svg") {
              viewBoxAttributeValue = node.attributes.viewBox;
            }
          },
        },
      };
    },
  };

  const optimizedSvg = svgo.optimize(inputSvg, {
    multipass: true,
    plugins: ["preset-default", captureViewBox],
  }).data;

  // Parse viewBox
  if (!viewBoxAttributeValue) {
    throw new Error(`viewBox attribute not found`);
  }

  const viewBoxParsedValues = viewBoxAttributeValue.split(" ").map((x) => parseInt(x));

  if (viewBoxParsedValues.length !== 4) {
    throw new Error(`viewBox attribute value "${viewBoxAttributeValue}" invalid`);
  }

  // Encode SVG so we can use it in a CSS data url
  let encodedSvg = optimizedSvg
    .replaceAll("\n", " ") // no newlines allowed in CSS
    .replaceAll("'", '"'); // we'll contain with single quotes below so transform in-SVG single quotes to double quotes

  const charactersToConvert = "%&#{}<>"; // courtesy of https://codepen.io/jakob-e/pen/doMoML. Note that '%' _has_ to come first.

  [...charactersToConvert].forEach((characterToConvert) => {
    encodedSvg = encodedSvg.replaceAll(
      characterToConvert,
      `%${characterToConvert.charCodeAt(0).toString(16).padStart(2, "0")}`
    );
  });

  // Emit CSS class
  return `.svg-${name} {
      background: url('data:image/svg+xml,${encodedSvg}') no-repeat top left;
      background-size: contain;
      aspect-ratio: ${viewBoxParsedValues[2 /* width */]} / ${
        viewBoxParsedValues[3 /* height */]
      };  
    }`;
}

export function transcodeSvgsToCss(sourceDirectory: string, outputFileName: string) {
  const sourceFiles = fs.readdirSync(sourceDirectory).filter((f) => path.extname(f) === ".svg");

  const cssContent = sourceFiles
    .map((sourceFile) => {
      try {
        return cssFromSvg(
          path.parse(sourceFile).name,
          fs.readFileSync(path.join(sourceDirectory, sourceFile), "utf8")
        );
      } catch (error) {
        console.error(`While processing ${sourceFile}:`);
        throw error;
      }
    })
    .join("\n");

  {
    // Ensure output directory exists
    const outputDirectory = path.dirname(outputFileName);

    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory);
    }
  }

  fs.writeFileSync(outputFileName, cssContent);
}

//
// Main
//

transcodeSvgsToCss(svgSourceDirectory, cssOutputFile);
