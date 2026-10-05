import { describe, expect, it } from 'vitest';
import { AxisProjection } from '../src/core/AxisProjection.js';

const hierarchy = [
  {
    id: 'business',
    label: 'Business',
    children: [
      { id: 'order', label: 'Order' },
      { id: 'invoice', label: 'Invoice' }
    ]
  },
  {
    id: 'technology',
    label: 'Technology',
    children: [
      { id: 'server', label: 'Server' }
    ]
  }
];

describe('AxisProjection', () => {
  it('projects expanded hierarchy in preorder', () => {
    const axis = new AxisProjection({ hierarchy });

    expect(axis.getVisibleEntries().map(entry => entry.id)).toEqual([
      'business', 'order', 'invoice', 'technology', 'server'
    ]);
  });

  it('hides descendants when an occurrence is collapsed', () => {
    const axis = new AxisProjection({ hierarchy });

    const business = axis
      .getVisibleEntries()
      .find(entry => entry.id === 'business');

    axis.collapse(business.entryId);

    expect(axis.getVisibleEntries().map(entry => entry.id)).toEqual([
      'business', 'technology', 'server'
    ]);
  });

  it('can expand a collapsed occurrence again', () => {
    const axis = new AxisProjection({ hierarchy });

    const business = axis
      .getVisibleEntries()
      .find(entry => entry.id === 'business');

    axis.collapse(business.entryId);
    axis.expand(business.entryId);

    expect(axis.getVisibleEntries()).toHaveLength(5);
  });

  it('preserves opaque scope identity in projected entries', () => {
    const scope = {
      query: () => 'application-defined'
    };

    const axis = new AxisProjection({
      hierarchy: [
        {
          id: 'opaque',
          label: 'Opaque',
          scope
        }
      ]
    });

    const [entry] = axis.getVisibleEntries();

    expect(entry.scope).toBe(scope);
    expect(entry.item.scope).toBe(scope);
  });

  it('distinguishes occurrences of the same semantic item', () => {
    const shared = {
      id: 'shared',
      label: 'Shared'
    };

    const taxonomy = [
      {
        id: 'left',
        label: 'Left',
        children: [
          {
            ...shared,
            children: [
              { id: 'left-child', label: 'Left child' }
            ]
          }
        ]
      },
      {
        id: 'right',
        label: 'Right',
        children: [
          {
            ...shared,
            children: [
              { id: 'right-child', label: 'Right child' }
            ]
          }
        ]
      }
    ];

    const axis = new AxisProjection({
      hierarchy: taxonomy
    });

    const occurrences = axis
      .getVisibleEntries()
      .filter(entry => entry.id === 'shared');

    expect(occurrences).toHaveLength(2);

    expect(occurrences[0].entryId)
      .not.toBe(occurrences[1].entryId);

    axis.collapse(occurrences[0].entryId);

    const visible = axis.getVisibleEntries();

    expect(
      visible.some(entry => entry.id === 'left-child')
    ).toBe(false);

    expect(
      visible.some(entry => entry.id === 'right-child')
    ).toBe(true);
  });

});
