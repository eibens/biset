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
        .attr("transform", cellTransform);

      cellContent.append("rect")
        .attr("width", CONFIG.nodeColumnWidth)
        .attr("height", CONFIG.cellHeight - 1)
        .style("fill", "#ddd");

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
        .attr("d", link => {
          let x0 = scaleX(-1);
          let xm = scaleX(0);
          let x1 = scaleX(1);
          let y0 = scaleY(link[0]);
          let y1 = scaleY(link[1]);
          return `M ${x0} ${y0} C ${xm} ${y0} ${xm} ${y1} ${x1} ${y1}`;
        })
    });
});
