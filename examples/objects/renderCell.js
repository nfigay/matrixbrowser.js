export function renderObjectCell({
  cell,
  x,
  y,
  height,
  createElement
}) {
  const marker = createElement('circle', {
    cx: x + 18,
    cy: y + height / 2,
    r: 5,
    class: 'object-cell-marker',
    'data-status': cell.value.status
  });

  const text = createElement('text', {
    x: x + 30,
    y: y + 25,
    class: 'object-cell-value',
    'data-count': cell.value.count
  });

  text.textContent = cell.value.label;

  return [marker, text];
}
