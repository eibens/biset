class Biset {

  constructor(root) {
    this._root = root;
    this.zoomRange = [0.5, 1];
    this.margin = 40;
    this.cornerRadius = 4;
    this.domainWidth = 200;
    this.relationWidth = 200;
    this.entityHeight = 40;
    this.entitySpacing = 1;
    this.indicatorWidth = 40;
    this.bundleHeight = 48;
    this.bundleSpacing = 8;
    this.sortMode = 'priority';
    this.edgeMode = 'edges';
    this.minBundleSources = 2;
    this.minBundleTargets = 2;
    this.minBundleSize = 0;

    this._space = this._drawSpace(this._root, this._margin, this._zoomRange);
  }

  set data(value) {
    this._data = transform(value);
  }

  set zoomRange(value) {
    this._zoomRange = value;
  }

  set margin(value) {
    this._margin = value;
  }

  set cornerRadius(value) {
    this._cornerRadius = value;
  }

  set domainWidth(value) {
    this._domainWidth = value;
  }

  set relationWidth(value) {
    this._relationWidth = value;
  }

  set entityHeight(value) {
    this._entityHeight = value;
  }

  set entitySpacing(value) {
    this._entitySpacing = value;
  }

  set indicatorWidth(value) {
    this._indicatorWidth = value;
  }

  set bundleHeight(value) {
    this._bundleHeight = value;
  }

  set bundleSpacing(value) {
    this._bundleSpacing = value;
  }

  set sortMode(value) {
    this._sortMode = value;
  }

  set edgeMode(value) {
    this._edgeMode = value;
  }

  set minBundleSources(value) {
    this._minBundleSources = value;
  }

  set minBundleTargets(value) {
    this._minBundleTargets = value;
  }

  set minBundleSize(value) {
    this._minBundleSize = value;
  }

  draw() {
    let data = this._data;

    // Clear space
    this._space.html("");

    let maxEntityFrequency = d3.max(this._data.entities, e => e.frequency);
    this._indicatorUnit = this._indicatorWidth / maxEntityFrequency;

    // Apply dynamic data transformations.
    this._sortEntities(data.domains, this._sortMode);
    this._layoutBundles(data.relations, this._minBundleSources,
      this._minBundleTargets, this._minBundleSize);
    this._hideLinks(data.relations, this._edgeMode);
    this._updateSelection();

    // Draw the actual visualization.
    let space = this._space;
    this._drawRelations(space, data.relations);
    this._drawDomains(space, data.domains);
  }

  clearSelection() {
    this._data.bundles.forEach(b => b.selected = false);
    this._data.entities.forEach(b => b.selected = false);
    this._updateSelection();
  }

  _selectLinksByEntityId(id) {
    return this._root.selectAll(`.link[data-source="${id}"], .link[data-target="${id}"]`);
  }

  _selectLinksByBundleId(id) {
    return this._root.selectAll(`.link[data-bundle="${id}"]`);
  }

  _handleEntityMouseOver(self) {
    return function () {
      let node = d3.select(this.parentNode);
      node.classed("highlighted", true);
      let id = node.attr("data-id");
      self._selectLinksByEntityId(id)
        .classed("highlighted", true);
    };
  }

  _handleEntityMouseOut(self) {
    return function () {
      let node = d3.select(this.parentNode);
      node.classed("highlighted", false);
      let id = node.attr("data-id");
      self._selectLinksByEntityId(id)
        .classed("highlighted", false);
    };
  }

  _handleBundleMouseOver(self) {
    return function () {
      let node = d3.select(this.parentNode);
      node.classed("highlighted", true);
      let id = node.attr("data-id");
      self._selectLinksByBundleId(id)
        .classed("highlighted", true);
    };
  }

  _handleBundleMouseOut(self) {
    return function () {
      let node = d3.select(this.parentNode);
      node.classed("highlighted", false);
      let id = node.attr("data-id");
      self._selectLinksByBundleId(id)
        .classed("highlighted", false);
    };
  }

  _handleEntityClick(self) {
    return function () {
      let node = d3.select(this.parentNode);
      let id = node.attr("data-id");
      let entity = self._data.entities.filter(e => e.id == id)[0];
      entity.selected = !entity.selected;
      self._updateSelection();
    };
  }

  _handleBundleClick(self) {
    return function () {
      let node = d3.select(this.parentNode);
      let id = node.attr("data-id");
      let bundle = self._data.bundles.filter(b => b.id == id)[0];
      bundle.selected = !bundle.selected;
      self._updateSelection();
    };
  }

  _sortEntities(domains, mode) {
    let labelSort = (a, b) => a.label.localeCompare(b.label);

    let frequencySort = (a, b) => {
      let sort = b.frequency - a.frequency;
      // Fallback to alphabetic sort for entities with equal frequency.
      return sort != 0 ? sort : labelSort(a, b);
    };

    // For priority sort we apply the greedy algorithm from the paper.
    // This algorithm computes a 'rank' attribute for every entity.
    this._data.entities.forEach(e => e.rank = undefined);
    this._data.bundles
      .sort((a, b) => a.size - b.size)
      .map((b, i) => {
        b.rank = i;
        return b;
      })
      .forEach(bundle => {
        bundle.sources.concat(bundle.targets).forEach(entity => {
          if (entity.rank == undefined) {
            let bundles = entity.bundles.filter(b => b.visible);
            let totalRank = d3.sum(bundles, b => b.rank);
            entity.rank = totalRank / bundles.length;
          }
        });
      });

    let prioritySort = (a, b) => {
      return a.rank - b.rank;
    };

    let sort = frequencySort;
    switch (mode) {
      case 'label':
        sort = labelSort;
        break;
      case 'priority':
        sort = prioritySort;
        break;
      case 'frequency':
        sort = frequencySort;
        break;
      default:
        throw new Error("Unknown sort mode.");
    }

    domains.forEach(domain => {
      domain.entities.sort(sort).forEach((entity, i) => {
        entity.position = i;
      });
    });
  }

  _layoutBundles(relations, minSources, minTargets, minSize) {
    relations.forEach(relation => {
      relation.bundles.forEach(bundle => {
        // Bundle position is average of connected entity positions.
        let entities = bundle.sources.concat(bundle.targets);
        bundle.position = d3.mean(entities, e => e.position);

        // Filter bundles.
        let hasMinSources = bundle.sources.length >= minSources;
        let hasMinTargets = bundle.targets.length >= minTargets;
        let hasMinSize = entities.length >= minSize;
        let bundlesEnabled = this._edgeMode == 'bundles' || this._edgeMode == 'hybrid';
        bundle.visible = bundlesEnabled && hasMinSources && hasMinTargets && hasMinSize;
      });

      let visibleBundles = relation.bundles
        .filter(b => b.visible)
        .sort((a, b) => a.position - b.position);

      let oldCenter = d3.mean(visibleBundles, b => b.position);

      // Move bundles downwards if they overlap with the one before them.
      let spacing = this._bundleHeight / this._entityHeight;
      for (let i = 1; i < visibleBundles.length; i++) {
        let prev = visibleBundles[i - 1];
        let curr = visibleBundles[i];
        curr.position = Math.max(prev.position + spacing, curr.position);
      }

      // Move all bundles so that the center of gravity is the same as before.
      let newCenter = d3.mean(visibleBundles, b => b.position);
      let correction = oldCenter - newCenter;
      visibleBundles.forEach(b => b.position += correction);
    });
  }

  _hideLinks(relations, edgeMode) {
    relations.forEach(relation => {
      let visibleBundles = relation.bundles.filter(b => b.visible);
      relation.links.forEach(link => {
        link.visible = edgeMode == 'edges' || edgeMode == 'hybrid';

        // In hybrid mode we hide all links that are expressed by a bundle.
        if (edgeMode == 'hybrid') {
          visibleBundles.forEach(bundle => {
            let containsSource = bundle.sources.indexOf(link.source) != -1;
            let containsTarget = bundle.targets.indexOf(link.target) != -1;
            if (containsSource && containsTarget) {
              link.visible = false;
            }
          });
        }
      });
    });
  }

  _updateSelection() {
    let data = this._data;
    let applyFocus = (element, array) => array
      .filter((x, i, self) => self.indexOf(x) === i)
      .filter(x => x.selected)
      .filter(x => x !== element)
      .forEach(x => element.focus++);

    data.entities.forEach(entity => {
      entity.focus = entity.selected ? 1 : 0;
      applyFocus(entity, entity.sources);
      applyFocus(entity, entity.targets);
      applyFocus(entity, entity.bundles);
    });

    data.bundles.forEach(bundle => {
      bundle.focus = bundle.selected ? 1 : 0;
      applyFocus(bundle, bundle.sources);
      applyFocus(bundle, bundle.targets);
    });

    let linkFocus = (a, b) => Math.min(a.focus, b.focus);
    data.relations.forEach(relation => {
      relation.links.forEach(link => {
        link.focus = linkFocus(link.source, link.target);
      });
      relation.sourceLinks.forEach(link => {
        link.focus = linkFocus(link.entity, link.bundle);
      });
      relation.targetLinks.forEach(link => {
        link.focus = linkFocus(link.entity, link.bundle);
      });
    });

    d3.selectAll(".entity")
      .classed("selected", d => d.selected)
      .attr("data-focus", d => d.focus);

    d3.selectAll(".bundle")
      .classed("selected", d => d.selected)
      .attr("data-focus", d => d.focus);

    d3.selectAll(".link")
      .attr("data-focus", d => d.focus);
  }

  _relationScaleX() {
    let halfRelationWidth = this._relationWidth / 2;
    return d3.scaleLinear()
      .domain([-1, 1])
      .range([-halfRelationWidth, halfRelationWidth]);
  }

  _relationScaleY() {
    return d3.scaleLinear()
      .domain([0, 1])
      .range([0, this._entityHeight]);
  }

  _drawSpace(root, offset, zoomRange) {
    // Build hierarchy.
    let zoomContainer = root.append("g")
      .classed("zoom-container", true);
    let offsetContainer = zoomContainer.append("g")
      .classed("offset-container", true);

    // Static transforms.
    offsetContainer.attr("transform", Biset.transform(offset, offset, 1));

    // Detect zoom/pan gestures.
    root.call(d3.zoom()
      .scaleExtent(zoomRange)
      .on("zoom", () => {
        // Zoom transforms.
        zoomContainer.attr("transform", Biset.transform(
          d3.event.transform.x,
          d3.event.transform.y,
          d3.event.transform.k)
        );
      })
    );

    return offsetContainer;
  }

  _drawDomains(root, domains) {
    let self = this;
    let selection = root
      .selectAll(".domain")
      .data(domains);

    // Container
    selection.enter()
      .append("g")
      .classed("domain", true)
      .attr("transform", (d, i) => {
        let x = i * (this._domainWidth + this._relationWidth);
        return Biset.translate(x, 0);
      })
      .each(function (domain) {
        self._drawEntities(d3.select(this), domain.entities);
      });
  }

  _drawEntities(root, entities) {
    let selection = root
      .selectAll(".entity")
      .data(entities);

    // Container
    let contents = selection.enter()
      .append("g")
      .classed("entity", true)
      .classed("selected", d => d.selected)
      .attr("data-id", d => d.id)
      .attr("data-focus", d => d.focus)
      .attr("transform", (d, i) => Biset.translate(0, i * this._entityHeight));

    // Background
    contents.append("rect")
      .classed("background", true)
      .attr("width", this._domainWidth)
      .attr("height", this._entityHeight - this._entitySpacing)
      .attr("rx", this._cornerRadius)
      .attr("ry", this._cornerRadius)
      .on("mouseover", this._handleEntityMouseOver(this))
      .on("mouseout", this._handleEntityMouseOut(this))
      .on("mousedown", this._handleEntityClick(this));

    // Frequency indicator
    let indicators = contents.append("rect")
      .classed("indicator", true)
      .attr("width", d => this._indicatorUnit * d.frequency)
      .attr("height", this._entityHeight - this._entitySpacing)
      .attr("rx", this._cornerRadius)
      .attr("ry", this._cornerRadius);

    // Frequency indicator tooltip
    contents.append("title")
      .text(d => `${d.frequency} occurrence${d.frequency != 1 ? "s" : ""}`);

    // Label
    contents.append("text")
      .classed("text", true)
      .attr("x", 8 + this._indicatorWidth)
      .attr("y", this._entityHeight / 2 + 5)
      .attr("font-size", "16px")
      .attr("fill", "rgba(0, 0, 0, 0.87")
      .text(d => d.label);
  }

  _drawRelations(root, relations) {
    let self = this;
    let selection = root
      .selectAll(".relation")
      .data(relations);

    selection.enter()
      .append("g")
      .classed("relation", true)
      .attr("transform", (d, i) => {
        let x = (i + 1) * this._domainWidth + (i + 0.5) * this._relationWidth;
        let y = this._entityHeight / 2;
        return Biset.translate(x, y);
      })
      .each(function (relation) {
        let node = d3.select(this);
        self._drawSoloLinks(node, relation.links);
        self._drawSourceLinks(node, relation.sourceLinks);
        self._drawTargetLinks(node, relation.targetLinks);
        self._drawBundles(node, relation.bundles);
      });
  }

  _drawBundles(root, bundles) {
    let scaleX = this._relationScaleX();
    let scaleY = this._relationScaleY();
    let width = bundle => this._indicatorUnit * bundle.size;

    let selection = root
      .selectAll(".bundle")
      .data(bundles.filter(b => b.visible));

    let containers = selection.enter()
      .append("g")
      .classed("bundle", true)
      .classed("selected", d => d.selected)
      .attr("data-id", d => d.id)
      .attr("data-focus", d => d.focus)
      .attr("transform", d => {
        let x = scaleX(0) - width(d) / 2;
        let y = scaleY(d.position) - this._bundleHeight / 2;
        return Biset.translate(x, y);
      });

    containers.append("rect")
      .classed("background", true)
      .attr("width", width)
      .attr("height", this._bundleHeight - this._bundleSpacing)
      .attr("rx", this._cornerRadius)
      .attr("ry", this._cornerRadius)
      .on("mouseover", this._handleBundleMouseOver(this))
      .on("mouseout", this._handleBundleMouseOut(this))
      .on("mousedown", this._handleBundleClick(this));

    containers.append("rect")
      .classed("indicator", true)
      .attr("width", d => d.sources.length / d.size * width(d))
      .attr("height", this._bundleHeight - this._bundleSpacing)
      .attr("rx", this._cornerRadius)
      .attr("ry", this._cornerRadius);

    containers.append("title")
      .text(d => `${d.sources.length}/${d.targets.length}`);
  }

  _drawSoloLinks(root, links) {
    let scaleX = this._relationScaleX();
    let scaleY = this._relationScaleY();

    let selection = root
      .selectAll(".solo-link")
      .data(links.filter(l => l.visible));
    selection.enter()
      .append("path")
      .classed("link", true)
      .classed("solo-link", true)
      .attr("data-id", d => d.id)
      .attr("data-source", d => d.source.id)
      .attr("data-target", d => d.target.id)
      .attr("data-focus", d => d.focus)
      .attr("d", d => Biset.link(
        scaleX(-1),
        scaleY(d.source.position),
        scaleX(1),
        scaleY(d.target.position)
      ));
  }

  _drawSourceLinks(root, links) {
    let scaleX = this._relationScaleX();
    let scaleY = this._relationScaleY();

    let selection = root
      .selectAll(".source-link")
      .data(links.filter(l => l.bundle.visible));
    selection.enter()
      .append("path")
      .classed("link", true)
      .classed("source-link", true)
      .attr("data-id", d => d.id)
      .attr("data-source", d => d.entity.id)
      .attr("data-bundle", d => d.bundle.id)
      .attr("data-focus", d => d.focus)
      .attr("d", d => Biset.link(
        -d.bundle.size * this._indicatorUnit / 2,
        scaleY(d.bundle.position),
        scaleX(-1),
        scaleY(d.entity.position)
      ));
  }

  _drawTargetLinks(root, links) {
    let scaleX = this._relationScaleX();
    let scaleY = this._relationScaleY();

    let selection = root
      .selectAll(".target-link")
      .data(links.filter(l => l.bundle.visible));
    selection.enter()
      .append("path")
      .classed("link", true)
      .classed("target-link", true)
      .attr("data-id", d => d.id)
      .attr("data-target", d => d.entity.id)
      .attr("data-bundle", d => d.bundle.id)
      .attr("data-focus", d => d.focus)
      .attr("d", d => Biset.link(
        d.bundle.size * this._indicatorUnit / 2,
        scaleY(d.bundle.position),
        scaleX(1),
        scaleY(d.entity.position)
      ));
  }

  static transform(x, y, scale) {
    return `translate(${x}, ${y}) scale(${scale})`;
  }

  static translate(x, y) {
    return Biset.transform(x, y, 1);
  }

  static link(x0, y0, x1, y1) {
    let xm = (x0 + x1) / 2;
    return `M ${x0} ${y0} C ${xm} ${y0} ${xm} ${y1} ${x1} ${y1}`;
  }
}
