import { memberSignupButtonQuotes } from "./member-signup-button-quotes";

//
// Site tweak: Apply quotes to member signup buttons inlined in pages
//

// Find all links ending with (`$`) the given fragment identifier
const quoteButtonFragmentIdentifier = "#member_signup";

const quoteButtonLinks = document.querySelectorAll<HTMLLinkElement>(
  `a[href$="${quoteButtonFragmentIdentifier}"]`
);

// Apply "Become a member" button quotes to links
const startingQuoteIndex = Math.floor(Math.random() * memberSignupButtonQuotes.length);

quoteButtonLinks.forEach((linkElement, index) => {
  // Remove fragment from link
  linkElement.href = linkElement.href.replace(quoteButtonFragmentIdentifier, "");

  // Replace content
  const quoteIndex = (startingQuoteIndex + index) % memberSignupButtonQuotes.length;

  linkElement.innerText = memberSignupButtonQuotes[quoteIndex];
});
