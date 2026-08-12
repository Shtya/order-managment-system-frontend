export function areAllDependenciesCompleted(dependsOn, completedSet) {
  if (!Array.isArray(dependsOn) || dependsOn.length === 0) return true;
  if (!completedSet) return false;
  return dependsOn.every((key) => completedSet.has(key));
}

export function canStartItem(item, completedSet) {
  if (!item) return false;
  if (item.completed === true) return true;
  return areAllDependenciesCompleted(item.dependsOn, completedSet);
}

export function hasDependencies(item, itemsByKey) {
  if (!item || !itemsByKey) return false;
  const deps = Array.isArray(item.dependsOn) ? item.dependsOn : [];
  return deps.length > 0;
}

export function getDependenciesForItem(itemKey, itemsByKey) {
  const item = itemsByKey?.[itemKey];
  if (!item || !Array.isArray(item.dependsOn) || item.dependsOn.length === 0) {
    return [];
  }
  return item.dependsOn
    .map((depKey) => itemsByKey?.[depKey])
    .filter(Boolean);
}

export function resolveClickBehavior({
  item,
  completedSet,
  itemsByKey,
}) {
  if (!item) {
    return { type: "noop" };
  }
  const deps = getDependenciesForItem(item.key, itemsByKey);
  const hasDeps = deps.length > 0;
  const canStart = canStartItem(item, completedSet);
  const completed = item.completed === true;
  if (!hasDeps && completed) {
    return { type: "noop" };
  }
  if (hasDeps && completed) {
    return { type: "noop" };
  }
  if (!hasDeps && canStart) {
    return { type: "start_tour" };
  }
  if (hasDeps && !canStart && !completed) {
    return { type: "open_sidebar" };
  }
  if (hasDeps && !completed) {
    return { type: "open_sidebar" };
  }
  return { type: "start_tour" };
}

export function isStartButtonDisabled(item, completedSet) {
  if (!item) return true;
  if (item.completed === true) return false;
  return !areAllDependenciesCompleted(item.dependsOn, completedSet);
}
