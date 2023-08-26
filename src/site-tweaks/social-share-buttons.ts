import { init } from "shareon";

{
  const headerActionsDiv = document.querySelector<HTMLDivElement>(
    ".header-actions-action.header-actions-action--cta"
  );

  if (headerActionsDiv) {
    const socialSharingDiv = document.createElement("div");
    socialSharingDiv.classList.add("shareon"); // Identifies this as the target for @shareon

    const addSharingLink = (service: string) => {
      const sharingLink = document.createElement("a");
      sharingLink.classList.add(service);

      socialSharingDiv.appendChild(sharingLink);
    };

    addSharingLink("facebook");
    addSharingLink("twitter");
    addSharingLink("whatsapp");

    headerActionsDiv.insertBefore(socialSharingDiv, headerActionsDiv.firstChild);

    init();
  }
}
