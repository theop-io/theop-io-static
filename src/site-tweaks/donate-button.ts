//
// Inject an additional CTA (call-to-action) button in Squarespace's desktop CTA area of the nav bar
//

{
  const headerActionsDiv = document.querySelector<HTMLDivElement>(
    ".header-actions-action.header-actions-action--cta"
  );

  if (headerActionsDiv) {
    const donationLink = document.createElement("a");

    donationLink.href =
      "https://www.paypal.com/donate?token=YaKprf1DJPIL50Sm2CJpo4glaQzjGeCX4T-AoqOxBVHTOkaH-tR_NGJsO1xr5bZK7i_-29Cb88d6i_uR";

    donationLink.classList.add(
      "btn",
      "btn--border",
      "theme-btn--primary-inverse",
      "sqs-button-element--primary",
      "theop-button-donate"
    );

    donationLink.appendChild(document.createTextNode("Donate"));

    headerActionsDiv.insertBefore(donationLink, headerActionsDiv.firstChild);
  }
}
