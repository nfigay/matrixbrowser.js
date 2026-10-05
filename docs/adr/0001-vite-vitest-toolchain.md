# ADR-0001 — Vite/Vitest development and distribution toolchain

**Status:** Accepted
**Architecture baseline:** `MBJS-ARCH-0.1`

## Context

MatrixBrowser-JS is developed using native ES modules (`import` / `export`).

The toolchain must support:

- fast web development with Vite dev server and HMR;
- automated tests with Vitest;
- a normal Vite build suitable for GitHub Pages;
- a standalone HTML build usable directly through `file://` without an HTTP server.

The existing `Semantic-Process-Mediator` project provides the reference pattern.

## Decision

### Development

Vite is the preferred development environment:

    vite

Development uses normal ES modules and Vite HMR.
Standalone packaging must not constrain the source architecture.

### Tests

Vitest is the preferred test runner whenever appropriate:

    vitest
    vitest run

npm scripts may expose these commands, but Vitest is the testing technology.
The MatrixBrowser core must be testable independently of the Vite dev server.

### GitHub Pages

GitHub Pages uses a normal Vite production build with an appropriate `base`.
Generated JavaScript and CSS assets may remain separate.

### Standalone HTML

A separate Vite build produces an HTML application usable directly through `file://`.

The initial implementation follows the proven `Semantic-Process-Mediator` pattern:

- `base: "./"`;
- `vite-plugin-singlefile`;
- CSS included in the standalone artifact;
- runtime assets embedded when required;
- no HTTP server required at runtime.

Standalone-specific transformations belong to build configuration and must not
leak into MatrixBrowser core code.

### Preview

Production builds may also be inspected with:

    vite preview

This does not replace explicit verification of standalone `file://` operation.

## Consequences

- MatrixBrowser source remains ordinary ES-module code.
- Vite is development/build infrastructure, not a core runtime dependency.
- Vitest is the preferred automated testing environment.
- The same source tree can produce hosted and standalone applications.
- The core remains independent from Vite, Vitest, D3, SVG and the DOM.

## Reference implementation

Reference project:

    ~/git/Semantic-Process-Mediator

MatrixBrowser-JS reuses the general toolchain pattern, not application-specific
SemArch concepts such as editor/viewer modes, presentations or SVG processing.

## Non-decisions

This ADR does not yet fix:

- exact Vite/Vitest/plugin versions;
- final package.json scripts;
- final build-mode names;
- GitHub repository name;
- GitHub Pages deployment path;
- CI/CD workflow.
