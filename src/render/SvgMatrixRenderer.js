const SVG_NS = "http://www.w3.org/2000/svg";

const svgElement = (name, attributes = {}) => {
  const element = document.createElementNS(SVG_NS, name);

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }

  return element;
};

export class SvgMatrixRenderer {
  constructor({ matrix, element }) {
    this.matrix = matrix;
    this.element = element;
  }

  render() {
    const rows = this.matrix.getVisibleRows();
    const columns = this.matrix.getVisibleColumns();

    const rowHeaderWidth = 220;
    const columnWidth = 105;
    const headerHeight = 150;
    const rowHeight = 38;

    const width = rowHeaderWidth + columns.length * columnWidth;
    const height = headerHeight + rows.length * rowHeight;

    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      width: "100%",
      height
    });

    svg.classList.add("matrix");

    columns.forEach((column, columnIndex) => {
      const x = rowHeaderWidth + columnIndex * columnWidth;

      const group = svgElement("g", {
        transform: `translate(${x}, 0)`
      });

      const text = svgElement("text", {
        x: 12 + column.depth * 12,
        y: headerHeight - 12,
        transform: `rotate(-55 ${12 + column.depth * 12} ${headerHeight - 12})`,
        class: column.leaf ? "axis-label" : "axis-label branch"
      });

      text.textContent = `${column.leaf ? "·" : column.expanded ? "▾" : "▸"} ${column.label}`;

      if (!column.leaf) {
        text.addEventListener("click", () => {
          this.matrix.columns.toggle(column.entryId);
          this.render();
        });
      }

      group.append(text);
      svg.append(group);
    });

    rows.forEach((row, rowIndex) => {
      const y = headerHeight + rowIndex * rowHeight;

      const rowLabel = svgElement("text", {
        x: 12 + row.depth * 18,
        y: y + 25,
        class: row.leaf ? "axis-label" : "axis-label branch"
      });

      rowLabel.textContent = `${row.leaf ? "·" : row.expanded ? "▾" : "▸"} ${row.label}`;

      if (!row.leaf) {
        rowLabel.addEventListener("click", () => {
          this.matrix.rows.toggle(row.entryId);
          this.render();
        });
      }

      svg.append(rowLabel);

      columns.forEach((column, columnIndex) => {
        const x = rowHeaderWidth + columnIndex * columnWidth;
        const cell = this.matrix.getCell(row, column);

        const rect = svgElement("rect", {
          x: x + 1,
          y: y + 1,
          width: columnWidth - 2,
          height: rowHeight - 2,
          class: "cell"
        });

        const value = svgElement("text", {
          x: x + columnWidth / 2,
          y: y + 25,
          "text-anchor": "middle",
          class: "cell-value"
        });

        value.textContent = String(cell.value);

        svg.append(rect, value);
      });
    });

    this.element.replaceChildren(svg);
  }
}
