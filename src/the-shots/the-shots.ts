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

function pageModeFromURL(urlParams: URLSearchParams): PageMode {
  const pageMode_String = urlParams.get("pageMode");

  return pageMode_String && isValidPageMode(pageMode_String) ? pageMode_String : "index";
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

function createShotOperatorsElements(shot: Shot): (HTMLElement | Text)[] {
  return [
    createAnchorElementWithChildren(
      getURLFor("operator", urlForOperator(shot.operatorName)),
      shot.operatorName
    ),
    ...(shot.secondaryOperatorName
      ? [
          document.createTextNode(" and "),
          createAnchorElementWithChildren(
            getURLFor("operator", urlForOperator(shot.secondaryOperatorName)),
            shot.secondaryOperatorName
          ),
        ]
      : []),
  ];
}

function createShotTagsElements(shot: Shot): (HTMLElement | Text)[] {
  const createShotTagElement = (tag: string) =>
    createAnchorElementWithChildren(getURLFor("tag", urlForTag(tag)), tag);

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
  productionFilter: (production: Production) => boolean = () => true,
  shotFilter: (shot: Shot) => boolean = () => true
): HTMLElement[] {
  return [
    createElementWithChildren(
      "table",
      // Build table header row
      createElementWithChildren(
        "tr",
        createElementWithChildren("th", "Production"),
        createElementWithChildren("th", "Operator"),
        createElementWithChildren("th", "Description"),
        createElementWithChildren("th", "Tags")
      ),
      // Build shot rows
      ...TheShotsProductions.flatMap((production) => {
        if (!productionFilter(production)) {
          return [];
        }

        const productionDisplayName = `${production.productionName} (${production.productionYear})`;

        let didDisplayProductionName = false;
        let latestOperatorData = "";

        return production.shots.flatMap((shot) => {
          if (!shotFilter(shot)) {
            return [];
          }

          // Evaluate what we should display
          const shouldDisplayProductionName = !didDisplayProductionName;

          const operatorData = shot.operatorName + (shot.secondaryOperatorName ?? ""); // Not for display purposes, just for tracking
          const shouldDisplayOperators = operatorData !== latestOperatorData;

          // Update state for next row
          didDisplayProductionName = true;
          latestOperatorData = operatorData;

          // Display shot row
          return createElementWithChildren(
            "tr",
            createElementWithChildren(
              "td",
              ...(shouldDisplayProductionName
                ? [
                    createAnchorElementWithChildren(
                      getURLFor("production", urlForProduction(production)),
                      productionDisplayName
                    ),
                  ]
                : [])
            ),
            createElementWithChildren(
              "td",
              ...(shouldDisplayOperators ? createShotOperatorsElements(shot) : [])
            ),
            createElementWithChildren(
              "td",
              createAnchorElementWithChildren(
                getURLFor("shot", { ...urlForProduction(production), ...urlForShot(shot) }),
                shot.shortDescription
              )
            ),
            createElementWithChildren("td", ...createShotTagsElements(shot))
          );
        });
      })
    ),
  ];
}

function displayIndex(_urlParams: URLSearchParams): HTMLElement[] {
  return displayShotIndex();
}

function displayOperator(urlParams: URLSearchParams): HTMLElement[] {
  const operatorName = operatorFromURL(urlParams);

  if (!operatorName) {
    return displayNotFound();
  }

  return [
    createElementWithChildren("h2", operatorName),

    ...displayShotIndex(
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
    createElementWithChildren("h2", `${production.productionName} (${production.productionYear})`),
    ...displayShotIndex((p) => p === production),
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

  return [
    // Show production details
    createElementWithChildren(
      "h2",
      createAnchorElementWithChildren(
        getURLFor("production", urlForProduction(production)),
        `${production.productionName} (${production.productionYear})`
      )
    ),
    // Show show name
    createElementWithChildren(
      "h3",
      shot.episode ? `${shot.episode}: ` : "",
      `"${shot.shortDescription}" by `,
      ...createShotOperatorsElements(shot),
      shotTimestamp ? ` (at ${shotTimestamp})` : "",
      ...(shot.tags
        ? [
            document.createTextNode(" ("),
            ...createShotTagsElements(shot),
            document.createTextNode(")"),
          ]
        : [])
    ),
    createElementWithInitializerAndChildren(
      "div",
      (element: HTMLElement) => element.classList.add("clearfix"),
      createElementWithInitializerAndChildren(
        "div",
        (element: HTMLElement) => element.classList.add("the_shots_column"),

        // Show shot data
        createElementWithChildren("div", shot.description),

        ...(shot.operatorComments
          ? [
              createElementWithChildren("h4", "Operator comments"),
              createElementWithChildren("div", shot.operatorComments),
            ]
          : []),

        ...(shot.equipment
          ? [
              createElementWithChildren("h4", "Equipment"),
              createElementWithChildren("div", shot.equipment),
            ]
          : [])
      ),
      ...(shot.vimeoId
        ? [
            createElementWithInitializerAndChildren(
              "div",
              (element: HTMLElement) =>
                element.classList.add("the_shots_column", "the_shots_video_container"),
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

function buildSelector<T>(
  options: T[],
  selectedOption: T | undefined,
  title: string,
  labelForOption: (option: T) => string,
  getURLFor: (option: T) => URL
): HTMLElement[] {
  return [
    createElementWithInitializerAndChildren(
      "select",
      (selectElement) => {
        selectElement.onchange = () => {
          // Filter out nil option
          const selectedIndex = parseInt(selectElement.value);

          if (selectedIndex < 0) {
            return;
          }

          const selectedItem = options[selectedIndex];

          // Navigate to URL
          window.location.href = getURLFor(selectedItem).href;
        };
      },

      createElementWithInitializerAndChildren(
        "option",
        (optionElement) => (optionElement.value = "-1"),
        `- ${title} -`
      ),
      ...options.map((option, index) =>
        createElementWithInitializerAndChildren(
          "option",
          (optionElement) => {
            optionElement.value = index.toString();

            if (option === selectedOption) {
              optionElement.selected = true;
            }
          },
          labelForOption(option)
        )
      )
    ),
  ];
}

function buildOperatorSelector(urlParams: URLSearchParams, pageMode: PageMode): HTMLElement[] {
  const selectedOperatorName = pageMode === "operator" ? operatorFromURL(urlParams) : undefined;

  return buildSelector(
    TheShotsSortedOperatorNames,
    selectedOperatorName,
    "Operators",
    (operatorName: string) => operatorName,
    (operatorName: string) => getURLFor("operator", urlForOperator(operatorName))
  );
}

function buildProductionSelector(urlParams: URLSearchParams, pageMode: PageMode): HTMLElement[] {
  const selectedProduction = pageMode === "production" ? productionFromURL(urlParams) : undefined;

  return buildSelector(
    TheShotsProductions,
    selectedProduction,
    "Productions",
    (production: Production) => `${production.productionName} (${production.productionYear})`,
    (production: Production) => getURLFor("production", urlForProduction(production))
  );
}

function buildTagSelector(urlParams: URLSearchParams, pageMode: PageMode): HTMLElement[] {
  const selectedTag = pageMode === "tag" ? tagFromURL(urlParams) : undefined;

  return buildSelector(
    TheShotsTags,
    selectedTag,
    "Tags",
    (tag: string) => tag,
    (tag: string) => getURLFor("tag", urlForTag(tag))
  );
}

function buildRandomShotAnchor(): HTMLElement[] {
  function getRandomArrayElement<T>(data: T[]): T {
    return data[Math.floor(Math.random() * data.length)];
  }

  const randomProduction = getRandomArrayElement(TheShotsProductions);
  const randomShot = getRandomArrayElement(randomProduction.shots);

  return [
    createAnchorElementWithChildren(
      getURLFor("shot", { ...urlForProduction(randomProduction), ...urlForShot(randomShot) }),
      "Random shot"
    ),
  ];
}

function buildSelectorRow(urlParams: URLSearchParams, pageMode: PageMode): HTMLElement[] {
  return [
    createElementWithInitializerAndChildren(
      "div",
      (divElement) => divElement.classList.add("the_shots_selectors"),

      ...buildOperatorSelector(urlParams, pageMode),
      ...buildProductionSelector(urlParams, pageMode),
      ...buildTagSelector(urlParams, pageMode),
      ...(pageMode !== "index"
        ? [createAnchorElementWithChildren(getURLFor("index"), "All shots")]
        : []),
      ...buildRandomShotAnchor()
    ),
  ];
}

// Find and populate index wrapper element
const shotsParentDiv = document.querySelector<HTMLDivElement>("#the_shots_wrapper");

if (shotsParentDiv) {
  // Clear "Loading..." message
  shotsParentDiv.innerHTML = "";

  // Setup
  const urlParams = new URLSearchParams(window.location.search);
  const pageMode = pageModeFromURL(urlParams);

  // Build header/selector row
  appendChildren(shotsParentDiv, buildSelectorRow(urlParams, pageMode));

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
