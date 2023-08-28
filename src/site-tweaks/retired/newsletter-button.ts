//
// Inject an additional CTA (call-to-action) button in Squarespace's desktop CTA area of the nav bar
//

const headerActionsDiv = document.querySelector<HTMLDivElement>(
  ".header-actions-action.header-actions-action--cta"
);

if (headerActionsDiv) {
  console.log("Found it");
  const newsletterLink = document.createElement("a");

  newsletterLink.href = "/newsletter";
  newsletterLink.classList.add(
    "btn",
    "btn--border",
    "theme-btn--primary-inverse",
    "sqs-button-element--primary"
  );

  newsletterLink.appendChild(document.createTextNode("Newsletter"));

  headerActionsDiv.appendChild(newsletterLink);
}
