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
    axis.collapse('business');

    expect(axis.getVisibleEntries().map(entry => entry.id)).toEqual([
      'business', 'technology', 'server'
    ]);
  });

  it('can expand a collapsed occurrence again', () => {
    const axis = new AxisProjection({ hierarchy });
    axis.collapse('business');
    axis.expand('business');

    expect(axis.getVisibleEntries()).toHaveLength(5);
  });
});
