import { TheShotsProductions, TheShotsSortedOperatorNames } from "./generated/the-shots-db";
import { Production, Shot } from "./the-shots-types";

//
// Constants
//

const queryParameterNames = {
  show: "show",
  productionName: "productionName",
  productionYear: "productionYear",
  shotShortDescription: "shotShortDescription",
};

//
// Data tools
//

function addProductionToURL(urlParams: URLSearchParams, production: Production) {
  urlParams.append(queryParameterNames.productionName, production.productionName);

  urlParams.append(queryParameterNames.productionYear, production.productionYear.toString());
}

function productionFromURL(urlParams: URLSearchParams): Production | undefined {
  const productionName = urlParams.get(queryParameterNames.productionName);
  const productionYear = parseInt(urlParams.get(queryParameterNames.productionYear) ?? "0");

  const productions = TheShotsProductions.filter(
    (production) =>
      production.productionName === productionName && production.productionYear === productionYear
  );

  if (!productions || productions.length !== 1) {
    return undefined;
  }

  return productions[0];
}

function addShotToURL(urlParams: URLSearchParams, shot: Shot) {
  urlParams.append(queryParameterNames.shotShortDescription, shot.shortDescription);
}

function shotFromURL(urlParams: URLSearchParams, production: Production): Shot | undefined {
  const shotShortDescription = urlParams.get(queryParameterNames.shotShortDescription);

  const shots = production.shots.filter((shot) => shot.shortDescription === shotShortDescription);

  if (!shots || shots.length !== 1) {
    return undefined;
  }

  return shots[0];
}

//
// Display tools
//

function appendElementWithText(
  parentElement: HTMLElement,
  elementType: "h2" | "h3" | "h4" | "div",
  text: string
): HTMLElement {
  const element = document.createElement(elementType);

  const textLines = text.split(/\r?\n/);

  textLines.forEach((line, index) => {
    if (index > 0) {
      element.appendChild(document.createElement("br"));
    }

    element.appendChild(document.createTextNode(line));
  });

  parentElement.appendChild(element);

  return element;
}

function createTable() {
  return document.createElement("table");
}

function createTableCell(text: string, elementType: "th" | "td" = "td"): HTMLTableCellElement {
  const tableCellElement = document.createElement(elementType);
  tableCellElement.appendChild(document.createTextNode(text));

  return tableCellElement;
}

function createTableLinkCell(text: string, url: URL): HTMLTableCellElement {
  const tableCellElement = document.createElement("td");

  const anchorElement = document.createElement("a");
  anchorElement.appendChild(document.createTextNode(text));
  anchorElement.href = url.href;

  tableCellElement.appendChild(anchorElement);

  return tableCellElement;
}

function appendTableRow(tableElement: HTMLTableElement, cells: HTMLTableCellElement[]) {
  const tableRow = document.createElement("tr");

  cells.forEach((cell) => tableRow.appendChild(cell));

  tableElement.appendChild(tableRow);
}

//
// Display: Index
//

function displayShotIndex(parentElement: HTMLDivElement) {
  const shotIndexTable = createTable();
  {
    // Build table header row
    appendTableRow(shotIndexTable, [
      createTableCell("Production", "th"),
      createTableCell("Operator", "th"),
      createTableCell("Description", "th"),
    ]);

    // Build per-production rows
    TheShotsProductions.forEach((production) => {
      const productionDisplayName = `${production.productionName} (${production.productionYear})`;

      production.shots.forEach((shot, shotIndex) => {
        const shotDetailsUrl = new URL(window.location.href);
        {
          shotDetailsUrl.searchParams.append(queryParameterNames.show, "shot");
          addProductionToURL(shotDetailsUrl.searchParams, production);
          addShotToURL(shotDetailsUrl.searchParams, shot);
        }

        appendTableRow(shotIndexTable, [
          createTableCell(shotIndex === 0 ? productionDisplayName : ""),
          createTableCell(shotIndex === 0 ? production.operatorName : ""),
          createTableLinkCell(shot.shortDescription, shotDetailsUrl),
        ]);
      });
    });
  }

  // Commit shot index
  parentElement.appendChild(shotIndexTable);
}

//
// Display: Not found
//

function displayNotFound(parentElement: HTMLDivElement) {
  appendElementWithText(parentElement, "h2", "Not found");

  appendElementWithText(
    parentElement,
    "div",
    "Apologies - we must have dropped some data somewhere..."
  );
}

//
// Display: Shot details
//

function getShotTimestampString(shot: Shot): string | undefined {
  if (!shot.timestamp) {
    return undefined;
  }

  const zeroPad = (value: number, places: number) => String(value).padStart(places, "0");
  const zeroPadTime = (value: number) => zeroPad(value, 2);

  return `${zeroPadTime(shot.timestamp.hours)}:${zeroPadTime(shot.timestamp.minutes)}:${zeroPadTime(
    shot.timestamp.seconds
  )}`;
}

function displayShotDetails(parentElement: HTMLDivElement, urlParams: URLSearchParams) {
  // Find shot
  const production = productionFromURL(urlParams);

  if (!production) {
    return displayNotFound(parentElement);
  }

  const shot = shotFromURL(urlParams, production);

  if (!shot) {
    return displayNotFound(parentElement);
  }

  // Show production details
  appendElementWithText(
    parentElement,
    "h2",
    `${production.productionName} (${production.productionYear})`
  );

  // Show shot name
  let shotName = `"${shot.shortDescription}" by ${production.operatorName}`;
  {
    // Prepend episode
    if (shot.episode) {
      shotName = `${shot.episode}: ${shotName}`;
    }

    // Append offset
    const shotTimestamp = getShotTimestampString(shot);

    if (shotTimestamp) {
      shotName += ` (at ${shotTimestamp})`;
    }
  }

  appendElementWithText(parentElement, "h3", shotName);

  // Show shot data
  appendElementWithText(parentElement, "div", shot.description);

  if (shot.operatorComments) {
    appendElementWithText(parentElement, "h4", "Operator comments");
    appendElementWithText(parentElement, "div", shot.operatorComments);
  }

  if (shot.equipment) {
    appendElementWithText(parentElement, "h4", "Equipment");
    appendElementWithText(parentElement, "div", shot.equipment);
  }
}

// Find and populate index wrapper element
const shotsParentDiv = document.querySelector<HTMLDivElement>("#the_shots_wrapper");

if (shotsParentDiv) {
  // Clear "Loading..." message
  shotsParentDiv.innerHTML = "";

  // Figure out what this page is supposed to show
  const urlParams = new URLSearchParams(window.location.search);
  const showMode = urlParams.get(queryParameterNames.show);

  if (!showMode) {
    displayShotIndex(shotsParentDiv);
  } else if (showMode === "shot") {
    displayShotDetails(shotsParentDiv, urlParams);
  }
}
