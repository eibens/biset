function bundle(bundles) {
  return mergeBundles(bundles);
}

// Recursively Merges pairs of bundles to build larger bundles.
function mergeBundles(bundles) {
  // Need at least two bundles for merging.
  if (bundles.length <= 1) return bundles;

  // Combine bundles with equal source sets.
  bundles = collapseBundles(bundles);

  let result = [];
  cross(bundles, (A, B, i, j) => {
    if (j <= i) return;
    // Merge the bundles if they have common targets.
    let targets = intersect([A.targets, B.targets]);
    if (targets.size > 0) {
      result.push({
        sources: union([A.sources, B.sources]),
        targets: targets,
      });
    }
  });

  // Recurse to find further combinations bundles.
  result = mergeBundles(result);

  // After merging some bundles might be contained in others.
  return eliminateBundles(bundles.concat(result));
}

// Combines bundles that have equal source sets.
// Example: ({A}, {1}), ({A}, {2}) is combined to ({A}, {1,2})
function collapseBundles(bundles) {
  let collapsed = [];
  cross(bundles, (A, B, i, j) => {
    if (j <= i) return;
    if (setsEqual(A.sources, B.sources)) {
      A.targets = union([A.targets, B.targets]);
      collapsed[j] = true;
    }
  });
  return bundles.filter((b, i) => !collapsed[i]);
}

// Remove bundles that are already contained in other bundles.
// Example: ({A}, {1}) is contained in ({A,B}, {1,2})
function eliminateBundles(bundles) {
  let eliminated = [];
  cross(bundles, (A, B, i, j) => {
    if (i == j) return;
    if (isSubset(A.sources, B.sources) && isSubset(A.targets, B.targets)) {
      eliminated[j] = true;
    }
  });
  return bundles.filter((b, i) => !eliminated[i]);
}

// Find the intersection of an array of sets.
function intersect(sets) {
  return sets.reduce((A, B) => {
    let X = new Set();
    B.forEach(v => A.has(v) ? X.add(v) : null);
    return X;
  });
}

// Find the union of an array of sets.
function union(sets) {
  let X = new Set();
  sets.forEach(S => S.forEach(e => X.add(e)));
  return X;
}

// Check whether set A equals set B.
function setsEqual(A, B) {
  if (A.size != B.size) return false;
  return A.size == intersect([A, B]).size;
}

// Check whether subset is contained in set.
function isSubset(set, subset) {
  if (set.size < subset.size) return false;
  return subset.size == intersect([set, subset]).size;
}

// Iterate over all pair-wise combinations of elements in the array.
function cross(array, callback) {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length; j++) {
      callback(array[i], array[j], i, j);
    }
  }
}
