//
// Site tweak: Apply coloring to navigation bar entries
//

function styleNavigationElement(element: HTMLLinkElement | HTMLSpanElement | HTMLDivElement) {
  // Find suitable text element to manipulate
  const linkTextElement =
    element.querySelector("div") ?? // Descend into inner <div> if it exists
    element.querySelector("span:not([class])") ?? // Mobile nested menu may be in a class-less span
    element; // Otherwise use this element as-is

  // Extract HTML because for whatever reason, the mobile menu items don't present a cogent innerText, only innerHTML
  const innerHTML = linkTextElement.innerHTML;

  if (innerHTML.includes("<")) {
    // Interior HTML tags - walk away and leave element as-is
    return;
  }

  // Remove new-lines and spaces from start and end of string
  const innerText = innerHTML.replace(/^[\n ]+|[\n ]+$/g, "");

  const thePrefix = "The";

  if (!innerText.startsWith(thePrefix)) {
    // Leave element as-is
    return;
  }

  // Reset element content to just "The" prefix
  linkTextElement.innerText = thePrefix + " ";

  // Add span for remaining inner text wrapped in a class'd <span>
  const remainingInnerText = innerText.substring(thePrefix.length);

  const innerSpan = document.createElement("span");
  innerSpan.appendChild(document.createTextNode(remainingInnerText));
  innerSpan.classList.add("header-nav-word-highlight");

  linkTextElement.appendChild(innerSpan);
}

{
  // Somewhat fragile matching of SquareSpace 7.1 navigation bar elements...
  // - Top-level navigation links
  document
    .querySelectorAll<HTMLLinkElement>("div.header-nav-item a")
    .forEach(styleNavigationElement);

  // - Nested navigation links
  document
    .querySelectorAll<HTMLSpanElement>(
      "div.header-nav-folder-item a span.header-nav-folder-item-content"
    )
    .forEach(styleNavigationElement);

  // - Top-level and nested mobile menu links
  document
    .querySelectorAll<HTMLDivElement>("div.header-menu-nav-item-content")
    .forEach(styleNavigationElement);
}
