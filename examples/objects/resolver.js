export function resolveObjectCell({ model, row, column }) {
  let count = 0;

  for (const rowId of row.scope?.ids ?? []) {
    for (const columnId of column.scope?.ids ?? []) {
      count += model.values.get(`${rowId}:${columnId}`) ?? 0;
    }
  }

  return {
    count,
    status: count >= 5 ? 'high' : count > 0 ? 'normal' : 'empty',
    label: `${count} rel.`
  };
}
