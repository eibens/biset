let svg = d3
  .select("svg")
  .call(d3
    .zoom()
    .scaleExtent([1, 10])
    .on("zoom", handleZoom)
  );

let surface = svg
  .append("g");

let circles = surface
  .selectAll("circle")
  .data([{x: 50, y: 50}])
  .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 20)
    .style("fill", 'red');

function handleZoom() {
  let x = d3.event.transform.x;
  let y = d3.event.transform.y;
  let k = d3.event.transform.k;
  surface.attr("transform", `translate(${x}, ${y}) scale(${k})`);
}
