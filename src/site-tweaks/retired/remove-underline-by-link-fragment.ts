//
// Site tweak: Remove underline from links with trailing fragment identifier
// (Inactive, proceeding with "strikethrough" decoration approach because it's cheaper)
//

// Find all links ending with (`$`) a `#no_ul` fragment identifier
const noUnderlineFragmentIdentifier = "#no_ul";

const allNoUnderlineLinks = document.querySelectorAll(
  `a[href$="${noUnderlineFragmentIdentifier}"]`
);

allNoUnderlineLinks.forEach((linkElement) => {
  linkElement.classList.add("no_underline");

  const linkHref = linkElement.getAttribute("href");

  if (linkHref) {
    linkElement.setAttribute("href", linkHref.replace(noUnderlineFragmentIdentifier, ""));
  }
});
