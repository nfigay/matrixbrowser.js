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

  it('resolves cells from projected row and column occurrences', () => {
    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          {
            id: 'shared',
            scope: { occurrence: 'row' }
          }
        ]
      },
      columns: {
        hierarchy: [
          {
            id: 'shared',
            scope: { occurrence: 'column' }
          }
        ]
      },
      resolveCell({ row, column }) {
        return {
          rowEntryId: row.entryId,
          columnEntryId: column.entryId,
          rowScope: row.scope,
          columnScope: column.scope
        };
      }
    });

    const row = matrix.getVisibleRows()[0];
    const column = matrix.getVisibleColumns()[0];

    const cell = matrix.getCell(row, column);

    expect(cell.row).toBe(row);
    expect(cell.column).toBe(column);

    expect(cell.value).toEqual({
      rowEntryId: row.entryId,
      columnEntryId: column.entryId,
      rowScope: row.scope,
      columnScope: column.scope
    });
  });

  it('preserves an asynchronous resolver value without forcing getCell to be async', async () => {
    const expected = {
      count: 7,
      label: 'async value'
    };

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          { id: 'r', label: 'Row', scope: {} }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'c', label: 'Column', scope: {} }
        ]
      },
      resolveCell: () => Promise.resolve(expected)
    });

    const row = matrix.getVisibleRows()[0];
    const column = matrix.getVisibleColumns()[0];

    const cell = matrix.getCell(row, column);

    expect(cell.row).toBe(row);
    expect(cell.column).toBe(column);
    expect(cell.value).toBeInstanceOf(Promise);
    expect(await cell.value).toBe(expected);
  });

});
