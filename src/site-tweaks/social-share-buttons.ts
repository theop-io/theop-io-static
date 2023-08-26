function buildShareToSocialLinksElement(): HTMLElement {
  const socialSharingContainer = document.createElement("span");
  socialSharingContainer.classList.add("shareon"); // for CSS

  const addSharingLink = (service: string, href: string) => {
    const sharingLink = document.createElement("a");
    sharingLink.classList.add(service); // for CSS

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
    desktopHeaderActionsDiv.insertBefore(
      buildShareToSocialLinksElement(),
      desktopHeaderActionsDiv.firstChild
    );
  }

  // For mobile
  const mobileMenuCTADiv = document.querySelector<HTMLDivElement>(
    ".header-menu-nav-folder.header-menu-cta"
  );

  if (mobileMenuCTADiv) {
    mobileMenuCTADiv.insertBefore(buildShareToSocialLinksElement(), mobileMenuCTADiv.firstChild);
  }
}
