# BiSet Visualization Demo

This is an implementation of BiSet using [D3.js](https://d3js.org/). BiSet visualization was proposed by Sun et al. and aids in the discovery of coordinated relationships in nominal, relational data.<sup>[1](#paper)</sup>

<a name="paper">1</a>: Sun, Maoyuan, et al. "Biset: Semantic edge bundling with biclusters for sensemaking." *IEEE transactions on visualization and computer graphics* 22.1 (2016): 310-319.

## Run the Demo

1. Install [node.js](https://nodejs.org/en/) on your system.
2. Clone this repository.
3. Run `npm install` in the repository root.
4. Run `npm start` in the repository root.

NOTE: Your browser must be [ES2016 compatible](http://kangax.github.io/compat-table/es2016plus/).

## Generate the Docs

    npm run-script docs

Generated docs will be located in `out/index.html`.

## Features

- Visualize custom CSV files with two or more columns.
- Entities have an indicator encoding their frequency in the data.
- Mouse-over an entity or bundle highlights adjacent edges.
- Bundle width encodes the size of the bundle, matching entity frequency indicators.
- Bundles have an indicator encoding the size of the source set.
- Entities and bundles can be selected.
- Entity and bundle colors encode the number of selected neighbors.
- Edge colors encode the average relevancy of their source and target.
- Entities can be sorted by frequency, label, or priority (bundle size).
- Modes for displaying edges only, bundles only, or a combination of both.
- Options for filtering bundles based on their size.

## Interaction

A default data-set is shown when the visualization is loaded. Using
the browse button in the top-left corner a different CSV file can be
selected for analysis. (Warning: large tables can crash the application.)
To the right of the browse button are options for sorting the entities,
showing or hiding bundles, and filtering bundles by their size and 
number of entities on either side of the bundle (a.k.a. bundle support).
The *Clear Selection* button in the top right deselects all selected
entities and bundles.

The data can be explored by clicking on entities and bundles, which 
highlights connected elements. A darker orange color indicates a strong
relationship of an element with the current selection and provides a 
hint for further exploration.

## Important files

- `index.html` Entry point of the application. This file also defines 
the user-input widgets at the top of the application window.

- `biset.css` Styles for the SVG part of the visualization.

- `src/main.js` Handles the user-input widgets at the top of the 
application window and the instantiation of the `Biset` object.

- `src/biset.js` Defines the `Biset` class which renders the SVG part
of the visualization and provides setters for the various parameters.

- `src/bundle.js` Defines internal functions used for discovering
bundles in the data.

- `src/transform.js` Defines internal functions used for transforming
the initial CSV data into a representation that can be rendered.

- `src/data.csv` Initial data-set that is shown when the application is 
loaded.
