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
  title: Order Processing System
  version: "1.0"

activities:
  - code: A1
    label: Receive Order
    inputs:
      - label: Customer Order
    controls:
      - label: Order Policy
    outputs:
      - label: Order Details
        code: order_details
    mechanisms:
      - label: Order Management System

  - code: A2
    label: Validate Payment
    inputs:
      - label: Order Details
        code: order_details
    controls:
      - label: Payment Rules
    outputs:
      - label: Approved Order
        code: approved_order
    mechanisms:
      - label: Payment Gateway

  - code: A3
    label: Ship Product
    inputs:
      - label: Approved Order
        code: approved_order
    controls:
      - label: Shipping Policy
    outputs:
      - label: Shipped Product
    mechanisms:
      - label: Shipping Carrier
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
  title: Diagram Title
  author: Your Name
  version: "1.0"
  description: Diagram description
```

### Activities (Required)
```yaml
activities:
  - code: A1                    # Unique activity code
    label: Activity Name         # Display name
    inputs:                      # Input ICOMs (optional)
      - label: Input Label
        code: input_code         # Optional code for referencing
    controls:                    # Control ICOMs (required)
      - label: Control Label
    outputs:                     # Output ICOMs (required)
      - label: Output Label
        code: output_code        # Optional code for referencing
    mechanisms:                  # Mechanism ICOMs (optional)
      - label: Mechanism Label
```

### ICOM Connections
Connections between activities are implicit via codes:
- Outputs with a `code` can be referenced by inputs with the same `code`
- ICOMs without a `code` are external (from/to outside the diagram)
- Example: `outputs: [{ label: "Data", code: "data" }]` connects to `inputs: [{ label: "Data", code: "data" }]`

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
