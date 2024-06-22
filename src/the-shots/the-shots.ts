import {
  TheShotsProductions,
  TheShotsSortedOperatorNames,
  TheShotsTags,
} from "./generated/the-shots-db";
import { Production, Shot } from "./the-shots-types";

//
// Data tools
//

const PageModes = <const>["index", "operator", "production", "shot", "tag"];
type PageMode = (typeof PageModes)[number];

function isValidPageMode(pageMode: string): pageMode is PageMode {
  return !!PageModes.find((p) => p === pageMode);
}

function getURLFor(pageMode: PageMode, additionalParameters?: { [key: string]: string }): URL {
  const url = new URL(window.location.href.split("?")[0]); // Strip existing searchParams

  url.searchParams.append("pageMode", pageMode);

  if (additionalParameters) {
    Object.keys(additionalParameters).forEach((key) =>
      url.searchParams.append(key, additionalParameters[key])
    );
  }

  return url;
}

function pageModeFromURL(urlParams: URLSearchParams): PageMode | undefined {
  const pageMode_String = urlParams.get("pageMode");

  return pageMode_String && isValidPageMode(pageMode_String) ? pageMode_String : undefined;
}

function urlForOperator(operatorName: string) {
  return { operatorName };
}

function operatorFromURL(urlParams: URLSearchParams): string | undefined {
  const operatorName = urlParams.get("operatorName");
  return operatorName ?? undefined;
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

function urlForTag(tag: string) {
  return { tag };
}

function tagFromURL(urlParams: URLSearchParams): string | undefined {
  const tag = urlParams.get("tag");
  return tag ?? undefined;
}

//
// Display tools
//

function appendChildren(parentElement: HTMLElement, children: (HTMLElement | Text)[]) {
  children.forEach((child) => parentElement.appendChild(child));
}

function createElementWithChildren<ElementType extends keyof HTMLElementTagNameMap>(
  elementType: ElementType,
  ...children: (HTMLElement | Text | string)[]
): HTMLElementTagNameMap[ElementType] {
  const element = document.createElement(elementType);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isString(value: any): value is string {
    return typeof value === "string" || value instanceof String;
  }

  appendChildren(
    element,
    children.flatMap((child) =>
      isString(child)
        ? // Auto-convert string into broken text lines
          child
            .split(/\r?\n/)
            .flatMap((line, index) =>
              index > 0
                ? [document.createElement("br"), document.createTextNode(line)]
                : document.createTextNode(line)
            )
        : // Forward child as-is
          child
    )
  );

  return element;
}

function createElementWithInitializerAndChildren<ElementType extends keyof HTMLElementTagNameMap>(
  elementType: ElementType,
  initializer: (element: HTMLElementTagNameMap[ElementType]) => void,
  ...children: (HTMLElement | Text | string)[]
): HTMLElementTagNameMap[ElementType] {
  const element = createElementWithChildren(elementType, ...children);

  initializer(element);

  return element;
}

function createAnchorElementWithChildren(url: URL, ...children: (HTMLElement | Text | string)[]) {
  return createElementWithInitializerAndChildren(
    "a",
    (anchor) => (anchor.href = url.href),
    ...children
  );
}

//
// Dropdowns (also used as column headers)
//

function createSelector<T>(
  options: T[],
  title: string,
  labelForOption: (option: T) => string,
  getURLForOption: (option: T) => URL
): HTMLElement {
  return createElementWithInitializerAndChildren(
    "select",
    // Define onChange
    (selectElement) => {
      selectElement.onchange = () => {
        // Filter out title option
        const selectedIndex = parseInt(selectElement.value);

        if (selectedIndex < 0) {
          return;
        }

        const selectedItem = options[selectedIndex];

        // Navigate to URL
        window.location.href = getURLForOption(selectedItem).href;
      };
    },
    // Create default (title) <option>
    createElementWithInitializerAndChildren(
      "option",
      (optionElement) => (optionElement.value = "-1"),
      title
    ),
    // Map <option> list
    ...options.map((option, index) =>
      createElementWithInitializerAndChildren(
        "option",
        (optionElement) => {
          optionElement.value = index.toString();
        },
        labelForOption(option)
      )
    )
  );
}

function createProductionSelector(): HTMLElement {
  return createSelector(
    TheShotsProductions,
    "Production",
    (production) => createProductionName(production),
    (production) => getURLFor("production", urlForProduction(production))
  );
}

function createOperatorSelector(): HTMLElement {
  return createSelector(
    TheShotsSortedOperatorNames,
    "Operator",
    (operatorName) => operatorName,
    (operatorName) => getURLFor("operator", urlForOperator(operatorName))
  );
}

function createTagSelector(): HTMLElement {
  return createSelector(
    TheShotsTags,
    "Features",
    (tag) => tag,
    (tag) => getURLFor("tag", urlForTag(tag))
  );
}

//
// Display: Not found
//

function displayNotFound(): HTMLElement[] {
  return [
    createElementWithChildren("h2", "Not found"),
    createElementWithChildren("div", "Apologies - we must have dropped some data somewhere..."),
  ];
}

//
// Display snippets/helpers
//

function createProductionName(production: Production): string {
  return production.productionYear > 0
    ? `${production.productionName} (${production.productionYear})`
    : production.productionName;
}

function createShotOperatorsElements(
  shot: Shot,
  options: { asLink: boolean }
): (HTMLElement | Text | string)[] {
  return [
    options.asLink
      ? createAnchorElementWithChildren(
          getURLFor("operator", urlForOperator(shot.operatorName)),
          shot.operatorName
        )
      : shot.operatorName,
    ...(shot.secondaryOperatorName
      ? [
          document.createTextNode(" and "),
          options.asLink
            ? createAnchorElementWithChildren(
                getURLFor("operator", urlForOperator(shot.secondaryOperatorName)),
                shot.secondaryOperatorName
              )
            : shot.secondaryOperatorName,
        ]
      : []),
  ];
}

function createShotTagsElements(
  shot: Shot,
  options: { asLink: boolean }
): (HTMLElement | Text | string)[] {
  const createShotTagElement = (tag: string) =>
    options.asLink ? createAnchorElementWithChildren(getURLFor("tag", urlForTag(tag)), tag) : tag;

  return shot.tags
    ? shot.tags.flatMap((x, index) =>
        !index ? createShotTagElement(x) : [document.createTextNode(", "), createShotTagElement(x)]
      )
    : [];
}

//
// Display: Indexes
//

function displayShotIndex(
  isFilteredView: boolean,
  productionFilter: (production: Production) => boolean = () => true,
  shotFilter: (shot: Shot) => boolean = () => true
): HTMLElement[] {
  function createTableRowWithChildren(...children: (HTMLElement | Text | string)[]) {
    return createElementWithInitializerAndChildren(
      "tr",
      (element) => (element.role = "row"),
      ...children
    );
  }

  function createTableColumnHeader(label: string | HTMLElement, elementClass?: string) {
    return createElementWithInitializerAndChildren(
      "th",
      (element) => {
        element.role = "columnheader";

        if (elementClass) {
          element.classList.add(elementClass);
        }
      },
      label
    );
  }

  // Track the previous row's values so we can visually indicate duplicates
  let lastRowsProductionDisplayName = "";
  let lastRowsOperatorData = "";

  return [
    createElementWithChildren(
      "table",
      // Build table header row
      createTableRowWithChildren(
        createTableColumnHeader(createProductionSelector()),
        createTableColumnHeader(createOperatorSelector()),
        createTableColumnHeader(createTagSelector()),
        createTableColumnHeader("Shot", "not-small")
      ),
      // Build shot rows
      ...TheShotsProductions.flatMap((production) => {
        if (!productionFilter(production)) {
          return [];
        }

        const productionDisplayName = createProductionName(production);

        return production.shots.flatMap((shot) => {
          if (!shotFilter(shot)) {
            return [];
          }

          // Evaluate what we should display
          const operatorData = shot.operatorName + (shot.secondaryOperatorName ?? ""); // Not for display purposes, just for tracking

          const isRepeatProductionName = productionDisplayName === lastRowsProductionDisplayName;
          const isRepeatOperatorData = operatorData === lastRowsOperatorData;

          // Update state for next row
          lastRowsProductionDisplayName = productionDisplayName;
          lastRowsOperatorData = operatorData;

          // Display shot row
          return createTableRowWithChildren(
            createElementWithInitializerAndChildren(
              "td",
              (element) => {
                element.role = "cell";

                if (isRepeatProductionName) {
                  element.classList.add("is-repeat");
                }
              },
              isFilteredView
                ? productionDisplayName
                : createAnchorElementWithChildren(
                    getURLFor("production", urlForProduction(production)),
                    productionDisplayName
                  )
            ),
            createElementWithInitializerAndChildren(
              "td",
              (element) => {
                element.role = "cell";

                if (isRepeatOperatorData) {
                  element.classList.add("is-repeat");
                }
              },
              ...createShotOperatorsElements(shot, { asLink: !isFilteredView })
            ),
            createElementWithInitializerAndChildren(
              "td",
              (element) => (element.role = "cell"),
              ...createShotTagsElements(shot, { asLink: !isFilteredView })
            ),
            createElementWithInitializerAndChildren(
              "td",
              (element) => (element.role = "cell"),
              createAnchorElementWithChildren(
                getURLFor("shot", { ...urlForProduction(production), ...urlForShot(shot) }),
                shot.shortDescription
              )
            )
          );
        });
      })
    ),
  ];
}

function displayIndex(_urlParams: URLSearchParams): HTMLElement[] {
  return displayShotIndex(false);
}

function displayOperator(urlParams: URLSearchParams): HTMLElement[] {
  const operatorName = operatorFromURL(urlParams);

  if (!operatorName) {
    return displayNotFound();
  }

  return [
    createElementWithChildren("h2", operatorName),

    ...displayShotIndex(
      true,
      () => true,
      (shot: Shot) =>
        shot.operatorName === operatorName || shot.secondaryOperatorName === operatorName
    ),
  ];
}

function displayProduction(urlParams: URLSearchParams): HTMLElement[] {
  const production = productionFromURL(urlParams);

  if (!production) {
    return displayNotFound();
  }

  return [
    createElementWithChildren("h2", createProductionName(production)),
    ...displayShotIndex(true, (p) => p === production),
  ];
}

function displayTag(urlParams: URLSearchParams): HTMLElement[] {
  const tag = tagFromURL(urlParams);

  if (!tag) {
    return displayNotFound();
  }

  return [
    createElementWithChildren("h2", tag),
    ...displayShotIndex(
      true,
      () => true,
      (shot: Shot) => shot.tags?.includes(tag) || false
    ),
  ];
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

function shotHasEpisodicDetails(shot: Shot): boolean {
  return !!shot.episodic && !!shot.episodic.season && !!shot.episodic.episode;
}

function getShotEpisodicDetailsString(shot: Shot): string {
  if (!shotHasEpisodicDetails(shot)) {
    return "";
  }

  return (
    `S${shot.episodic?.season}E${shot.episodic?.episode}` +
    (shot.episodic?.episodeTitle ? ` "${shot.episodic.episodeTitle}"` : "")
  );
}

function displayShotDetails(urlParams: URLSearchParams): HTMLElement[] {
  // Find shot
  const production = productionFromURL(urlParams);

  if (!production) {
    return displayNotFound();
  }

  const shot = shotFromURL(urlParams, production);

  if (!shot) {
    return displayNotFound();
  }

  // Create display
  const shotTimestamp = getShotTimestampString(shot);
  const episodicDetailsString = getShotEpisodicDetailsString(shot);

  return [
    // -- Top level --
    // Show production details
    createElementWithChildren(
      "h2",
      createAnchorElementWithChildren(
        getURLFor("production", urlForProduction(production)),
        createProductionName(production)
      ),
      ...(production.imdbTitleId
        ? [
            createElementWithInitializerAndChildren("a", (element) => {
              // Link substance
              element.href = new URL(`https://www.imdb.com/title/${production.imdbTitleId}`).href;
              element.target = "_blank";
              element.rel = "noopener noreferrer";

              // Link style
              element.classList.add("imdb-link", "svg-logo-imdb");
            }),
          ]
        : [])
    ),
    // Show show name
    createElementWithChildren(
      "h3",
      episodicDetailsString + (episodicDetailsString ? ": " : ""),
      `"${shot.shortDescription}" by `,
      ...createShotOperatorsElements(shot, { asLink: true }),
      shotTimestamp ? ` (at ${shotTimestamp})` : ""
    ),
    // -- Columns --
    // - Left column
    createElementWithInitializerAndChildren(
      "div",
      (element: HTMLElement) => element.classList.add("the_shots_column"),

      // Director
      ...(shot.directorName
        ? [
            createElementWithChildren(
              "div",
              createElementWithChildren("b", "Directed by "),
              shot.directorName
            ),
          ]
        : []),
      // DP
      ...(shot.dpName
        ? [
            createElementWithChildren(
              "div",
              createElementWithChildren("b", "Cinematography by "),
              shot.dpName
            ),
          ]
        : []),
      // Tags
      ...(shot.tags
        ? [
            createElementWithChildren("strong", "Features "),
            ...createShotTagsElements(shot, { asLink: true }),
          ]
        : []),
      // Description block
      createElementWithChildren("h4", "Description"),
      createElementWithChildren("div", shot.description),
      // Operator comments block
      ...(shot.operatorComments
        ? [
            createElementWithChildren("h4", "Operator Commentary"),
            createElementWithChildren("div", shot.operatorComments),
          ]
        : []),
      // Equipment list block
      ...(shot.equipmentList
        ? [
            createElementWithChildren("h4", "Equipment"),
            createElementWithChildren(
              "ul",
              ...shot.equipmentList.map((e) => createElementWithChildren("li", e.item))
            ),
          ]
        : [])
    ),
    // - Right column
    createElementWithInitializerAndChildren(
      "div",
      (element: HTMLElement) => element.classList.add("the_shots_column"),
      ...(shot.vimeoId
        ? [
            createElementWithInitializerAndChildren(
              "div",
              (element) => element.classList.add("the_shots_video_container"),
              createElementWithInitializerAndChildren("iframe", (element) => {
                element.src = `https://player.vimeo.com/video/${shot.vimeoId}`;
                element.allow = "encrypted-media";
                element.allowFullscreen = true;
              })
            ),
          ]
        : [])
    ),
  ];
}

//
// Top-level
//

function buildRandomShotURL(): URL {
  function getRandomArrayElement<T>(data: T[]): T {
    return data[Math.floor(Math.random() * data.length)];
  }

  const randomProduction = getRandomArrayElement(TheShotsProductions);
  const randomShot = getRandomArrayElement(randomProduction.shots);

  return getURLFor("shot", { ...urlForProduction(randomProduction), ...urlForShot(randomShot) });
}

function buildRandomShotAnchor(): HTMLElement[] {
  return [createAnchorElementWithChildren(buildRandomShotURL(), "Random shot")];
}

function buildRequestAShotAnchor(): HTMLElement[] {
  return [
    createAnchorElementWithChildren(
      new URL("/request-a-shot", window.location.href),
      "Request a shot"
    ),
  ];
}

function buildSelectorRow(pageMode: PageMode): HTMLElement[] {
  return [
    createElementWithInitializerAndChildren(
      "div",
      (divElement) => divElement.classList.add("the_shots_selectors"),
      ...(pageMode !== "index"
        ? [createAnchorElementWithChildren(getURLFor("index"), "All shots"), "|"]
        : []),
      ...buildRandomShotAnchor(),
      "|",
      ...buildRequestAShotAnchor()
    ),
  ];
}

// Find and populate index wrapper element
const shotsParentDiv = document.querySelector<HTMLDivElement>("#the_shots_wrapper");

if (shotsParentDiv) {
  // Clear "Loading..." message
  shotsParentDiv.innerHTML = "";

  // Configure styling
  shotsParentDiv.classList.add("the_shots");

  // Setup
  const urlParams = new URLSearchParams(window.location.search);
  const pageMode = pageModeFromURL(urlParams);

  if (!pageMode) {
    // Home page -> go to a random shot
    window.location.replace(buildRandomShotURL());
  } else {
    // Build header/selector row
    appendChildren(shotsParentDiv, buildSelectorRow(pageMode));

    // Show content
    const contentFunctionByPageMode = {
      index: displayIndex,
      operator: displayOperator,
      production: displayProduction,
      shot: displayShotDetails,
      tag: displayTag,
    };

    appendChildren(shotsParentDiv, contentFunctionByPageMode[pageMode](urlParams));
  }
}
