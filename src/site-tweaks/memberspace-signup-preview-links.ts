//
// Adjust MemberSpace login/signup popup to include links to sample content
//

function adjustMemberspaceStatusIndicatorDiv(statusIndicatorDiv: HTMLDivElement) {
  // The MemberSpace login/signup popup wraps its text in a <ms-typography> element
  const typographyElement = statusIndicatorDiv.querySelector("MS-TYPOGRAPHY");

  if (!typographyElement) {
    return;
  }

  typographyElement.insertAdjacentHTML(
    "beforeend",
    `<div class="ms-signup-added-text">
  Check out <a href="/sign-up">what you get as a member</a>, 
  including example <a href="/sample-blog-posts">blog posts</a> and <a href="/sample-breakdown-page">breakdowns</a>.
  </div>
  `
  );
}

function setupMemberSpaceStatusPopupObserver(memberSpaceWidgetRoot: Element) {
  // Construct an observer that scans for the creation of a <div> representing the login/signup popup.
  const memberSpaceStatusPopupObserver = new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type !== "childList") {
        continue;
      }

      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeName !== "DIV") {
          continue;
        }

        const addedDiv = addedNode as HTMLDivElement;

        if (addedDiv.classList.contains("MemberSpaceWidgetInternal__StatusIndicator_container")) {
          adjustMemberspaceStatusIndicatorDiv(addedDiv);

          // No more observing required
          observer.disconnect();
        }
      }
    }
  });

  memberSpaceStatusPopupObserver.observe(memberSpaceWidgetRoot, { childList: true, subtree: true });
}

// We may be running late enough that MemberSpace has already injected this element...
const memberSpaceWidgetRoot = document.querySelector("MS-WIDGET-ROOT");

if (memberSpaceWidgetRoot) {
  setupMemberSpaceStatusPopupObserver(memberSpaceWidgetRoot);
} else {
  // ...but it's unlikely. Wait for it instead.
  const bodyElement = document.querySelector("body");

  if (bodyElement) {
    const memberSpaceRootObserver = new MutationObserver((mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type !== "childList") {
          continue;
        }

        for (const addedNode of mutation.addedNodes) {
          if (addedNode.nodeName === "MS-WIDGET-ROOT") {
            setupMemberSpaceStatusPopupObserver(addedNode as Element);
            observer.disconnect();
          }
        }
      }
    });

    // This will be an immediate descendent of the <body> so we don't need to monitor the entire body subtree.
    memberSpaceRootObserver.observe(bodyElement, { childList: true, subtree: false });
  }
}
