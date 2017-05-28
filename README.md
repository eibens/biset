# BiSet Visualization Demo

This is an implementation of BiSet using [D3.js](https://d3js.org/). BiSet visualization was proposed by Sun et al. and aids in the discovery of coordinated relationships in nominal, relational data.<sup>[1](#paper)</sup>

<a name="paper">1</a>: Sun, Maoyuan, et al. "Biset: Semantic edge bundling with biclusters for sensemaking." *IEEE transactions on visualization and computer graphics* 22.1 (2016): 310-319.

## Running the Demo

1. Install [node.js](https://nodejs.org/en/) on your system.
2. Clone this repository.
3. Run `npm install` in the repository root.
4. Run `npm start` in the repository root.

NOTE: Your browser must be [ES2016 compatible](http://kangax.github.io/compat-table/es2016plus/).

## Features

- Visualize custom CSV files with two or more columns.
- Entities have an indicator encoding their frequency in the data.
- Mouse-over an entity or bundle highlights adjacent edges.
- Bundle width encodes the size and matches entity frequency indicators.
- Bundles have an indicator encoding the size of the source set.
- Entities and bundles can be selected.
- Entitiy and bundle colors encode the number of selected neighbors.
- Edge colors encode the average relevancy of their source and target.
- Entities can be sorted by frequency, label, or priority (bundle size).
- Modes for displaying edges only, bundles only, or a combination of both.
- Options for filtering bundles based on their size.
