# MatrixBrowser-JS Architecture Baseline

**Reference:** `MBJS-ARCH-0.1`
**Status:** Baseline architecturale initiale\
**Purpose:** Conserver le contexte architectural stable de
`matrixbrowser-js` afin de pouvoir reprendre le projet dans une nouvelle
conversation, un autre environnement ou une future intégration sans
dépendre de l'historique du chat.

------------------------------------------------------------------------

## 1. Vision

`matrixbrowser-js` est un moteur générique de **croisement de deux
projections hiérarchiques d'un modèle**.

La matrice n'est pas, par nature, une matrice d'adjacence ni une matrice
de relations. Chaque cellule représente le résultat arbitraire d'un
calcul effectué dans le contexte du croisement entre une entrée visible
de l'axe des lignes et une entrée visible de l'axe des colonnes.

Le contenu d'une cellule peut notamment être :

-   un booléen ;
-   un nombre ou une mesure ;
-   une chaîne ;
-   un objet métier ;
-   une collection ;
-   un ensemble de relations ;
-   un sous-graphe ;
-   un modèle dérivé ;
-   un chemin ou plus court chemin ;
-   le résultat d'un algorithme ;
-   une valeur asynchrone ;
-   ou tout autre type défini par l'utilisateur.

Le noyau ne doit faire aucune hypothèse sur la nature de cette valeur.

La représentation matricielle est une interface permettant d'explorer et
de filtrer un modèle selon le croisement de deux hiérarchies ou
classifications.

------------------------------------------------------------------------

## 2. Origine conceptuelle

Le projet s'inspire du MatrixBrowser historique développé par Fraunhofer
IAO.

L'analyse de son code source a permis de retenir plusieurs principes :

1.  deux arbres sont utilisés, un pour l'axe vertical et un pour l'axe
    horizontal ;
2.  leurs états de dépliage/repliage sont indépendants ;
3.  l'état `expanded/collapsed` appartient à la vue de l'arbre, et non
    au nœud métier ;
4.  une cellule visible peut représenter des interactions situées dans
    les descendants d'un nœud replié ;
5.  le MatrixBrowser historique indique essentiellement l'existence
    d'une interaction cachée, sans fournir une agrégation générale de
    son contenu.

`matrixbrowser-js` reprend ces principes d'interaction, mais généralise
radicalement le calcul d'une cellule.

Il ne s'agit pas de reproduire l'implémentation Java/Swing.

------------------------------------------------------------------------

## 3. Principe architectural fondamental

Architecture conceptuelle :

``` text
                         Model
                           │
             ┌─────────────┴─────────────┐
             │                           │
      HierarchyProvider            HierarchyProvider
             │                           │
             ▼                           ▼
       AxisProjection              AxisProjection
          (rows)                    (columns)
             │                           │
       visible entries              visible entries
             │                           │
             └────────────┬──────────────┘
                          │
                          ▼
                     CellResolver
                          │
                          ▼
                       Cell<T>
                          │
                          ▼
                     CellRenderer
```

Les concepts fondamentaux du core sont donc :

-   `Model`
-   `HierarchyProvider`
-   `AxisProjection`
-   `AxisEntry`
-   `CellResolver`
-   `Cell<T>`

Le rendu constitue une couche séparée.

------------------------------------------------------------------------

## 4. Le modèle est opaque

Le core de MatrixBrowser ne prescrit aucun format de modèle.

``` js
const browser = new MatrixBrowser({
  model: myModel
});
```

`myModel` peut être :

-   un graphe ;
-   un modèle ArchiMate ;
-   un modèle Cytoscape ;
-   un tableau ou ensemble d'objets ;
-   un modèle métier propriétaire ;
-   un modèle calculé ;
-   toute structure définie par l'application.

Le core ne doit donc pas dépendre d'attributs conventionnels tels que :

``` js
model.nodes
model.edges
```

Les connaissances spécifiques au modèle sont fournies par les
extensions, providers et resolvers.

### Décision

Le core ne définit pas de concepts obligatoires `Graph`, `Node`, `Edge`,
`Relation` ou `ArchiMateElement`.

------------------------------------------------------------------------

## 5. HierarchyProvider

Un `HierarchyProvider` décrit une projection ou classification
hiérarchique applicable au modèle.

Contrat conceptuel actuel :

``` js
{
  id,
  label,
  children,
  scope
}
```

Une entrée de hiérarchie décrit une classification ou une projection. Elle
n'est pas nécessairement un objet du modèle.

`scope` représente le contexte de sélection associé à l'entrée. Sa structure
est opaque pour le core : elle peut être un identifiant, un ensemble
d'identifiants, une requête, un prédicat, un domaine métier ou toute autre
représentation définie par l'application.

Le core ne matérialise pas obligatoirement les éléments représentés par une
entrée et n'impose pas de contrat `members()`. Des adaptateurs optionnels
peuvent fournir des opérations telles que `members(scope)` ou
`select(scope)`, mais elles ne font pas partie du contrat fondamental.

Cette distinction permet d'utiliser :

-   la hiérarchie native d'un modèle ;
-   une composition ;
-   une classification métier ;
-   une taxonomie ;
-   une classification calculée ;
-   une classification par propriétaire ;
-   une classification par criticité ;
-   une projection arbitraire.

Une classification plate est considérée comme un cas particulier de
hiérarchie.

------------------------------------------------------------------------

## 6. Les deux hiérarchies peuvent être différentes

Les lignes et colonnes peuvent partager le même `HierarchyProvider` :

``` js
rows: {
  hierarchy: architecture
},

columns: {
  hierarchy: architecture
}
```

mais elles peuvent également utiliser deux classifications différentes :

``` js
rows: {
  hierarchy: architectureByLayer
},

columns: {
  hierarchy: architectureByOwner
}
```

Ainsi, MatrixBrowser ne suppose pas une matrice carrée ni une
classification identique sur les deux axes.

------------------------------------------------------------------------

## 7. AxisProjection

Chaque axe possède une projection indépendante de sa hiérarchie.

Conceptuellement :

``` js
const rows = new AxisProjection(rowHierarchy, model);
const columns = new AxisProjection(columnHierarchy, model);
```

Chaque projection possède son propre état de navigation.

Exemple :

``` js
rows.collapse("applications");
columns.expand("applications");
```

Le même item peut donc être replié sur un axe et déplié sur l'autre.

### Décision importante

L'état de dépliage ne doit jamais être stocké ainsi :

``` js
hierarchyNode.collapsed = true;
```

Il appartient à l'`AxisProjection`.

API cible :

``` js
matrix.rows.collapse(id);
matrix.rows.expand(id);
matrix.rows.toggle(id);

matrix.columns.collapse(id);
matrix.columns.expand(id);
matrix.columns.toggle(id);

matrix.rows.expandAll();
matrix.rows.collapseAll();

matrix.columns.expandAll();
matrix.columns.collapseAll();
```

------------------------------------------------------------------------

## 8. AxisEntry

Une projection produit une séquence d'entrées visibles normalisées.

Forme conceptuelle :

``` js
{
  entryId,
  id,
  item,
  label,
  scope,

  depth,
  parent,

  expanded,
  leaf
}
```

Une `AxisEntry` représente donc simultanément :

1.  une position dans une hiérarchie ;
2.  un état dans une projection d'axe ;
3.  un contexte de sélection du modèle.

Lorsqu'une branche est repliée, son entrée visible conserve son `scope`.
Le resolver décide comment interpréter ce contexte pour le modèle considéré.

`id` représente l'identité sémantique de l'item tandis que `entryId`
identifie une occurrence dans une projection d'axe. L'état de
collapse/expand est associé à `entryId`, car un même item sémantique peut
apparaître plusieurs fois dans une hiérarchie.

------------------------------------------------------------------------

## 9. CellResolver

Le `CellResolver` constitue le principal point d'extension fonctionnel.

Contrat conceptuel :

``` js
resolveCell({
  model,
  row,
  column
})
```

La valeur retournée est arbitraire.

### Booléen

``` js
resolveCell({ model, row, column }) {
  return hasInteraction(
    model,
    row.scope,
    column.scope
  );
}
```

### Valeur numérique

``` js
resolveCell({ model, row, column }) {
  return countInteractions(
    model,
    row.scope,
    column.scope
  );
}
```

### Objet composite

``` js
resolveCell({ model, row, column }) {
  return {
    count: countInteractions(...),
    score: computeScore(...),
    interactions: findInteractions(...)
  };
}
```

### Sous-graphe

``` js
resolveCell({ model, row, column }) {
  return extractSubgraph(
    model,
    row.scope,
    column.scope
  );
}
```

### Plus court chemin

``` js
resolveCell({ model, row, column }) {
  return shortestPath(
    model,
    row.scope,
    column.scope
  );
}
```

Le core n'interprète pas la valeur retournée.

------------------------------------------------------------------------

## 10. Cell`<T>`{=html}

La cellule doit être distinguée de sa valeur.

Contrat conceptuel :

``` js
{
  row,
  column,
  value
}
```

Cela permet de conserver le contexte matriciel indépendamment du type de
contenu.

Conceptuellement :

``` text
Cell<T>
```

où `T` peut être quelconque.

Le type de valeur ne doit pas déterminer la structure interne du moteur.

------------------------------------------------------------------------

## 11. Calcul asynchrone

L'architecture doit permettre les resolvers asynchrones dès sa
conception.

Exemple :

``` js
resolveCell: async ({ model, row, column }) => {
  return expensiveAnalysis(
    model,
    row.scope,
    column.scope
  );
}
```

Cela doit permettre ultérieurement :

-   calculs coûteux ;
-   Web Workers ;
-   accès à des services ;
-   chargement différé ;
-   analyses algorithmiques.

États potentiels d'une cellule :

``` text
unresolved
resolving
resolved
error
```

Ces états concernent le cycle de résolution et ne doivent pas être
confondus avec `cell.value`.

------------------------------------------------------------------------

## 12. CellRenderer

Le rendu est indépendant du calcul.

Le renderer SVG actuel expose trois points d'extension correspondant au
cycle de résolution d'une cellule :

``` js
renderCell({
  cell,
  x,
  y,
  width,
  height,
  createElement
});

renderPendingCell({
  cell,
  x,
  y,
  width,
  height,
  createElement
});

renderErrorCell({
  cell,
  error,
  x,
  y,
  width,
  height,
  createElement
});
```

`renderCell` reçoit une cellule résolue. `renderPendingCell` reçoit la
cellule dont la valeur est encore asynchrone. `renderErrorCell` reçoit
également l'objet de rejet original.

Ces hooks appartiennent à `SvgMatrixRenderer`, pas au core de projection et
de résolution.

Des renderers pourront exister pour différents usages :

``` text
BooleanRenderer
NumberRenderer
TextRenderer
GraphRenderer
ModelRenderer
CustomRenderer
```

Le renderer peut utiliser SVG/D3, HTML ou une autre technologie.

### Décision

Le moteur de projection et de résolution ne dépend ni de D3 ni du DOM ni
de SVG.

D3/SVG appartient à une couche de rendu.

------------------------------------------------------------------------

## 13. Sémantique du repli

Le MatrixBrowser historique recherchait l'existence de relations dans
les descendants de nœuds repliés.

`matrixbrowser-js` généralise cette idée.

Une entrée visible représente un ensemble d'éléments :

``` text
represented(row)
represented(column)
```

Le resolver reçoit ces contextes et décide de la sémantique du
croisement.

Ainsi le moteur doit fonctionner uniformément pour :

``` text
feuille × feuille
groupe  × feuille
feuille × groupe
groupe  × groupe
```

Le core ne doit pas imposer que les deux axes soient repliés pour qu'un
calcul agrégé soit effectué.

------------------------------------------------------------------------

## 14. Filtrage bidimensionnel

MatrixBrowser doit pouvoir être compris comme un moteur d'exploration
bidimensionnelle.

Conceptuellement :

``` text
               critère colonne
                      │
                      ▼
Model ─────── critère ligne ──────► résultat
```

Une cellule représente donc le résultat d'une requête contextuelle :

``` text
f(model, rowContext, columnContext)
```

Cette définition est plus générale qu'une matrice de relations.

------------------------------------------------------------------------

## 15. Séparation core / rendu

Structure conceptuelle souhaitée :

``` text
matrixbrowser-js
│
├── core
│   ├── hierarchy
│   ├── projection
│   ├── cells
│   └── events/state
│
├── render
│   └── svg
│
└── examples
```

Une séparation future en packages reste possible :

``` text
@matrixbrowser/core
@matrixbrowser/svg
```

mais n'est pas nécessaire pour la première implémentation.

------------------------------------------------------------------------

## 16. API publique cible initiale

``` js
const matrix = new MatrixBrowser({
  model,

  rows: {
    hierarchy: rowHierarchy
  },

  columns: {
    hierarchy: columnHierarchy
  },

  resolveCell({ model, row, column }) {
    return computeSomething(
      model,
      row.scope,
      column.scope
    );
  }
});

const renderer = new SvgMatrixRenderer({
  matrix,
  element: document.querySelector("#matrix"),
  renderCell: customRenderer
});

renderer.render();
```

Navigation :

``` js
matrix.rows.collapse("business");
matrix.rows.expand("business");

matrix.columns.collapse("applications");
matrix.columns.expand("applications");
```

Inspection :

``` js
matrix.getCell(rowId, columnId);

matrix.getVisibleRows();
matrix.getVisibleColumns();
```

Rafraîchissement :

``` js
matrix.refresh();
```

Cette API est une cible de conception et peut évoluer après prototypage.

------------------------------------------------------------------------

## 17. Responsabilités

### Model

Contient les données métier.

MatrixBrowser ne connaît pas sa structure.

### HierarchyProvider

Traduit ou classe le modèle sous forme hiérarchique.

### AxisProjection

Gère :

-   l'état expand/collapse ;
-   les entrées actuellement visibles ;
-   l'ordre des entrées ;
-   la profondeur ;
-   le contexte représenté par chaque entrée.

### CellResolver

Calcule la valeur d'une cellule à partir du modèle et des deux contextes
d'axe.

### Cell

Associe :

``` text
row + column + value
```

### CellRenderer

Transforme une cellule en représentation visuelle.

### MatrixBrowser

Orchestre les composants précédents et fournit l'API publique.

------------------------------------------------------------------------

## 18. Ce que le core ne doit pas connaître

Sauf révision architecturale explicite, le core ne doit pas dépendre
directement de :

-   ArchiCG ;
-   ArchiMate ;
-   Cytoscape ;
-   D3 ;
-   SVG ;
-   un format de graphe particulier ;
-   `Node` / `Edge` comme concepts obligatoires ;
-   une sémantique de relation particulière ;
-   une forme particulière de contenu de cellule.

------------------------------------------------------------------------

## 19. Relation future avec ArchiCG

ArchiCG constitue un consommateur futur important, mais ne définit pas
l'architecture du core.

Aucune modification d'ArchiCG ne fait partie de la baseline
`MBJS-ARCH-0.1`.

À terme, ArchiCG pourra fournir :

``` text
ModelAdapter / modèle
HierarchyProvider(s)
CellResolver(s)
CellRenderer(s)
```

sans que MatrixBrowser dépende d'ArchiCG.

------------------------------------------------------------------------

## 20. Première stratégie d'implémentation

L'ordre de développement recommandé est :

``` text
HierarchyProvider
       ↓
AxisProjection
       ↓
CellResolver / Cell
       ↓
MatrixBrowser core
       ↓
tests
       ↓
renderer SVG
       ↓
interactions D3
       ↓
examples
```

Le premier prototype doit donc fonctionner sans DOM.

Les tests du core doivent notamment couvrir :

-   hiérarchie simple ;
-   classification plate ;
-   deux hiérarchies différentes ;
-   collapse/expand indépendant ;
-   calcul feuille × feuille ;
-   calcul groupe × feuille ;
-   calcul feuille × groupe ;
-   calcul groupe × groupe ;
-   valeurs de cellule booléennes ;
-   valeurs numériques ;
-   valeurs objets ;
-   resolver asynchrone.

------------------------------------------------------------------------

## 21. Principe de conception

Les quatre verbes conceptuels du système sont :

``` text
classify
project
resolve
render
```

ou :

``` text
Model
  ↓ classify
Hierarchy
  ↓ project
Axis entries
  ↓ resolve
Cells
  ↓ render
Visualization
```

Cette chaîne doit rester découplée.

------------------------------------------------------------------------

## 22. Questions volontairement non figées en 0.1

Les points suivants doivent être décidés par prototypage ou ADR
ultérieur :

-   arbre strict ou support natif des taxonomies/DAG ;
-   adaptateurs optionnels de sélection tels que `members(scope)` ou
    `select(scope)` ;
-   cache des cellules ;
-   invalidation du cache ;
-   stratégie de résolution paresseuse ;
-   virtualisation des grandes matrices ;
-   Web Workers ;
-   système d'événements ;
-   sélection multiple ;
-   tri des axes ;
-   filtrage des axes ;
-   format des plugins ;
-   enregistrement automatique de renderers ;
-   TypeScript ou JavaScript + JSDoc ;
-   séparation effective en plusieurs packages ;
-   persistance de l'état expand/collapse ;
-   sérialisation d'une configuration MatrixBrowser.

Ces questions ne doivent pas être résolues implicitement dans une
première implémentation.

------------------------------------------------------------------------

## 23. Règle de gouvernance architecturale

Cette baseline porte la référence :

``` text
MBJS-ARCH-0.1
```

Toute décision qui contredit un principe explicitement établi ici doit
être :

1.  identifiée comme une modification architecturale ;
2.  discutée explicitement ;
3.  documentée dans une nouvelle baseline ou un ADR.

Les détails d'implémentation compatibles avec cette baseline peuvent
évoluer librement.

------------------------------------------------------------------------

## 24. Prompt de reprise pour une nouvelle conversation

Utiliser le texte suivant avec ce document :

> Nous poursuivons le développement de `matrixbrowser-js`.\
> Prends le document `docs/ARCHITECTURE.md`, référence `MBJS-ARCH-0.1`,
> comme contexte architectural de départ, complété et affiné par les ADR
> acceptés dans `docs/adr/`. En cas de divergence, l'ADR accepté le plus
> spécifique fait autorité.\
> Respecte ces décisions sauf si nous décidons explicitement de les
> réviser.\
> MatrixBrowser doit rester indépendant d'ArchiCG ; ArchiCG est un
> consommateur futur, pas une dépendance du core.\
> Commence par identifier l'état actuel du projet et la prochaine étape
> compatible avec cette baseline.

------------------------------------------------------------------------

## 25. Résumé normatif

`matrixbrowser-js` est un squelette extensible permettant de croiser
deux projections hiérarchiques indépendantes d'un modèle opaque.

Une hiérarchie peut être une structure native du modèle ou une
classification externe/calculée.

Chaque axe possède son propre état de projection et de collapse/expand.

Chaque cellule est calculée par un resolver libre et peut contenir une
valeur de n'importe quelle nature.

Le calcul et le rendu sont séparés.

Le core est indépendant des graphes, d'ArchiCG, d'ArchiMate, de
Cytoscape, de D3, de SVG et du DOM.

La première implémentation doit privilégier un core testable sans
interface graphique.

------------------------------------------------------------------------

**End of baseline `MBJS-ARCH-0.1`.**

---

## Architecture Decision Records

Technical decisions refining this baseline are documented separately as ADRs.

- `ADR-0001` — Vite/Vitest development and distribution toolchain
  (`docs/adr/0001-vite-vitest-toolchain.md`)

- `ADR-0002` — Opaque hierarchy scopes and cell resolution
  (`docs/adr/0002-opaque-hierarchy-scopes.md`)

The architecture baseline remains `MBJS-ARCH-0.1`.
Accepted ADRs refine this baseline and are authoritative for the decisions
they explicitly supersede or clarify.
