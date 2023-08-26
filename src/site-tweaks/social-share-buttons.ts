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
  const headerActionsDiv = document.querySelector<HTMLDivElement>(
    ".header-actions-action.header-actions-action--cta"
  );

  if (headerActionsDiv) {
    headerActionsDiv.insertBefore(buildShareToSocialLinksElement(), headerActionsDiv.firstChild);
  }
}
