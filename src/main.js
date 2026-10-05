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
import { resolveObjectCell } from '../examples/objects/resolver.js';
import { renderObjectCell } from '../examples/objects/renderCell.js';
import { resolveAsyncCell } from '../examples/async/resolver.js';
import './style.css';

const params = new URLSearchParams(window.location.search);

const occurrenceDemo = params.has('occurrences');
const objectDemo = params.has('objects');
const asyncDemo = params.has('async');

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
  resolveCell: asyncDemo
    ? resolveAsyncCell
    : objectDemo
      ? resolveObjectCell
      : resolveCell
});

const renderer = new SvgMatrixRenderer({
  matrix,
  element: document.querySelector('#matrix-browser'),
  renderCell: objectDemo ? renderObjectCell : null
});

renderer.render();

document.querySelector('#collapse-rows').addEventListener('click', () => {
  matrix.rows.collapseAll();
  renderer.render();
});

document.querySelector('#expand-rows').addEventListener('click', () => {
  matrix.rows.expandAll();
  renderer.render();
});

document.querySelector('#collapse-columns').addEventListener('click', () => {
  matrix.columns.collapseAll();
  renderer.render();
});

document.querySelector('#expand-columns').addEventListener('click', () => {
  matrix.columns.expandAll();
  renderer.render();
});
