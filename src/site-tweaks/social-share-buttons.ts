function buildShareToSocialLinksElement(): HTMLElement {
  const socialSharingContainer = document.createElement("span");
  socialSharingContainer.classList.add("shareon"); // for CSS to bind to

  const addSharingLink = (service: string, href: string) => {
    const sharingLink = document.createElement("a");
    sharingLink.classList.add(service); // for CSS to bind to

    sharingLink.href = href;
    sharingLink.rel = "noopener noreferrer";
    sharingLink.target = "_blank";

    socialSharingContainer.appendChild(sharingLink);
  };

  const url = window.location.href;
  const title = document.title;

  addSharingLink("facebook", `https://www.facebook.com/sharer/sharer.php?u=${url}`);
  addSharingLink("twitter", `https://twitter.com/intent/tweet?url=${url}&text=${title}`);
  addSharingLink("whatsapp", `https://wa.me/?text=${title}%0D%0A${url}`);

  return socialSharingContainer;
}

{
  // For desktop
  const desktopHeaderActionsDiv = document.querySelector<HTMLDivElement>(
    ".header-actions-action.header-actions-action--cta"
  );

  if (desktopHeaderActionsDiv) {
    // Add social links in front of the "Newsletter" button
    desktopHeaderActionsDiv.insertBefore(
      buildShareToSocialLinksElement(),
      desktopHeaderActionsDiv.firstChild
    );
  }

  // For mobile
  const mobileMenuCTADiv = document.querySelector<HTMLDivElement>(".header-menu-cta");

  if (mobileMenuCTADiv) {
    // Add a second CTA <div> in front of the existing one so the social links get their own row
    const mobileMenuSocialCTADiv = document.createElement("div");
    mobileMenuSocialCTADiv.classList.add("header-menu-cta");

    mobileMenuSocialCTADiv.appendChild(buildShareToSocialLinksElement());

    mobileMenuCTADiv.parentNode?.insertBefore(mobileMenuSocialCTADiv, mobileMenuCTADiv);
  }
}
