# IDEF0-SVG Ruby to TypeScript Conversion Plan

## Overview

Convert the [IDEF0-SVG](https://github.com/jimmyjazz/IDEF0-SVG) Ruby project into TypeScript, embedded within a VSCode extension that provides both a preview panel and a custom editor for `.idef0` files.

The Ruby project is a self-contained IDEF0 diagram generator with zero external dependencies. It parses a simple DSL (`Subject Predicate Object` statements), builds a process hierarchy, and renders SVG diagrams with automatic layout optimization.

## Source Project Summary

| Aspect | Detail |
|---|---|
| Language | Ruby, no external gems |
| Source files | ~40 Ruby files in `lib/idef0/` |
| Input format | `.idef0` text DSL (e.g. `Cook Pizza receives Ingredients`) |
| Output | SVG (XML string generation) |
| Views | Schematic, Decompose, Focus, Table of Contents |
| Layout | Greedy constraint solver minimizing backward lines |

## Target Architecture

```
src/
  idef0/                    # Core library (Ruby port)
    model/                  # Data model
      process.ts            # Process tree (from process.rb)
      statement.ts          # DSL parser (from statement.rb)
    layout/                 # Layout engine
      diagram.ts            # Main orchestrator (from diagram.rb)
      box.ts                # Box base class (from box.rb)
      processBox.ts         # Process box (from process_box.rb)
      sides.ts              # Side classes (from sides.rb)
      anchor.ts             # Anchor points (from anchor.rb)
    lines/                  # Line drawing (18 Ruby files -> grouped)
      line.ts               # Base line class
      internalLines.ts      # Forward/Backward Input/Guidance/Mechanism
      externalLines.ts      # External Input/Output/Guidance/Mechanism
      unsatisfiedLines.ts   # Unsatisfied (dashed) variants
      lineTypes.ts          # Line type registry (from lines.rb)
    rendering/              # SVG output
      svg.ts                # SVG string generation helpers
      labels.ts             # Label classes (from labels.rb)
    util/                   # Utilities
      arraySet.ts           # ArraySet collection (from array_set.rb)
      point.ts              # Point class (from point.rb)
      bounds.ts             # Bounds + BoundsExtension (from bounds.rb, bounds_extension.rb)
  extension/                # VSCode extension
    extension.ts            # Extension entry point (activation, commands)
    previewPanel.ts         # Webview preview panel (like Markdown preview)
    customEditor.ts         # Custom editor provider
    webview/                # Webview HTML/JS assets
      preview.html          # Preview panel HTML shell
      editor.html           # Custom editor HTML shell
```

## Conversion Phases

### Phase 1: Project Scaffolding

Set up the VSCode extension project with TypeScript tooling.

**Tasks:**
1. Initialize the project with `package.json` (VSCode extension manifest)
2. Configure TypeScript (`tsconfig.json`) targeting ES2020+
3. Set up build tooling (esbuild for bundling)
4. Configure extension activation events for `.idef0` files
5. Register commands: `idef0.preview`, `idef0.showSchematic`, `idef0.showDecompose`, `idef0.showFocus`, `idef0.showToc`
6. Add `.vscode/launch.json` for extension debugging

**Decisions:**
- Use `esbuild` for fast bundling (standard for modern VSCode extensions)
- Target `es2020` for modern JS features without bloat
- Extension activates on `.idef0` file open

---

### Phase 2: Core Utilities

Port the foundational utility classes that everything else depends on.

**Files to convert:**

| Ruby source | TypeScript target | Notes |
|---|---|---|
| `array_set.rb` | `util/arraySet.ts` | Custom ordered collection. Port as a generic `ArraySet<T>` class. The Ruby version uses implicit identity; TS version needs an explicit key function or uses reference equality. |
| `point.rb` | `util/point.ts` | Immutable `(x, y)` pair with `translate()`. Straightforward. |
| `bounds.rb` | `util/bounds.ts` | Rectangle `(x1, y1, x2, y2)`. Straightforward. |
| `bounds_extension.rb` | `util/bounds.ts` | Combine into same file as `Bounds`. Tracks N/S/E/W clearance. |
| `string_squishing.rb` | (inline) | Replace with `str.trim().replace(/\s+/g, ' ')` at usage sites. |
| `string_comment_detection.rb` | (inline) | Replace with `str.startsWith('#')` at usage sites. |
| `positive_number_detection.rb` | (inline) | Replace with `n > 0` at usage sites. |
| `collection_negation.rb` | (inline) | Replace with `.map(x => -x)` at usage sites. |

**Key typing decisions:**
- `ArraySet<T>` should be generic with a comparator/key function parameter
- `Point` should be an immutable class (readonly properties)
- Ruby mixins (string/number extensions) become inline expressions or standalone utility functions rather than prototype extensions

---

### Phase 3: Data Model & Parser

Port the DSL parser and process tree model.

**Files to convert:**

| Ruby source | TypeScript target | Notes |
|---|---|---|
| `statement.rb` | `model/statement.ts` | DSL parser. Convert regex parsing. The Ruby regexes for noun/verb validation port directly to JS regexes. |
| `noun.rb` | `model/statement.ts` | Merge into statement module - just a regex constant. |
| `verb.rb` | `model/statement.ts` | Merge into statement module - just a regex constant. |
| `process.rb` | `model/process.ts` | Process tree. The `define_method` metaprogramming for `receives/produces/respects/requires` becomes four explicit methods. The `send()` call in `parse()` becomes a switch statement. |

**Key conversion notes:**
- Ruby's `define_method` dynamic method creation -> explicit typed methods
- Ruby's `Hash.new { |h,k| h[k] = new(k) }` auto-vivifying hash -> `Map` with explicit `getOrCreate` pattern
- Ruby's `send(method_name)` -> TypeScript switch/map pattern
- Ruby's `Forwardable` delegation -> not needed, use direct method calls
- `Process.parse()` returns a root `Process`; the `__root__` synthetic node logic stays the same
- `Side` enum: `'left_side' | 'right_side' | 'top_side' | 'bottom_side'`

**Validation at this phase:**
- Write unit tests for the parser against all four sample `.idef0` files
- Verify process tree construction matches expected hierarchy

---

### Phase 4: Box & Side Layout

Port the visual container classes.

**Files to convert:**

| Ruby source | TypeScript target | Notes |
|---|---|---|
| `box.rb` | `layout/box.ts` | Base box class with sides and movement. |
| `process_box.rb` | `layout/processBox.ts` | Extends Box, calculates dimensions from text length and anchor count. |
| `sides.rb` | `layout/sides.ts` | `TopSide`, `BottomSide`, `LeftSide`, `RightSide` classes. Ruby uses inheritance (`HorizontalSide`, `VerticalSide`); keep the same pattern in TS. |
| `anchor.rb` | `layout/anchor.ts` | Connection point on a side. |

**Key conversion notes:**
- Ruby's `attr_reader` -> TypeScript `readonly` properties or getters
- The `expects(name)` method on sides creates anchors - this is the bridge between the data model and visual layout
- `ProcessBox` dimension formula: `Label.length(name) * 6 + 40` for width, anchor count * 20 for height contributions
- Side `anchor_point(n)` calculation centers anchors with 20px spacing

---

### Phase 5: Line System

Port the 18 line type classes. This is the largest phase by file count but the classes follow a consistent pattern.

**Files to convert:**

| Ruby source(s) | TypeScript target | Notes |
|---|---|---|
| `line.rb` | `lines/line.ts` | Base class with SVG arrow helpers, label positioning. |
| `forward_input_line.rb`, `backward_input_line.rb` | `lines/internalLines.ts` | Group related internal lines. |
| `internal_guidance_line.rb`, `forward_guidance_line.rb`, `backward_guidance_line.rb` | `lines/internalLines.ts` | |
| `internal_mechanism_line.rb`, `forward_mechanism_line.rb`, `backward_mechanism_line.rb` | `lines/internalLines.ts` | |
| `external_input_line.rb`, `external_output_line.rb`, `external_guidance_line.rb`, `external_mechanism_line.rb` | `lines/externalLines.ts` | |
| `unsatisfied_input_line.rb`, `unsatisfied_output_line.rb`, `unsatisfied_guidance_line.rb`, `unsatisfied_mechanism_line.rb` | `lines/unsatisfiedLines.ts` | Dashed variants of external lines. |
| `lines.rb` | `lines/lineTypes.ts` | Registry arrays: `INTERNAL_LINE_TYPES`, `EXTERNAL_LINE_TYPES`, `UNATTACHED_LINE_TYPES`. |

**Key conversion notes:**
- Each Ruby line class defines `self.make_line(source, target)` as a class-level factory. In TS, convert these to standalone factory functions or static methods.
- The `yield` pattern in `make_line` (Ruby block) -> callback parameter or return `Line | null`
- SVG path generation uses string interpolation with coordinates. Port directly; the math is identical.
- Bezier curve coordinates (cubic `C` commands in SVG paths) are the same.
- `backward?` method -> boolean property or method
- Arrow SVG helpers (`svg_right_arrow`, `svg_down_arrow`, `svg_up_arrow`) -> static methods on a utility class or the base `Line` class

**Grouping rationale:** The Ruby project has 18 separate files because Ruby conventions favor one-class-per-file. In TypeScript, grouping related line types (all internal lines, all external lines, all unsatisfied lines) into 3 files reduces import complexity while keeping files manageable (~200-300 lines each).

---

### Phase 6: Labels & SVG Rendering

Port the label system and SVG output generation.

**Files to convert:**

| Ruby source | TypeScript target | Notes |
|---|---|---|
| `labels.rb` | `rendering/labels.ts` | `Label`, `LeftAlignedLabel`, `RightAlignedLabel`, `CentredLabel`. Each has `to_svg()` and `overlapping?()`. |
| SVG helpers in `diagram.rb` | `rendering/svg.ts` | Extract SVG document boilerplate (XML declaration, SVG element, style) into helper functions. |

**Key conversion notes:**
- Label width: `name.length * 6` pixels (monospace approximation from Ruby)
- Label height: 20 pixels
- `overlapping?` uses AABB rectangle intersection
- SVG `text-anchor` values map directly

---

### Phase 7: Diagram Orchestrator

Port the main diagram class that ties everything together.

**Files to convert:**

| Ruby source | TypeScript target | Notes |
|---|---|---|
| `diagram.rb` | `layout/diagram.ts` | The `Diagram` class extends `Box`. The `IDEF0.diagram()` module method becomes a standalone function. |

**Key conversion notes:**
- `IDEF0.diagram(name) { |d| ... }` (Ruby block) -> `createDiagram(name, (d: Diagram) => void): Diagram`
- The `tap` pattern -> explicit variable + return
- `create_lines` is the constraint solver: iterate box orderings, minimize backward lines. Port logic directly.
- `layout` method: positions boxes, calculates bounds, runs collision avoidance, translates to positive coordinates
- `to_svg()` assembles the final SVG string

**Validation at this phase:**
- Generate SVG from each sample `.idef0` file
- Compare output against the Ruby-generated SVG files in `samples/`
- Diagrams should be visually equivalent (exact pixel match is not required; structural correctness is)

---

### Phase 8: VSCode Preview Panel

Build the Markdown-preview-style side panel.

**Implementation:**
1. Register a `WebviewPanel` that activates via command `idef0.preview` or the editor title bar icon
2. On activation, read the active `.idef0` document, parse it, generate SVG, and inject into the webview
3. Listen for `onDidChangeTextDocument` events to re-render on edit (with debouncing)
4. Add a view selector dropdown/buttons in the webview for switching between Schematic / Decompose / Focus / TOC
5. For Decompose and Focus views, allow clicking on a function name to navigate into that function's view

**Webview content:**
- HTML shell with an `<div id="diagram">` container
- SVG injected as inline content (not as an image src, to allow future interactivity)
- Minimal CSS for centering, zoom controls
- Message passing between extension and webview for view switching

**Commands to register:**
- `idef0.openPreview` - Opens preview to the side
- `idef0.openPreviewToSide` - Explicitly opens to the side

---

### Phase 9: Custom Editor

Build a `CustomTextEditorProvider` for `.idef0` files.

**Implementation:**
1. Register a `CustomTextEditorProvider` for the `idef0` viewType
2. The custom editor shows a split view: text editing area on the left, rendered SVG on the right
3. Text changes sync through the standard VSCode document model (`WorkspaceEdit`)
4. Re-render SVG on document change (debounced)
5. Support all four views with a toolbar to switch between them

**Key details:**
- Use `vscode.CustomTextEditorProvider` (not binary `CustomEditorProvider`) since `.idef0` files are plain text
- The text editing side uses a standard textarea or a lightweight code editor (Monaco is available in webviews)
- Bidirectional sync: edits in the textarea update the document; external edits (from other editors) update the textarea
- Register as a secondary editor (user can choose between default text editor and custom editor)

---

### Phase 10: Polish & Testing

**Testing strategy:**
- Unit tests for the parser (`statement.ts`) against all sample files
- Unit tests for process tree construction (`process.ts`)
- Unit tests for `ArraySet` operations
- Integration tests: parse sample `.idef0` -> generate SVG -> validate SVG structure (check for expected boxes, lines, labels)
- Copy sample `.idef0` files into the test fixtures

**Additional polish:**
- `.idef0` language configuration (bracket matching, comment toggling with `#`)
- Basic syntax highlighting via a TextMate grammar (`.tmLanguage.json`)
- Hover information showing function details
- Error diagnostics for invalid DSL syntax (red squiggles)
- SVG export command (save rendered diagram to file)

## Conversion Patterns Reference

Common Ruby-to-TypeScript patterns that will be used throughout:

| Ruby pattern | TypeScript equivalent |
|---|---|
| `attr_reader :name` | `readonly name: string` or getter |
| `define_method(sym) { \|arg\| ... }` | Explicit method definitions |
| `object.send(method_name, arg)` | Switch statement or method map |
| `Hash.new { \|h,k\| h[k] = default }` | `Map` + helper function |
| `array.reduce(init) { \|acc, x\| ... }` | `array.reduce((acc, x) => ..., init)` |
| `block yield` / `&block` | Callback parameter `(fn: (x: T) => void)` |
| `tap { \|x\| ... }` | Assign to variable, mutate, return |
| `module IDEF0 ... end` | Namespace or just module-level exports |
| `require_relative` | `import` statements |
| `Forwardable` / `def_delegators` | Direct method calls or wrapper methods |
| String interpolation `"#{x}"` | Template literals `` `${x}` `` |
| `raise "message"` | `throw new Error("message")` |
| `nil` | `null` or `undefined` (prefer `null` for explicit absence) |
| `include ModuleName` | Composition or utility functions (no mixins) |

## Dependency Summary

| Dependency | Purpose |
|---|---|
| `vscode` (types) | Extension API types |
| `esbuild` | Bundling |
| `typescript` | Compiler |
| `vitest` or `mocha` | Testing |

No runtime dependencies beyond the VSCode API. The IDEF0 library is self-contained, matching the zero-dependency philosophy of the Ruby original.

## Risk & Complexity Notes

1. **Line layout algorithm** (Phase 5-7) is the most complex part. The greedy constraint solver with permutation testing should be ported carefully with test coverage.
2. **SVG path generation** involves precise coordinate math with Bezier curves. Recommend comparing output SVG paths against Ruby output for the sample files.
3. **Ruby metaprogramming** (`define_method`, `send`) requires manual expansion into explicit TypeScript code - not complex, just tedious.
4. **Custom editor** (Phase 9) has the most VSCode API surface area. The preview panel (Phase 8) is simpler and should be completed first.

## Suggested Order of Work

Phases 1-7 are sequential (each builds on the prior). Phases 8 and 9 can be developed in parallel once Phase 7 is complete. Phase 10 should run continuously alongside all other phases (write tests as you go).

```
Phase 1 (Scaffolding)
  |
Phase 2 (Utilities)
  |
Phase 3 (Parser & Model)
  |
Phase 4 (Box & Sides)
  |
Phase 5 (Lines)
  |
Phase 6 (Labels & SVG)
  |
Phase 7 (Diagram)
  |
  +---> Phase 8 (Preview Panel)
  |
  +---> Phase 9 (Custom Editor)
  |
Phase 10 (Polish & Testing - continuous)
```
