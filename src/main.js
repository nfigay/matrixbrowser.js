import { MatrixBrowser } from './core/MatrixBrowser.js';
import { SvgMatrixRenderer } from './render/SvgMatrixRenderer.js';
import { model } from '../examples/basic/model.js';
import {
  rowHierarchy as basicRows,
  columnHierarchy as basicColumns
} from '../examples/basic/hierarchies.js';

import {
  rowHierarchy as occurrenceRows,
  columnHierarchy as occurrenceColumns
} from '../examples/occurrences/hierarchies.js';
import { resolveCell } from '../examples/basic/resolver.js';
import './style.css';

const occurrenceDemo =
  new URLSearchParams(window.location.search).has('occurrences');

const rowHierarchy = occurrenceDemo
  ? occurrenceRows
  : basicRows;

const columnHierarchy = occurrenceDemo
  ? occurrenceColumns
  : basicColumns;

const matrix = new MatrixBrowser({
  model,
  rows: { hierarchy: rowHierarchy },
  columns: { hierarchy: columnHierarchy },
  resolveCell
});

const renderer = new SvgMatrixRenderer({
  matrix,
  element: document.querySelector('#matrix-browser')
});

renderer.render();
