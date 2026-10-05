# ADR-0002 — Opaque hierarchy scopes and cell resolution

**Status:** Accepted
**Architecture baseline:** `MBJS-ARCH-0.1`

## Context

A hierarchy entry represents a classification or projection of model content.
It must not be restricted to a materialized set of model members.

Depending on the application, an entry may represent:

- a model element;
- a set of elements;
- a classification criterion;
- a query;
- a predicate;
- an ownership domain;
- a computed projection;
- any application-defined selection context.

Requiring the MatrixBrowser core to implement `members()` would introduce
assumptions about the structure and query semantics of the model.

## Decision

Hierarchy entries expose an opaque `scope`.

Conceptually:

    {
      id,
      label,
      children,
      scope
    }

`scope` has no mandatory structure imposed by MatrixBrowser core.

An axis projection produces visible axis entries while preserving the scope
associated with each hierarchy occurrence.

The cell resolver receives the row and column contexts:

    resolveCell({
      model,
      row,
      column,
      signal
    })

The resolver interprets `row.scope` and `column.scope` according to the
application model.

The core does not intersect sets, traverse graphs, interpret relations, or
execute selectors unless such behavior is supplied by an extension.

## Consequences

- MatrixBrowser remains independent from graph and domain semantics.
- A hierarchy need not materialize its represented model elements.
- Resolvers may perform synchronous or asynchronous queries.
- Applications may use arbitrary selector/query representations.
- Convenience adapters may later provide `members(scope)` or `select(scope)`.
- Such adapters remain optional and are not part of the fundamental contract.

## Axis occurrence identity

A semantic hierarchy item may occur more than once in a taxonomy.

Expansion state therefore belongs to an axis occurrence/projection entry,
not necessarily to the semantic `id` carried by the hierarchy item.

The first implementation may use simple unique IDs for the prototype, but
the core API must not assume that semantic item identity and occurrence
identity are permanently equivalent.

## First implementation constraint

This ADR should be validated rapidly through a vertical UI prototype:

1. two small hierarchical axes;
2. independent row and column collapse/expand;
3. visible-axis projection;
4. cell resolution from row and column scopes;
5. SVG rendering;
6. interactive execution through the Vite development server.

The prototype is architectural validation, not a commitment to the final
visual design.

## Non-decisions

This ADR does not yet define:

- a selector language;
- a mandatory ModelAdapter;
- caching or invalidation;
- taxonomy/DAG traversal semantics;
- persistent occurrence IDs;
- renderer plugin registration.
