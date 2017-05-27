function transform(csv) {
  if (csv.length == 0) throw Error('No entries in data.');

  // Extract domains.
  let domainId = 1;
  let domains = d3.keys(csv[0]).map(label => ({
    id: domainId++,
    label: label,
  }));

  // Extract entities.
  let entityId = 1;
  let entities = domains.map(domain => {
    domain.entities = [];
    csv.forEach(row => {
      let label = row[domain.label];
      if (domain.entities[label] === undefined) {
        domain.entities[label] = {
          id: entityId++,
          label: label,
          domain: domain,
          sources: [],
          targets: [],
          frequency: 0,
        };
      }
      domain.entities[label].frequency++;
    });
    domain.entities = d3.values(domain.entities);
    return domain.entities;
  }).reduce((acc, e) => acc.concat(e), []);

  // Extract relations.
  let relationId = 1;
  let relations = [];
  for (let i = 1; i < domains.length; i++) {
    let source = domains[i - 1];
    let target = domains[i];
    let relation = {
      id: relationId++,
      source: source,
      target: target,
      links: [],
      sourceLinks: [],
      targetLinks: [],
      bundles: [],
    };
    source.targetRelation = relation;
    target.sourceRelation = relation;
    if (!source.sourceRelation) {
      source.sourceRelation = null;
    }
    if (!target.targetRelation) {
      target.targetRelation = null;
    }
    relations.push(relation);
  }

  // Extract links.
  let findFirst = (array, predicate) => {
    for (let i = 0; i < array.length; i++) {
      if (predicate(array[i])) return array[i];
    }
    return null;
  };
  let linkId = 1;
  csv.forEach(row => {
    relations.forEach(relation => {
      let sourceLabel = row[relation.source.label];
      let targetLabel = row[relation.target.label];
      let source = findFirst(relation.source.entities, e => e.label == sourceLabel);
      let target = findFirst(relation.target.entities, e => e.label == targetLabel);
      if (source == null) throw Error(`Entity with label "${sourceLabel}" not found in domain "${relation.source.label}"`);
      if (target == null) throw Error(`Entity with label "${targetLabel}" not found in domain "${relation.target.label}"`);
      source.targets.push(target);
      target.sources.push(source);
      relation.links.push({
        id: linkId++,
        relation: relation,
        source: source,
        target: target,
        bundled: false,
      });
    });
  });

  // Extract bundles.
  let bundleId = 1;
  let bundles = relations.map(relation => {
    relation.bundles = bundle(relation.links.map(link => ({
      sources: new Set([link.source]),
      targets: new Set([link.target]),
    }))).map(b => ({
      id: bundleId++,
      sources: Array.from(b.sources),
      targets: Array.from(b.targets),
      size: b.sources.size + b.targets.size,
    }));
    return relation.bundles;
  }).reduce((acc, b) => acc.concat(b), []);

  // Extract source/target links for bundles.
  relations.forEach(relation => {
    relation.bundles.forEach(bundle => {
      let sourceLinks = bundle.sources.map(entity => ({
        relation: relation,
        bundle: bundle,
        entity: entity,
      }));
      let targetLinks = bundle.targets.map(entity => ({
        relation: relation,
        bundle: bundle,
        entity: entity,
      }));
      relation.sourceLinks = relation.sourceLinks.concat(sourceLinks);
      relation.targetLinks = relation.targetLinks.concat(targetLinks);
    });
  });

  return {
    domains: domains,
    relations: relations,
    entities: entities,
  };
}
