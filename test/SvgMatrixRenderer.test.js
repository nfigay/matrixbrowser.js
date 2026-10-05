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

});
