import { theWordsLinkPrefix, wordKeyFromWord } from "./the-words-core";
import { theWordsList } from "./the-words-list";

const indexParentDiv = document.querySelector("#the_words_index");

if (indexParentDiv) {
  theWordsList
    .map((x) => x[0])
    .forEach((theWord) => {
      // Create <a>
      const anchorElement = document.createElement("a");

      // Configure <a>
      anchorElement.classList.add("the_words_index_word");
      anchorElement.href = theWordsLinkPrefix + "_" + wordKeyFromWord(theWord);

      // Create and append content
      anchorElement.appendChild(document.createTextNode(theWord));

      // Add to parent div
      indexParentDiv.appendChild(anchorElement);

      // Add spacer in parent div
      indexParentDiv.appendChild(document.createTextNode(" "));
    });
}
