import { memberSignupButtonQuotes } from "./member-signup-button-quotes";

import isUserLoggedIn from "./is-user-logged-in";

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

//
// Site tweak: Change primary (bottom-left/footer) member signup button to point to account management when member is signed in
//

if (isUserLoggedIn) {
  // Find all links ending with (`$`) the given fragment identifier
  const menberButtonFragmentIdentifier = "#primary_member_signup";

  const memberButtonLinks = document.querySelectorAll<HTMLLinkElement>(
    `a[href$="${menberButtonFragmentIdentifier}"]`
  );

  memberButtonLinks.forEach((linkElement) => {
    linkElement.href = "/?msopen=%2Fmember%2Fsign_in";
    linkElement.innerText = "Your Account";
  });
}
