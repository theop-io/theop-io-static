import { memberSignupButtonQuotes } from "./member-signup-button-quotes";

//
// Site tweak: Apply "Become a member" button quotes to links
//

{
  // Find all links ending with (`$`) a `#member_signup` fragment identifier
  const fragmentIdentifier = "#member_signup";

  const startingQuoteIndex = Math.floor(Math.random() * memberSignupButtonQuotes.length);

  const buttonLinks = document.querySelectorAll<HTMLLinkElement>(
    `a[href$="${fragmentIdentifier}"]`
  );

  buttonLinks.forEach((linkElement, index) => {
    // Remove fragment from link
    linkElement.href = linkElement.href.replace(fragmentIdentifier, "");

    // Replace content
    const quoteIndex = (startingQuoteIndex + index) % memberSignupButtonQuotes.length;

    linkElement.innerText = memberSignupButtonQuotes[quoteIndex];
  });
}
