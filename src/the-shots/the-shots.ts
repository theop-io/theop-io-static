import TheShotsData from "./the-shots-data";

// Constants
const shotIdAttribute = "data-shot-id";

// Tools
function createElementWithText(elementType: "h2" | "h3" | "h4" | "div", text: string) {
  const element = document.createElement(elementType);

  const textLines = text.split(/\r?\n/);

  textLines.forEach((line, index) => {
    if (index > 0) {
      element.appendChild(document.createElement("br"));
    }

    element.appendChild(document.createTextNode(line));
  });

  return element;
}

// Sort data
TheShotsData.sort((lhs, rhs) => (lhs.production < rhs.production ? -1 : 1));

const shotsParentDiv = document.querySelector<HTMLDivElement>("#the_shots_wrapper");

if (shotsParentDiv) {
  // Clear "Loading..." message
  shotsParentDiv.innerHTML = "";

  // Build index and details divs
  const shotIndexDiv = document.createElement("div");
  shotIndexDiv.id = "the_shots_index";

  const shotDetailsDiv = document.createElement("div");
  shotDetailsDiv.id = "the_shots_details";

  // Details
  function showShotDetails(event: Event) {
    // Find shot data
    const targetElement = event.target as HTMLElement;
    const shotId_String = targetElement.getAttribute(shotIdAttribute);

    if (!shotId_String) {
      return;
    }

    const shotId = parseInt(shotId_String);

    const shotDetails = TheShotsData[shotId];

    // Clear existing details div
    shotDetailsDiv.innerHTML = "";

    // Build out details div
    shotDetailsDiv.appendChild(
      createElementWithText(
        "h2",
        shotDetails.production + (shotDetails.episode ? ` (${shotDetails.episode})` : ``)
      )
    );

    shotDetailsDiv.appendChild(
      createElementWithText(
        "h3",
        `"${shotDetails.shortDescription}", by ${shotDetails.operatorFirstName} ${shotDetails.operatorLastName}` +
          (shotDetails.altOperator ? ` and ${shotDetails.altOperator}` : ``)
      )
    );

    if (shotDetails.description) {
      shotDetailsDiv.appendChild(createElementWithText("div", shotDetails.description));
    }

    if (shotDetails.operatorComments) {
      shotDetailsDiv.appendChild(createElementWithText("h4", "Operator's Commentary"));
      shotDetailsDiv.appendChild(createElementWithText("div", shotDetails.operatorComments));
    }

    if (shotDetails.equipment) {
      shotDetailsDiv.appendChild(createElementWithText("h4", "Equipment used"));
      shotDetailsDiv.appendChild(createElementWithText("div", shotDetails.equipment));
    }
  }

  // Table building basics
  const tableElement = document.createElement("table");

  const createRow = (cells: HTMLTableCellElement[]) => {
    const tableRow = document.createElement("tr");

    cells.forEach((cell) => tableRow.appendChild(cell));

    tableElement.appendChild(tableRow);
  };

  const createCell = (text: string, elementType: "th" | "td" = "td"): HTMLTableCellElement => {
    const tableCellElement = document.createElement(elementType);
    tableCellElement.appendChild(document.createTextNode(text));

    return tableCellElement;
  };

  const createShotLinkCell = (text: string, shotId: number): HTMLTableCellElement => {
    const tableCellElement = document.createElement("td");
    tableCellElement.appendChild(document.createTextNode(text));

    tableCellElement.setAttribute(shotIdAttribute, shotId.toString());
    tableCellElement.classList.add("shotLink");

    tableCellElement.addEventListener("mouseenter", showShotDetails);
    tableCellElement.addEventListener("focus", showShotDetails);

    return tableCellElement;
  };

  // Build table header row
  createRow([
    createCell("Production", "th"),
    createCell("Operator", "th"),
    createCell("Description", "th"),
  ]);

  // Project shots data into table
  let previousProductionName: null | string = null;

  TheShotsData.forEach((shot, index) => {
    createRow([
      createCell(shot.production !== previousProductionName ? shot.production : ""),
      createCell(`${shot.operatorFirstName} ${shot.operatorLastName}`),
      createShotLinkCell(shot.shortDescription, index),
    ]);

    previousProductionName = shot.production;
  });

  // Add table to index div
  shotIndexDiv.appendChild(tableElement);

  // Commit divs to document
  shotsParentDiv.appendChild(shotIndexDiv);
  shotsParentDiv.appendChild(shotDetailsDiv);
}
