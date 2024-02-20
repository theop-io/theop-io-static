import { TheShotsProductions, TheShotsSortedOperatorNames } from "./generated/the-shots-db";
import { Production, Shot } from "./the-shots-types";

//
// Data tools
//

function getURLFor(show: string, additionalParameters: { [key: string]: string }): URL {
  const url = new URL(window.location.href.split("?")[0]); // Strip existing searchParams

  url.searchParams.append("show", show);

  Object.keys(additionalParameters).forEach((key) =>
    url.searchParams.append(key, additionalParameters[key])
  );

  return url;
}

function urlForProduction(production: Production) {
  return {
    productionName: production.productionName,
    productionYear: production.productionYear.toString(),
  };
}

function productionFromURL(urlParams: URLSearchParams): Production | undefined {
  const productionName = urlParams.get("productionName");
  const productionYear = parseInt(urlParams.get("productionYear") ?? "0");

  const productions = TheShotsProductions.filter(
    (production) =>
      production.productionName === productionName && production.productionYear === productionYear
  );

  if (!productions || productions.length !== 1) {
    return undefined;
  }

  return productions[0];
}

function urlForShot(shot: Shot) {
  return { shotShortDescription: shot.shortDescription };
}

function shotFromURL(urlParams: URLSearchParams, production: Production): Shot | undefined {
  const shotShortDescription = urlParams.get("shotShortDescription");

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
  elementType: "h2" | "h3" | "h4" | "div" | "option",
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
        appendTableRow(shotIndexTable, [
          createTableCell(shotIndex === 0 ? productionDisplayName : ""),
          createTableCell(shotIndex === 0 ? production.operatorName : ""),
          createTableLinkCell(
            shot.shortDescription,
            getURLFor("shot", { ...urlForProduction(production), ...urlForShot(shot) })
          ),
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

//
// Display: Operator
//
function displayOperator(parentElement: HTMLDivElement, urlParams: URLSearchParams) {
  const operatorName = urlParams.get("operatorName");

  if (!operatorName) {
    return displayNotFound(parentElement);
  }

  // Find productions this operator has worked on
  const productions = TheShotsProductions.filter(
    (production) =>
      production.operatorName === operatorName || production.secondaryOperatorName === operatorName
  );

  if (!productions || productions.length === 0) {
    return displayNotFound(parentElement);
  }

  // Display operator name
  appendElementWithText(parentElement, "h2", operatorName);

  // Display matching productions
  const shotIndexTable = createTable();
  {
    // Build table header row
    appendTableRow(shotIndexTable, [
      createTableCell("Production", "th"),
      createTableCell("Description", "th"),
    ]);

    // Build per-production rows
    productions.forEach((production) => {
      const productionDisplayName = `${production.productionName} (${production.productionYear})`;

      production.shots.forEach((shot, shotIndex) => {
        appendTableRow(shotIndexTable, [
          createTableCell(shotIndex === 0 ? productionDisplayName : ""),
          createTableLinkCell(
            shot.shortDescription,
            getURLFor("shot", { ...urlForProduction(production), ...urlForShot(shot) })
          ),
        ]);
      });
    });
  }

  // Commit shot index
  parentElement.appendChild(shotIndexTable);
}

//
// Display: Production
//

function displayProduction(parentElement: HTMLDivElement, urlParams: URLSearchParams) {
  // Find production
  const production = productionFromURL(urlParams);

  if (!production) {
    return displayNotFound(parentElement);
  }

  // Display production name
  appendElementWithText(
    parentElement,
    "h2",
    `${production.productionName} (${production.productionYear})`
  );

  // Display shots
  const shotIndexTable = createTable();
  {
    // Build table header row
    appendTableRow(shotIndexTable, [
      createTableCell("Operator", "th"),
      createTableCell("Description", "th"),
    ]);

    // Build per-production rows
    production.shots.forEach((shot, shotIndex) => {
      appendTableRow(shotIndexTable, [
        createTableCell(shotIndex === 0 ? production.operatorName : ""),
        createTableLinkCell(
          shot.shortDescription,
          getURLFor("shot", { ...urlForProduction(production), ...urlForShot(shot) })
        ),
      ]);
    });
  }

  // Commit shot index
  parentElement.appendChild(shotIndexTable);
}

//
// Top-level
//

// Find and populate index wrapper element
const shotsParentDiv = document.querySelector<HTMLDivElement>("#the_shots_wrapper");

if (shotsParentDiv) {
  // Clear "Loading..." message
  shotsParentDiv.innerHTML = "";

  // Build header/selector row
  {
    const headerDiv = document.createElement("div");
    headerDiv.classList.add("the_shots_selectors");
    {
      // Build Operator selector
      const selectElement = document.createElement("select");

      const nilOptionElement = appendElementWithText(
        selectElement,
        "option",
        "- Operators -"
      ) as HTMLOptionElement;
      nilOptionElement.value = "";

      TheShotsSortedOperatorNames.forEach((operatorName) =>
        appendElementWithText(selectElement, "option", operatorName)
      );

      selectElement.onchange = () => {
        // Filter out nil option
        const selectedOperator = selectElement.value;

        if (!selectedOperator) {
          return;
        }

        // Navigate to URL
        window.location.href = getURLFor("operator", { operatorName: selectedOperator }).href;
      };

      headerDiv.appendChild(selectElement);
    }
    {
      // Build Production selector
      const selectElement = document.createElement("select");

      const nilOptionElement = appendElementWithText(
        selectElement,
        "option",
        "- Productions -"
      ) as HTMLOptionElement;
      nilOptionElement.value = "-1";

      TheShotsProductions.forEach((production, index) => {
        const productionOptionElement = appendElementWithText(
          selectElement,
          "option",
          `${production.productionName} (${production.productionYear})`
        ) as HTMLOptionElement;
        productionOptionElement.value = index.toString();
      });

      selectElement.onchange = () => {
        // Filter out nil option
        const selectedProductionIndex = parseInt(selectElement.value);

        if (selectedProductionIndex < 0) {
          return;
        }

        const selectedProduction = TheShotsProductions[selectedProductionIndex];

        // Navigate to URL
        window.location.href = getURLFor("production", urlForProduction(selectedProduction)).href;
      };

      headerDiv.appendChild(selectElement);
    }

    shotsParentDiv.appendChild(headerDiv);
  }

  // Figure out what this page is supposed to show
  const urlParams = new URLSearchParams(window.location.search);
  const showMode = urlParams.get("show");

  if (!showMode) {
    displayShotIndex(shotsParentDiv);
  } else if (showMode === "shot") {
    displayShotDetails(shotsParentDiv, urlParams);
  } else if (showMode === "operator") {
    displayOperator(shotsParentDiv, urlParams);
  } else if (showMode === "production") {
    displayProduction(shotsParentDiv, urlParams);
  }
}
