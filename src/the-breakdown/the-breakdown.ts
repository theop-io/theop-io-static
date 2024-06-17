function getTagBasedArchiveGroupList() {
  // Find the ul.archive-group-list...
  for (const archiveGroupList of document.querySelectorAll<HTMLUListElement>(
    "ul.archive-group-list"
  )) {
    if (archiveGroupList.querySelector("a")?.href.includes("/tag/")) {
      // ...that links by tag
      return archiveGroupList;
    }
  }

  return null;
}

function sortOperatorList(operatorList: HTMLUListElement) {
  // Build map of sortable key to list item element
  const tagKeyToTagListItem = new Map<string, HTMLLIElement>();

  for (const archiveGroup of operatorList.querySelectorAll<HTMLLIElement>("li.archive-group")) {
    // Extract tag from embedded link
    const tag = archiveGroup.querySelector("a")?.href.split("/").pop();

    if (!tag) {
      continue;
    }

    // Split tag into name components
    const tagComponents = tag.split("+");

    if (!tagComponents) {
      continue;
    }

    // Build sort key starting with the last name component
    const tagSortKey = [tagComponents.pop(), ...tagComponents].join("");

    // Save list item element for this sort/tag key
    tagKeyToTagListItem.set(tagSortKey, archiveGroup);
  }

  // Traverse map in sorted order and re-insert children into parent node
  // since re-inserting them will remove them from their original position
  // (not pretty but so it goes).
  const sortedTags = [...tagKeyToTagListItem.keys()].sort();

  for (const tag of sortedTags) {
    operatorList.appendChild(tagKeyToTagListItem.get(tag)!);
  }
}

// If this is the "The Breakdown" page...
if (window.location.href.includes("/the-breakdown")) {
  const operatorList = getTagBasedArchiveGroupList();

  if (operatorList) {
    sortOperatorList(operatorList);
  }
}
