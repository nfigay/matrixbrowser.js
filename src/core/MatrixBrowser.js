import { AxisProjection } from './AxisProjection.js';

export class MatrixBrowser {
  constructor({ model, rows, columns, resolveCell }) {
    if (typeof resolveCell !== "function") {
      throw new TypeError("resolveCell must be a function");
    }

    this.model = model;
    this.rows = new AxisProjection(rows);
    this.columns = new AxisProjection(columns);
    this.resolveCell = resolveCell;
  }

  getVisibleRows() {
    return this.rows.getVisibleEntries();
  }

  getVisibleColumns() {
    return this.columns.getVisibleEntries();
  }

  getCell(row, column) {
    return {
      row,
      column,
      value: this.resolveCell({
        model: this.model,
        row,
        column
      })
    };
  }
}
