export class AxisProjection {
  constructor({ hierarchy }) {
    this.hierarchy = hierarchy;
    this.collapsed = new Set();
  }

  collapse(entryId) {
    this.collapsed.add(entryId);
  }

  expand(entryId) {
    this.collapsed.delete(entryId);
  }

  toggle(entryId) {
    if (this.collapsed.has(entryId)) {
      this.expand(entryId);
    } else {
      this.collapse(entryId);
    }
  }

  isCollapsed(entryId) {
    return this.collapsed.has(entryId);
  }

  collapseAll() {
    const visit = (item, entryId) => {
      const children = item.children ?? [];

      if (children.length > 0) {
        this.collapsed.add(entryId);
      }

      children.forEach((child, index) => {
        visit(child, entryId + '/' + index);
      });
    };

    this.hierarchy.forEach((root, index) => {
      visit(root, String(index));
    });
  }

  getVisibleEntries() {
    const visible = [];

    const visit = (
      item,
      entryId,
      depth = 0,
      parent = null
    ) => {
      const children = item.children ?? [];

      const collapsed = this.isCollapsed(entryId);

      const entry = {
        entryId,
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
        children.forEach((child, index) => {
          visit(
            child,
            entryId + '/' + index,
            depth + 1,
            entry
          );
        });
      }
    };

    this.hierarchy.forEach((root, index) => {
      visit(root, String(index));
    });

    return visible;
  }
}
