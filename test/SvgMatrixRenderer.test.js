// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { MatrixBrowser } from '../src/core/MatrixBrowser.js';
import { SvgMatrixRenderer } from '../src/render/SvgMatrixRenderer.js';
import { model } from '../examples/basic/model.js';
import {
  rowHierarchy,
  columnHierarchy
} from '../examples/basic/hierarchies.js';
import { resolveCell } from '../examples/basic/resolver.js';

function createUI() {
  document.body.innerHTML = '<div id="matrix"></div>';

  const matrix = new MatrixBrowser({
    model,
    rows: { hierarchy: rowHierarchy },
    columns: { hierarchy: columnHierarchy },
    resolveCell
  });

  const renderer = new SvgMatrixRenderer({
    matrix,
    element: document.querySelector('#matrix')
  });

  renderer.render();

  return { matrix, renderer };
}

function labels() {
  return [...document.querySelectorAll('.axis-label')]
    .map(element => element.textContent.trim());
}

function values() {
  return [...document.querySelectorAll('.cell-value')]
    .map(element => element.textContent.trim());
}

function branch(name) {
  return [...document.querySelectorAll('.axis-label.branch')]
    .find(element => element.textContent.includes(name));
}

function clickBranch(name) {
  const element = branch(name);

  if (!element) {
    throw new Error('Branch not found: ' + name);
  }

  element.dispatchEvent(
    new MouseEvent('click', { bubbles: true })
  );
}

describe('SvgMatrixRenderer interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the initial hierarchical matrix', () => {
    createUI();

    for (const expected of [
      'Business',
      'Order',
      'Invoice',
      'Technology',
      'Server',
      'Applications',
      'CRM',
      'ERP'
    ]) {
      expect(
        labels().some(label => label.includes(expected))
      ).toBe(true);
    }

    expect(values()[0]).toBe('10');
  });

  it('collapses rows without changing columns', () => {
    createUI();

    clickBranch('Business');

    expect(labels().some(x => x.includes('Order'))).toBe(false);
    expect(labels().some(x => x.includes('Invoice'))).toBe(false);

    expect(labels().some(x => x.includes('CRM'))).toBe(true);
    expect(labels().some(x => x.includes('ERP'))).toBe(true);
  });

  it('collapses columns without changing rows', () => {
    createUI();

    clickBranch('Applications');

    expect(labels().some(x => x.includes('CRM'))).toBe(false);
    expect(labels().some(x => x.includes('ERP'))).toBe(false);

    expect(labels().some(x => x.includes('Order'))).toBe(true);
    expect(labels().some(x => x.includes('Server'))).toBe(true);
  });

  it('preserves independent collapse state across rerenders', () => {
    createUI();

    clickBranch('Business');
    clickBranch('Applications');
    clickBranch('Business');

    expect(labels().some(x => x.includes('Order'))).toBe(true);
    expect(labels().some(x => x.includes('CRM'))).toBe(false);

    // Business x collapsed Applications
    expect(values()[0]).toBe('10');

    clickBranch('Applications');

    expect(labels().some(x => x.includes('CRM'))).toBe(true);
  });

  it('collapses one nested occurrence without collapsing another', () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    const sharedRows = [
      {
        id: 'left',
        label: 'Left',
        scope: {},
        children: [
          {
            id: 'shared',
            label: 'Shared',
            scope: {},
            children: [
              {
                id: 'left-child',
                label: 'Left child',
                scope: {}
              }
            ]
          }
        ]
      },
      {
        id: 'right',
        label: 'Right',
        scope: {},
        children: [
          {
            id: 'shared',
            label: 'Shared',
            scope: {},
            children: [
              {
                id: 'right-child',
                label: 'Right child',
                scope: {}
              }
            ]
          }
        ]
      }
    ];

    const matrix = new MatrixBrowser({
      model: {},
      rows: { hierarchy: sharedRows },
      columns: {
        hierarchy: [
          {
            id: 'column',
            label: 'Column',
            scope: {}
          }
        ]
      },
      resolveCell: () => ''
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix')
    });

    renderer.render();

    const sharedBranches =
      [...document.querySelectorAll('.axis-label.branch')]
        .filter(element =>
          element.textContent.includes('Shared')
        );

    expect(sharedBranches).toHaveLength(2);

    sharedBranches[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );

    const after = labels();

    expect(
      after.some(label => label.includes('Left child'))
    ).toBe(false);

    expect(
      after.some(label => label.includes('Right child'))
    ).toBe(true);
  });


  it('renders arbitrary cell values through an injected cell renderer', () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    const objectValue = {
      count: 3,
      status: 'warning',
      label: '3 relations'
    };

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          {
            id: 'row',
            label: 'Row',
            scope: {}
          }
        ]
      },
      columns: {
        hierarchy: [
          {
            id: 'column',
            label: 'Column',
            scope: {}
          }
        ]
      },
      resolveCell: () => objectValue
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix'),
      renderCell: ({ cell, x, y, width, height, createElement }) => {
        expect(cell.value).toBe(objectValue);
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);

        const marker = createElement('circle', {
          cx: x + 14,
          cy: y + height / 2,
          r: 4,
          class: 'custom-cell-marker',
          'data-status': cell.value.status
        });

        const text = createElement('text', {
          x: x + 24,
          y: y + height / 2,
          class: 'custom-cell-value'
        });

        text.textContent = cell.value.label;

        return [marker, text];
      }
    });

    renderer.render();

    const rendered =
      document.querySelector('.custom-cell-value');

    expect(rendered).not.toBeNull();
    expect(rendered.textContent).toBe('3 relations');

    const marker =
      document.querySelector('.custom-cell-marker');

    expect(marker).not.toBeNull();
    expect(marker.getAttribute('data-status')).toBe('warning');

    expect(
      document.querySelector('.cell-value')
    ).toBeNull();
  });


  it('renders pending state and then an asynchronously resolved cell value', async () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    let resolveValue;

    const pendingValue = new Promise(resolve => {
      resolveValue = resolve;
    });

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          { id: 'row', label: 'Row', scope: {} }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'column', label: 'Column', scope: {} }
        ]
      },
      resolveCell: () => pendingValue
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix')
    });

    renderer.render();

    const pending =
      document.querySelector('.cell-pending');

    expect(pending).not.toBeNull();

    resolveValue('resolved value');

    await pendingValue;
    await Promise.resolve();

    const value =
      document.querySelector('.cell-value');

    expect(value).not.toBeNull();
    expect(value.textContent).toBe('resolved value');

    expect(
      document.querySelector('.cell-pending')
    ).toBeNull();
  });


  it('ignores an asynchronous result from a stale render', async () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    let resolveA;
    let resolveB;
    let call = 0;

    const promiseA = new Promise(resolve => {
      resolveA = resolve;
    });

    const promiseB = new Promise(resolve => {
      resolveB = resolve;
    });

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          { id: 'row', label: 'Row', scope: {} }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'column', label: 'Column', scope: {} }
        ]
      },
      resolveCell: () => {
        call += 1;
        return call === 1 ? promiseA : promiseB;
      }
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix')
    });

    // Render #1 owns Promise A.
    renderer.render();

    const firstPending =
      document.querySelector('.cell-pending');

    expect(firstPending).not.toBeNull();

    // Render #2 replaces the complete SVG and owns Promise B.
    renderer.render();

    const secondPending =
      document.querySelector('.cell-pending');

    expect(secondPending).not.toBeNull();
    expect(secondPending).not.toBe(firstPending);
    expect(firstPending.isConnected).toBe(false);

    // New render resolves first.
    resolveB('new value');
    await promiseB;
    await Promise.resolve();

    expect(
      document.querySelector('.cell-value')?.textContent
    ).toBe('new value');

    // Old render resolves afterwards and must be ignored.
    resolveA('stale value');
    await promiseA;
    await Promise.resolve();

    expect(
      document.querySelector('.cell-value')?.textContent
    ).toBe('new value');

    expect(
      document.body.textContent.includes('stale value')
    ).toBe(false);
  });


  it('renders an error state when asynchronous cell resolution fails', async () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    let rejectValue;

    const pendingValue = new Promise((resolve, reject) => {
      rejectValue = reject;
    });

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          { id: 'row', label: 'Row', scope: {} }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'column', label: 'Column', scope: {} }
        ]
      },
      resolveCell: () => pendingValue
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix')
    });

    renderer.render();

    expect(
      document.querySelector('.cell-pending')
    ).not.toBeNull();

    rejectValue(new Error('resolution failed'));

    try {
      await pendingValue;
    } catch {
      // Expected rejection.
    }

    await Promise.resolve();

    const error =
      document.querySelector('.cell-error');

    expect(error).not.toBeNull();
    expect(error.textContent).toBe('!');
    expect(error.getAttribute('data-error'))
      .toBe('resolution failed');

    expect(
      document.querySelector('.cell-pending')
    ).toBeNull();
  });


  it('ignores an asynchronous error from a stale render', async () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    let rejectA;
    let resolveB;
    let call = 0;

    const promiseA = new Promise((resolve, reject) => {
      rejectA = reject;
    });

    const promiseB = new Promise(resolve => {
      resolveB = resolve;
    });

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          { id: 'row', label: 'Row', scope: {} }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'column', label: 'Column', scope: {} }
        ]
      },
      resolveCell: () => {
        call += 1;
        return call === 1 ? promiseA : promiseB;
      }
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix')
    });

    // Render #1 owns Promise A.
    renderer.render();

    const firstPending =
      document.querySelector('.cell-pending');

    expect(firstPending).not.toBeNull();

    // Render #2 replaces it and owns Promise B.
    renderer.render();

    expect(firstPending.isConnected).toBe(false);

    resolveB('current value');
    await promiseB;
    await Promise.resolve();

    expect(
      document.querySelector('.cell-value')?.textContent
    ).toBe('current value');

    // The stale rejection must be consumed but ignored visually.
    rejectA(new Error('stale failure'));

    try {
      await promiseA;
    } catch {
      // Expected rejection.
    }

    await Promise.resolve();

    expect(
      document.querySelector('.cell-value')?.textContent
    ).toBe('current value');

    expect(
      document.querySelector('.cell-error')
    ).toBeNull();

    expect(
      document.body.textContent.includes('stale failure')
    ).toBe(false);
  });

  it('renders pending state through an injected pending cell renderer', async () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    let resolveValue;

    const pendingValue = new Promise(resolve => {
      resolveValue = resolve;
    });

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          { id: 'row', label: 'Row', scope: {} }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'column', label: 'Column', scope: {} }
        ]
      },
      resolveCell: () => pendingValue
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix'),
      renderPendingCell: ({ cell, x, y, width, height, createElement }) => {
        expect(cell.value).toBe(pendingValue);
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);

        const pending = createElement('text', {
          x: x + width / 2,
          y: y + height / 2,
          class: 'custom-cell-pending'
        });

        pending.textContent = 'loading';

        return pending;
      }
    });

    renderer.render();

    const pending =
      document.querySelector('.custom-cell-pending');

    expect(pending).not.toBeNull();
    expect(pending.textContent).toBe('loading');

    expect(
      document.querySelector('.cell-pending')
    ).toBeNull();

    resolveValue('resolved value');

    await pendingValue;
    await Promise.resolve();

    expect(
      document.querySelector('.custom-cell-pending')
    ).toBeNull();

    expect(
      document.querySelector('.cell-value')?.textContent
    ).toBe('resolved value');
  });

  it('renders error state through an injected error cell renderer', async () => {
    document.body.innerHTML = '<div id="matrix"></div>';

    let rejectValue;

    const failure = new Error('custom failure');

    const pendingValue = new Promise((resolve, reject) => {
      rejectValue = reject;
    });

    const matrix = new MatrixBrowser({
      model: {},
      rows: {
        hierarchy: [
          { id: 'row', label: 'Row', scope: {} }
        ]
      },
      columns: {
        hierarchy: [
          { id: 'column', label: 'Column', scope: {} }
        ]
      },
      resolveCell: () => pendingValue
    });

    const renderer = new SvgMatrixRenderer({
      matrix,
      element: document.querySelector('#matrix'),
      renderErrorCell: ({
        cell,
        error,
        x,
        y,
        width,
        height,
        createElement
      }) => {
        expect(cell.value).toBe(pendingValue);
        expect(error).toBe(failure);
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);

        const errorElement = createElement('text', {
          x: x + width / 2,
          y: y + height / 2,
          class: 'custom-cell-error'
        });

        errorElement.textContent = error.message;

        return errorElement;
      }
    });

    renderer.render();

    expect(
      document.querySelector('.cell-pending')
    ).not.toBeNull();

    rejectValue(failure);

    try {
      await pendingValue;
    } catch {
      // Expected rejection.
    }

    await Promise.resolve();

    const error =
      document.querySelector('.custom-cell-error');

    expect(error).not.toBeNull();
    expect(error.textContent).toBe('custom failure');

    expect(
      document.querySelector('.cell-pending')
    ).toBeNull();

    expect(
      document.querySelector('.cell-error')
    ).toBeNull();
  });

});
