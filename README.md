# IDEF0 Diagram Extension

Create, edit, and visualize IDEF0 (Integration Definition for Function Modeling) diagrams directly in Cursor/VS Code using YAML-based model files.

## Features

- **YAML-based modeling**: Define IDEF0 diagrams using simple, version-control-friendly YAML syntax
- **Live preview**: See your diagram update in real-time as you edit
- **Syntax highlighting**: Color-coded YAML syntax specific to IDEF0 elements
- **Auto-completion**: IntelliSense suggestions for activities, arrows, and ICOM types
- **Validation**: Real-time error checking for YAML syntax and IDEF0 rules
- **Export**: Save diagrams as SVG or PNG files
- **Automatic layout**: Smart positioning of activities and arrows

## Quick Start

1. Create a new file with `.idef` extension
2. Define your IDEF0 diagram in YAML format (see example below)
3. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
4. Run `IDEF0: Open Preview` to see your diagram

## Example

```yaml
metadata:
  title: "Order Processing System"
  version: "1.0"

activities:
  - id: "A1"
    label: "Process Order"

  - id: "A2"
    label: "Validate Payment"

  - id: "A3"
    label: "Ship Product"

arrows:
  - type: input
    from: external
    to: A1
    label: "Customer Order"

  - type: control
    from: external
    to: A1
    label: "Business Rules"

  - type: output
    from: A1
    to: A2
    label: "Validated Order"

  - type: output
    from: A2
    to: A3
    label: "Approved Order"

  - type: output
    from: A3
    to: external
    label: "Shipped Product"

  - type: mechanism
    from: external
    to: A1
    label: "Order System"
```

## Commands

- `IDEF0: Open Preview` - Open preview in current editor group
- `IDEF0: Open Preview to the Side` - Open preview in split view
- `IDEF0: Export as SVG` - Export diagram as SVG file
- `IDEF0: Export as PNG` - Export diagram as PNG file

## YAML Schema

See [examples/](examples/) folder for more sample diagrams.

### Metadata (Optional)
```yaml
metadata:
  title: "Diagram Title"
  author: "Your Name"
  version: "1.0"
  description: "Diagram description"
```

### Activities (Required)
```yaml
activities:
  - id: "A1"           # Unique identifier
    label: "Activity Name"  # Display name
```

### Arrows (Required)
```yaml
arrows:
  - type: input|control|output|mechanism  # ICOM type
    from: external|<activity-id>          # Source
    to: external|<activity-id>            # Target
    label: "Arrow Label"                  # Display name
```

## Configuration

Access settings via `Preferences: Open Settings (UI)` and search for "IDEF0":

- `idef0.preview.autoUpdate`: Auto-update preview on document changes (default: true)
- `idef0.preview.debounceDelay`: Delay before updating preview in ms (default: 300)
- `idef0.validation.enabled`: Enable IDEF0 validation (default: true)
- `idef0.export.defaultFormat`: Default export format (default: svg)
- `idef0.export.pngResolution`: PNG resolution multiplier (default: 2)

## Requirements

- VS Code version 1.85.0 or higher
- Works in Cursor (Cursor is VS Code-based)

## Known Limitations (MVP)

- Only supports basic IDEF0 features (activities + ICOM arrows)
- No hierarchical decomposition yet
- No manual positioning of activities
- No interactive diagram editing

See [roadmap](docs/prd.md) for planned features.

## Contributing

See [docs/prd.md](docs/prd.md) for the full Product Requirements Document.

## License

MIT

## Resources

- [IDEF0 Wikipedia](https://en.wikipedia.org/wiki/IDEF0)
- [IDEF0 Overview](https://syque.com/quality_tools/tools/Tools19.htm)
- [IDEF0 Standard](http://www.idef.com/idef0.htm)
