import { MatrixBrowser } from './core/MatrixBrowser.js';
import { SvgMatrixRenderer } from './render/SvgMatrixRenderer.js';
import { model } from '../examples/basic/model.js';
import { rowHierarchy, columnHierarchy } from '../examples/basic/hierarchies.js';
import { resolveCell } from '../examples/basic/resolver.js';
import './style.css';

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
