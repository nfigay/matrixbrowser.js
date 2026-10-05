export function resolveCell({ model, row, column }) {
  let total = 0;

  for (const rowId of row.scope?.ids ?? []) {
    for (const columnId of column.scope?.ids ?? []) {
      total += model.values.get(`${rowId}:${columnId}`) ?? 0;
    }
  }

  return total;
}
