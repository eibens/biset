let svg = d3.select("svg");
let biset = new Biset(svg);

d3.csv("data.csv", csv => {
  biset.data = csv;
  biset.draw();
});

d3.select("#sort-mode-input").on("input", function () {
  biset.sortMode = this.value;
  biset.draw();
});

d3.select("#file-input").on("change", function () {
  if (!this.files || !this.files[0]) return;
  let file = this.files[0];
  let reader = new FileReader();

  let options = d3.select(".options");
  d3.select("body").classed("disabled", true);

  // Artificial delay so it looks like the program is working very hard.
  reader.onload = () => {
    setTimeout(() => {
      biset.data = d3.csvParse(reader.result);
      biset.draw();
      d3.select("body").classed("disabled", false);
    }, 500);
  };
  reader.readAsText(file);
});
