{
  const headerActionsDiv = document.querySelector<HTMLDivElement>(
    ".header-actions-action.header-actions-action--cta"
  );

  if (headerActionsDiv) {
    const socialSharingDiv = document.createElement("div");
    socialSharingDiv.classList.add("shareon"); // Identifies this as the target for @shareon

    const addSharingLink = (service: string, href: string) => {
      const sharingLink = document.createElement("a");
      sharingLink.classList.add(service); // for CSS

      sharingLink.href = href;
      sharingLink.rel = "noopener noreferrer";
      sharingLink.target = "_blank";

      socialSharingDiv.appendChild(sharingLink);
    };

    const url = window.location.href;
    const title = document.title;

    addSharingLink("facebook", `https://www.facebook.com/sharer/sharer.php?u=${url}`);
    addSharingLink("twitter", `https://twitter.com/intent/tweet?url=${url}&text=${title}`);
    addSharingLink("whatsapp", `https://wa.me/?text=${title}%0D%0A${url}`);

    headerActionsDiv.insertBefore(socialSharingDiv, headerActionsDiv.firstChild);
  }
}
