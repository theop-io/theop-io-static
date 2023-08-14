import { memberSignupButtonQuotes } from "./member-signup-button-quotes";

// import isUserLoggedIn from "./is-user-logged-in";
const isUserLoggedIn = false; // Always show the buttons

//
// Site tweak: Process member signup buttons
//

function mutateMemberSignupButton(fragmentIdentifier: string, applyQuotes: boolean) {
  // Find all links ending with (`$`) the given fragment identifier
  const buttonLinks = document.querySelectorAll<HTMLLinkElement>(
    `a[href$="${fragmentIdentifier}"]`
  );

  if (!isUserLoggedIn) {
    if (!applyQuotes) {
      // Nothing left to do
      return;
    }

    // Apply "Become a member" button quotes to links
    const startingQuoteIndex = Math.floor(Math.random() * memberSignupButtonQuotes.length);

    buttonLinks.forEach((linkElement, index) => {
      // Remove fragment from link
      linkElement.href = linkElement.href.replace(fragmentIdentifier, "");

      // Replace content
      const quoteIndex = (startingQuoteIndex + index) % memberSignupButtonQuotes.length;

      linkElement.innerText = memberSignupButtonQuotes[quoteIndex];
    });
  } else {
    // Remove "Become a member" button
    buttonLinks.forEach((linkElement) => {
      linkElement.remove();
    });
  }
}

mutateMemberSignupButton("#member_signup", true);
mutateMemberSignupButton("#member_signup_verbatim", false);
