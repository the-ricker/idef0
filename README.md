# IDEF0 Diagram Editor

A VSCode extension for editing and previewing [IDEF0](https://en.wikipedia.org/wiki/IDEF0) diagrams with live SVG rendering.

IDEF0 is a function modeling methodology for describing manufacturing functions, providing a structured representation of activities, inputs, outputs, controls, and mechanisms.

## Features

- Syntax highlighting for `.idef0` files
- Live preview panel (like Markdown preview) with automatic re-rendering on edit
- Custom split editor with integrated text editing and diagram view
- Four diagram views: Schematic, Decompose, Focus, and Table of Contents
- Automatic layout with a constraint solver that minimizes line crossings

## The IDEF0 DSL

Each line in an `.idef0` file is a statement in the form:

```
Subject predicate Object
```

### Predicates

| Predicate | IDEF0 meaning | Arrow side |
|---|---|---|
| `receives` | Input | Left |
| `produces` | Output | Right |
| `respects` | Control / Guidance | Top |
| `requires` | Mechanism / Enabler | Bottom |
| `is composed of` | Sub-function | (hierarchy) |

### Example

```idef0
Cook Pizza receives Ingredients
Cook Pizza respects Customer Order
Cook Pizza respects Recipe
Cook Pizza requires Chef
Cook Pizza requires Kitchen
Cook Pizza produces Pizza

Take Order produces Customer Order
Take Order respects Menu
Take Order requires Wait Staff

Eat Pizza receives Pizza
Eat Pizza receives Hungry Customer
Eat Pizza produces Satisfied Customer
Eat Pizza produces Mess
```

Lines starting with `#` are comments. Blank lines are ignored.

## Diagram Views

| View | Description |
|---|---|
| **Schematic** | Shows all leaf-level functions with their data flows |
| **Decompose** | Shows one level of hierarchy (direct children of a function) |
| **Focus** | Shows a single function and its immediate interface |
| **TOC** | Text-based table of contents showing the function hierarchy |

## Usage

1. Open or create a `.idef0` file
2. Click the preview icon in the editor title bar (or run **IDEF0: Open Preview to Side** from the command palette)
3. Use the toolbar buttons in the preview to switch between views
4. Alternatively, right-click a `.idef0` file and choose **Open With... > IDEF0 Editor** for the split editor

## Development

```sh
npm install
npm run build    # one-time build
npm run watch    # rebuild on change
npm test         # run tests
```

Press **F5** in VSCode to launch the Extension Development Host.

## Credits

The IDEF0 diagram engine is a TypeScript port of [IDEF0-SVG](https://github.com/jimmyjazz/IDEF0-SVG) by jimmyjazz, originally written in Ruby.

## License

MIT
