# YAML Schema Changes

## Summary

The YAML schema has been updated to a more hierarchical and intuitive structure. ICOMs (Inputs, Controls, Outputs, Mechanisms) are now nested within each activity instead of being defined separately in an `arrows` array.

## What Changed

### Old Schema (Original)
```yaml
activities:
  - id: "A1"
    label: "Process Order"
  - id: "A2"
    label: "Validate Payment"

arrows:
  - type: input
    from: external
    to: A1
    label: "Customer Order"
  - type: output
    from: A1
    to: A2
    label: "Order Details"
```

### New Schema (Current)
```yaml
activities:
  - code: A1
    label: Process Order
    inputs:
      - label: Customer Order
    controls:
      - label: Business Rules
    outputs:
      - label: Order Details
        code: order_details
    mechanisms:
      - label: Order System

  - code: A2
    label: Validate Payment
    inputs:
      - label: Order Details
        code: order_details
    outputs:
      - label: Approved Order
```

## Key Differences

### 1. Activity Identification
- **Old**: `id` field
- **New**: `code` field
- More consistent with IDEF0 terminology (A1, A2, etc. are "codes")

### 2. ICOM Structure
- **Old**: Separate `arrows` array with `type`, `from`, `to`, `label`
- **New**: Nested arrays within each activity: `inputs`, `controls`, `outputs`, `mechanisms`
- More hierarchical and readable
- Each ICOM is just `{ label, code? }`

### 3. Connections
- **Old**: Explicit `from`/`to` references in arrows
- **New**: Implicit connections via matching `code` fields
  - Output with `code: "order_details"` automatically connects to input with `code: "order_details"`
  - ICOMs without `code` are external (from/to outside the diagram)

### 4. External vs Internal
- **Old**: Explicit `from: external` or `to: external`
- **New**: Implicit based on presence of `code`
  - No `code` = external connection
  - Has `code` = can be referenced by other activities

## Benefits

1. **More Readable**: Activities and their ICOMs are grouped together
2. **Less Redundant**: No need to specify activity references twice (from/to)
3. **Self-Documenting**: Clear which ICOMs belong to which activity
4. **Simpler Mental Model**: Connections are implicit via codes
5. **Better Hierarchy**: Structure matches the conceptual model

## Files Updated

All code has been updated to support the new schema:

### Core Logic
- ✅ `src/types.ts` - Updated type definitions
- ✅ `src/parser/index.ts` - Parses new YAML structure
- ✅ `src/validator/index.ts` - Validates new structure + code references
- ✅ `src/layout/index.ts` - Resolves implicit connections from codes
- ✅ `src/renderer/index.ts` - Renders connections instead of arrows

### Language Features
- ✅ `src/languageService/completionProvider.ts` - Auto-completion for new structure
- ✅ `syntaxes/idef0.tmLanguage.json` - Syntax highlighting for new keywords

### Documentation & Examples
- ✅ `schemas/idef0.schema.json` - JSON Schema updated
- ✅ `examples/simple.idef` - Simple example
- ✅ `examples/order-processing.idef` - Order processing workflow
- ✅ `examples/manufacturing.idef` - Manufacturing workflow
- ✅ `README.md` - Documentation updated
- ✅ `docs/prd.md` - PRD schema section updated

## Migration Guide

If you had any files in the old format, here's how to convert them:

### Step 1: Rename `id` to `code`
```yaml
# Old
- id: "A1"

# New
- code: A1
```

### Step 2: Convert arrows to nested ICOMs
```yaml
# Old
activities:
  - id: "A1"
    label: "Activity"
arrows:
  - type: input
    from: external
    to: A1
    label: "Input"

# New
activities:
  - code: A1
    label: Activity
    inputs:
      - label: Input
```

### Step 3: Add codes for internal connections
```yaml
# Old
arrows:
  - type: output
    from: A1
    to: A2
    label: "Data"

# New
# In A1:
outputs:
  - label: Data
    code: data

# In A2:
inputs:
  - label: Data
    code: data
```

## Validation Rules

The new schema maintains all IDEF0 validation rules:

1. ✅ Every activity must have at least one control
2. ✅ Every activity must have at least one output
3. ✅ Activity codes must be unique
4. ✅ Input codes must reference existing output codes
5. ✅ Warns about unused output codes

## Testing

To test the changes:

```bash
# Compile
npm run compile

# Test with examples
# Press F5 in VS Code/Cursor
# Open examples/order-processing.idef
# Run: IDEF0: Open Preview to the Side
```

All three example files demonstrate the new schema in action.
