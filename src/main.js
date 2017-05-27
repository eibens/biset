d3.csv("data.csv", csv => {
  let biset = new Biset(d3.select("svg"), csv);
  biset.draw();

  d3.select("#sort-mode-input").on("input", function () {
    biset.sortMode = this.value;
    biset.draw();
  });
});
