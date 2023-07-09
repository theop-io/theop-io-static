export const theWordsLinkPrefix = "#thewords"; // Used to identify theWords links when configuring the page

export function wordKeyFromWord(word: string) {
  return word.toLowerCase().replace(/ /g, "_");
}
