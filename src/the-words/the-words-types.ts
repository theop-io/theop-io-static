export function wordKeyFromWord(word: string) {
  return word
    .toLowerCase()
    .replace(/[`'“’]/g, "")
    .replace(/ /g, "_");
}

export type TheWordsDatabase = {
  KeyToDisplayName: Map<string, string>;
  DisplayNameToDefinition: Map<string, string>;
  DisplayNamesInDisplayOrder: Array<string>;
};
