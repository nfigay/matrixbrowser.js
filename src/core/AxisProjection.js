export class AxisProjection {
  constructor({ hierarchy }) {
    this.hierarchy = hierarchy;
    this.collapsed = new Set();
  }

  collapse(id) {
    this.collapsed.add(id);
  }

  expand(id) {
    this.collapsed.delete(id);
  }

  toggle(id) {
    if (this.collapsed.has(id)) {
      this.expand(id);
    } else {
      this.collapse(id);
    }
  }

  isCollapsed(id) {
    return this.collapsed.has(id);
  }

  getVisibleEntries() {
    const visible = [];

    const visit = (item, depth = 0, parent = null) => {
      const children = item.children ?? [];
      const collapsed = this.isCollapsed(item.id);

      const entry = {
        id: item.id,
        item,
        label: item.label ?? item.id,
        scope: item.scope,
        depth,
        parent,
        leaf: children.length === 0,
        expanded: children.length > 0 && !collapsed
      };

      visible.push(entry);

      if (!collapsed) {
        for (const child of children) {
          visit(child, depth + 1, entry);
        }
      }
    };

    for (const root of this.hierarchy) {
      visit(root);
    }

    return visible;
  }
}
