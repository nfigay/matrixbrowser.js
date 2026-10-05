import { describe, expect, it } from 'vitest';
import { MatrixBrowser } from '../src/core/MatrixBrowser.js';

describe('MatrixBrowser', () => {
  it('passes opaque row and column scopes to the resolver', () => {
    const matrix = new MatrixBrowser({
      model: { marker: 42 },
      rows: {
        hierarchy: [
          { id: 'r', label: 'Row', scope: { kind: 'row-scope' } }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'c', label: 'Column', scope: { kind: 'column-scope' } }
        ]
      },
      resolveCell({ model, row, column }) {
        return [model.marker, row.scope.kind, column.scope.kind];
      }
    });

    const row = matrix.getVisibleRows()[0];
    const column = matrix.getVisibleColumns()[0];

    expect(matrix.getCell(row, column).value).toEqual([
      42, 'row-scope', 'column-scope'
    ]);
  });

  it('keeps row and column collapse state independent', () => {
    const hierarchy = [
      {
        id: 'group',
        children: [{ id: 'child' }]
      }
    ];

    const matrix = new MatrixBrowser({
      model: {},
      rows: { hierarchy },
      columns: { hierarchy },
      resolveCell: () => null
    });

    const rowGroup = matrix
      .getVisibleRows()
      .find(entry => entry.id === 'group');

    matrix.rows.collapse(rowGroup.entryId);

    expect(matrix.getVisibleRows()).toHaveLength(1);
    expect(matrix.getVisibleColumns()).toHaveLength(2);
  });
});
