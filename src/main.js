function load(csv) {
  if (csv.length == 0) throw Error('No entries in data.');
  let columns = d3.keys(csv[0]).map(key => {
    let values = d3.nest()
      .key(d => d[key])
      .entries(csv)
      .map(d => d.key);
    return {
      key: key,
      values: values,
      links: [],
    };
  });
  csv.forEach(row => {
    for (let i = 0; i < columns.length - 1; i++) {
      let colA = columns[i];
      let colB = columns[i + 1];
      let valueA = row[colA.key];
      let valueB = row[colB.key];
      let indexA = colA.values.indexOf(valueA);
      let indexB = colB.values.indexOf(valueB);
      if (indexA < 0) throw Error(`Value "${valueA}" not found in column "${colA.key}"`);
      if (indexB < 0) throw Error(`Value "${valueB}" not found in column "${colB.key}"`);
      colA.links.push([indexA, indexB]);
    }
  });
  return columns;
}

function createDomains(data) {
    var domains = new Array();

    for (j = 0; j < data.length; j++) {
        var temp = new Array();
        temp.push();
        for (i = 0; i < data[j].values.length; i++) {
            temp.push({
                id: (i+1),
                lable: data[j].values[i]
            });
        }
        domains.push({
            id: (j+1),
            label: data[j].key,
            entities: temp,
        });
    }
    
    return domains;
}

const setUnion = (...sets) => {
    let X = new Set();
    sets.forEach(S => S.forEach(e => X.add(e)))
    return X;
};

const setIntersection = (...sets) => sets.reduce(
 (A, B) => {
     let X = new Set();
     B.forEach((v => { if (A.has(v)) X.add(v) }));
     return X;
 });

function isSetInArray(arrTarget, cmprSet) {
    for (i = 0; i < arrTarget.length; i++) {
        var union = setUnion(arrTarget[i], cmprSet);
        if (union.size === cmprSet.size) {
            return true;
        }
    }
    return false;
}

function findBundles(data, links, column) {
    targetSet = new Array();
    for (x = 0; x < data[column].values.length; x++) {
        var targets = new Set();

        for (y = 0; y < links.length; y++) {
            if (links[y].source === x + 1) {
                targets.add(links[y].target);
            }
        }

        targetSet.push(targets);
    }

    clusterArray = new Array();
    clusterSource = new Array();
    clusterTarget = new Array();
    for (x = 0; x < targetSet.length; x++) {
        temp = new Set();
        for (y = 0; y < targetSet.length; y++) {
            var intersection = setIntersection(targetSet[x], targetSet[y]);

            if (intersection.size >= 3) {
                temp.add(y + 1);
            }
        }

        var smallest = 9999999;
        var smallestIndex;
        var union = new Set();
        var smallestSet = new Set();
        if (temp.size !== 0) {
            for (var it = temp.values(), val = null; val = it.next().value;) {
                union = setUnion(union, targetSet[val - 1]);

                if (smallest > targetSet[val-1].size) {
                    smallest = targetSet[val-1].size;
                    smallestIndex = val-1;
                }
            }

            smallestSet = targetSet[smallestIndex];
            for (var it = temp.values(), val = null; val = it.next().value;) {
                intersectSmallest = setIntersection(smallestSet, targetSet[val - 1]);;

                if (intersectSmallest.size !== smallest) {
                    temp.delete(val);
                }
            }
        }

        if (temp.size >= 3 && !isSetInArray(clusterSource, temp)) {
            clusterSource.push(temp);
            clusterTarget.push(smallestSet);
        }
    }

    for (x = 0; x < clusterSource.length; x++) {
        clusterArray.push({
            id: x+1,
            source: clusterSource[x],
            target: clusterTarget[x],
        });
    }
    
    
    return clusterArray;
}

function createRelations(data) {
    var relations = new Array();

    for (j = 0; j < data.length-1; j++) {
        var links = new Array();

        for (i = 0; i < data[j].links.length; i++) {   
            links.push({
                id: (i + 1),
                source: data[j].links[i][0]+1,
                target: data[j].links[i][1]+1,
            });
        }

        var bundles = findBundles(data, links, j);

        relations.push({
            id: 1,
            source: j+1,
            target: (j+2),
            links: links,
            bundles: bundles
        });
    }

    return relations;
}

function setupSpace(svg, offset, zoomRange) {
  let transform = (group, x, y, s) => {
    group.attr("transform", `translate(${x}, ${y}) scale(${s})`);
  };

  // Build hierarchy.
  let zoomContainer = svg.append("g").classed("zoom-container", true);
  let offsetContainer = zoomContainer.append("g").classed("offset-container", true);

  // Static transforms.
  transform(offsetContainer, offset, offset, 1);

  // Detect zoom/pan gestures.
  svg.call(d3.zoom()
    .scaleExtent(zoomRange)
    .on("zoom", () => {
      // Zoom transforms.
      transform(zoomContainer,
        d3.event.transform.x,
        d3.event.transform.y,
        d3.event.transform.k);
    })
  );

  return offsetContainer;
}

d3.csv("data.csv", csv => {
  const CONFIG = {
    zoomRange: [0.5, 2],
    margin: 40,
    cellHeight: 40,
    nodeColumnWidth: 200,
    linkColumnWidth: 200,
  };

  let data = load(csv);
  let domains = createDomains(data);
  let relations = createRelations(data);
  let datastructure = {
      domains: domains,
      relations: relations
  }
  console.log(datastructure);

  let space = setupSpace(d3.select("svg"), CONFIG.margin, CONFIG.zoomRange);

  let nodeColumnX = i => i * (CONFIG.nodeColumnWidth + CONFIG.linkColumnWidth);
  let linkColumnX = i => nodeColumnX(i) + CONFIG.nodeColumnWidth + CONFIG.linkColumnWidth / 2;
  let linkColumnY = CONFIG.cellHeight / 2;

  let transform = (x, y) => `translate(${x},${y})`;
  let nodeColumnTransform = (d, i) => transform(nodeColumnX(i), 0);
  let linkColumnTransform = (d, i) => transform(linkColumnX(i), linkColumnY);
  let cellTransform = (d, i) => transform(0, i * CONFIG.cellHeight);

  let nodeColumns = space
    .selectAll(".node-column")
    .data(data);
  nodeColumns.enter()
    .append("g")
    .classed("node-column", true)
    .attr("transform", nodeColumnTransform)
    .each(function (column) {
      let cells = d3.select(this)
        .selectAll(".cell")
        .data(column.values);

      let cellContent = cells.enter()
        .append("g")
        .classed("cell", true)
        .attr("transform", cellTransform)
        .attr("data-column", column.key)
        .attr("data-index", (d, i) => i);

      let selectRelatedLinks = (columnKey, entityIndex) =>
        d3.selectAll(
          `.link-column[data-left="${columnKey}"] .link[data-left="${entityIndex}"],` +
          `.link-column[data-right="${columnKey}"] .link[data-right="${entityIndex}"]`
        );

      cellContent.append("rect")
        .attr("width", CONFIG.nodeColumnWidth)
        .attr("height", CONFIG.cellHeight - 1)
        .on("mouseover", function () {
          let cell = d3.select(this.parentNode);
          cell.classed("cell--highlighted", true);
          let entityIndex = cell.attr("data-index");
          let columnKey = cell.attr("data-column");
          selectRelatedLinks(columnKey, entityIndex)
            .classed("link--highlighted", true);
        })
        .on("mouseout", function () {
          let cell = d3.select(this.parentNode);
          cell.classed("cell--highlighted", false);
          let entityIndex = cell.attr("data-index");
          let columnKey = cell.attr("data-column");
          selectRelatedLinks(columnKey, entityIndex)
            .classed("link--highlighted", false);
        });

      cellContent.append("text")
        .attr("x", 8)
        .attr("y", CONFIG.cellHeight / 2 + 5)
        .attr("font-size", "16px")
        .attr("fill", "rgba(0, 0, 0, 0.87")
        .text(d => d);
    });

  let linkColumns = space
    .selectAll(".link-column")
    .data(data);
  linkColumns.enter()
    .append("g")
    .classed("link-column", true)
    .attr("data-left", d => d.key)
    .attr("data-right", d => linkColumns.data()[d])
    .attr("transform", linkColumnTransform)
    .each(function (column) {
      let halfColWidth = CONFIG.linkColumnWidth / 2;
      let scaleX = d3.scaleLinear()
        .domain([-1, 1])
        .range([-halfColWidth, halfColWidth]);
      let scaleY = d3.scaleLinear()
        .domain([0, 1])
        .range([0, CONFIG.cellHeight]);

      let links = d3.select(this)
        .selectAll(".link")
        .data(column.links);
      links.enter()
        .append("path")
        .classed("link", true)
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .attr("data-left", d => d[0])
        .attr("data-right", d => d[1])
        .attr("data-column", column.key)
        .attr("d", link => {
          let x0 = scaleX(-1);
          let xm = scaleX(0);
          let x1 = scaleX(1);
          let y0 = scaleY(link[0]);
          let y1 = scaleY(link[1]);
          return `M ${x0} ${y0} C ${xm} ${y0} ${xm} ${y1} ${x1} ${y1}`;
        });
    });
});
