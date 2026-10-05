import { resolveCell } from '../basic/resolver.js';

export function resolveAsyncCell(context) {
  const { row, column } = context;

  const shouldFail =
    row.scope?.ids?.length === 1 &&
    row.scope.ids[0] === 'server' &&
    column.scope?.ids?.length === 1 &&
    column.scope.ids[0] === 'erp';

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Demo resolution failure'));
        return;
      }

      resolve(resolveCell(context));
    }, 1500);
  });
}
