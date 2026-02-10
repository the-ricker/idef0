# Product Requirements Document: IDEF0 Cursor Extension

## 1. Overview

### Product Name
IDEF0 Diagram Extension for Cursor

### Product Description
A Cursor IDE extension that enables users to create, edit, and visualize IDEF0 (Integration Definition for Function Modeling) diagrams using YAML-based model files. The extension provides a markdown-style preview experience where users can edit YAML in one pane and see the rendered IDEF0 diagram update in real-time.

### Target Users
Business analysts, process engineers, and system architects who need to document and communicate business processes using the IDEF0 standard methodology.

### Problem Statement
Current IDEF0 diagram tools are either:
- Expensive commercial solutions (Visio, Lucidchart)
- Disconnected from development workflows
- Lack version control-friendly formats
- Don't integrate with modern code editors

This extension solves these problems by bringing IDEF0 modeling directly into the developer's IDE with a text-based, version-control-friendly format.

## 2. Goals & Success Metrics

### Primary Goals
1. Enable rapid creation and iteration of IDEF0 diagrams within Cursor
2. Provide a text-based format that works seamlessly with version control
3. Deliver real-time visual feedback while editing
4. Support standard IDEF0 notation for business process modeling

### Success Metrics
- Time to create a basic IDEF0 diagram < 5 minutes
- Zero-friction preview experience (sub-second rendering updates)
- YAML validation catches >90% of common errors
- User can export publication-ready diagrams (SVG/PNG)

## 3. User Personas & Use Cases

### Primary Persona: Business Process Analyst
**Background**: Documents organizational workflows and business processes using IDEF0 methodology. Needs to collaborate with technical teams and version control diagrams alongside code.

**Key Use Cases**:
1. Create a new IDEF0 diagram from scratch
2. Edit existing diagram by modifying YAML
3. Preview diagram changes in real-time
4. Export diagram for presentations and documentation
5. Validate diagram follows IDEF0 rules
6. Commit diagram source to Git for version tracking

## 4. Functional Requirements

### 4.1 Core Features (MVP)

#### F1: File Format Support
- **F1.1**: Support `.idef` file extension
- **F1.2**: Use YAML as the underlying model format
- **F1.3**: Define clear schema for IDEF0 elements (activities, ICOMs)

#### F2: IDEF0 Diagram Elements (Basic)
- **F2.1**: Support activity boxes with labels
- **F2.2**: Support Input arrows (left side)
- **F2.3**: Support Control arrows (top side)
- **F2.4**: Support Output arrows (right side)
- **F2.5**: Support Mechanism arrows (bottom side)
- **F2.6**: Support arrow labels and connections between activities

#### F3: Editor Features
- **F3.1**: YAML syntax highlighting specific to IDEF0 schema
- **F3.2**: Auto-completion for IDEF0 element types (activities, inputs, controls, outputs, mechanisms)
- **F3.3**: IntelliSense for activity names and references
- **F3.4**: Real-time YAML syntax validation

#### F4: Preview Functionality
- **F4.1**: Live preview pane that updates as YAML is edited
- **F4.2**: Split view with editor on left, preview on right (similar to markdown preview)
- **F4.3**: Sub-second rendering performance for diagrams with <20 activities
- **F4.4**: Visual error indicators when YAML is invalid or violates IDEF0 rules

#### F5: Diagram Rendering
- **F5.1**: Automatic layout algorithm for positioning activities and arrows
- **F5.2**: Standard IDEF0 visual conventions:
  - Activities as rectangles
  - ICOMs as arrows entering from correct sides
  - Arrow labels positioned near connection points
- **F5.3**: Use JavaScript diagram library (D3.js, Cytoscape, or similar) for rendering
- **F5.4**: SVG-based output for crisp rendering at any zoom level

#### F6: Export Capabilities
- **F6.1**: Export diagram as SVG file
- **F6.2**: Export diagram as PNG file (with configurable resolution)
- **F6.3**: Preserve diagram quality and readability in exports

#### F7: Validation
- **F7.1**: Validate YAML syntax errors
- **F7.2**: Validate IDEF0 semantic rules:
  - Every activity must have at least one control and one output
  - Arrow connections reference valid activities
  - No dangling arrows
- **F7.3**: Display validation errors in preview pane with clear messages
- **F7.4**: Highlight error locations in YAML editor

### 4.2 Out of Scope for MVP

The following features are explicitly excluded from the initial version:
- Hierarchical decomposition (A0 → A1, A2, A3 levels)
- Call arrows and tunneling
- FEO (For Exposition Only) diagrams
- Interactive drag-and-drop diagram editing
- Manual positioning overrides for activities
- Diagram comparison/diff visualization
- Multi-file diagram projects
- Import from other IDEF0 tools
- Collaboration features (comments, annotations)

## 5. Non-Functional Requirements

### Performance
- **NFR1**: Preview rendering completes within 500ms for diagrams with <20 activities
- **NFR2**: YAML validation provides feedback within 200ms of typing pause
- **NFR3**: Extension activation time < 1 second

### Usability
- **NFR4**: Zero-configuration setup (works immediately after installation)
- **NFR5**: Preview commands accessible via Command Palette
- **NFR6**: Familiar keyboard shortcuts consistent with Cursor/VS Code conventions

### Reliability
- **NFR7**: Extension handles malformed YAML gracefully (no crashes)
- **NFR8**: Autosave integration preserves work-in-progress
- **NFR9**: Export functions never lose diagram content

### Compatibility
- **NFR10**: Works with Cursor on macOS, Windows, Linux
- **NFR11**: Compatible with VS Code (since Cursor is VS Code-based)
- **NFR12**: YAML files readable in any text editor

## 6. Technical Architecture

### Technology Stack
- **Language**: TypeScript
- **Extension Framework**: VS Code Extension API
- **Diagram Rendering**: JavaScript diagram library (evaluate D3.js, Cytoscape.js, or Mermaid.js)
- **YAML Parsing**: js-yaml library
- **Schema Validation**: JSON Schema with ajv validator
- **Export**: SVG via library, SVG-to-PNG conversion for raster export

### Extension Components
1. **Language Service**: Provides syntax highlighting, auto-completion, validation
2. **Preview Provider**: Custom webview panel for diagram rendering
3. **YAML Parser**: Converts .idef files to in-memory model
4. **Layout Engine**: Calculates automatic positioning of activities and arrows
5. **Renderer**: Generates SVG representation of IDEF0 diagram
6. **Export Handler**: Saves diagrams as SVG/PNG files

### YAML Schema 

```yaml
# Example .idef file structure
metadata:
  title: Order Processing System
  author: Business Analyst
  version: "1.0"
activities:
  - code: A1
    label: Process Order
    inputs: 
      - label: Customer Order
    controls:
      - label: Business Rules
    outputs:
      - label: Validated Order
        code: vo
    mechanisms:
      - label: Order System
  - code: A2
    label: Validate Payment
    inputs:
      - label: Validated Order
        code: vo
    outputs:
      - label: Approved Order
        code: ao
  - code: A3
    label: Ship Product
    inputs:
      - label: Approved Order
        code: ao
    outputs:
      - label: Shipped Product
```

### File Structure
```
idef-extension/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── languageService/      # YAML syntax, auto-complete
│   ├── previewProvider/      # Webview panel management
│   ├── parser/               # YAML to model conversion
│   ├── validator/            # IDEF0 rule validation
│   ├── layout/               # Auto-layout algorithm
│   ├── renderer/             # SVG generation
│   └── export/               # SVG/PNG export
├── media/                    # Webview assets
├── syntaxes/                 # TextMate grammar for .idef
├── schemas/                  # JSON schema for YAML
└── package.json              # Extension manifest
```

## 7. User Experience Flow

### Creating a New Diagram
1. User creates new file with `.idef` extension
2. Extension activates and registers file type
3. User types YAML structure (with auto-completion assistance)
4. User opens Command Palette → "IDEF0: Open Preview"
5. Split view appears with live preview
6. User iterates on YAML, seeing immediate visual feedback

### Editing an Existing Diagram
1. User opens `.idef` file
2. Syntax highlighting shows YAML structure
3. User makes changes to activities or arrows
4. Preview automatically updates (if open)
5. Validation errors appear inline if rules violated

### Exporting a Diagram
1. User opens preview of diagram
2. User clicks export button or Command Palette → "IDEF0: Export Diagram"
3. User selects format (SVG or PNG)
4. User chooses save location
5. File saved successfully with confirmation message

## 8. MVP Scope & Phasing

### Phase 1: MVP (Target: v0.1.0)
**Scope**: Basic boxes + ICOMs with live preview
- ✅ `.idef` file support
- ✅ YAML syntax highlighting
- ✅ Auto-completion for IDEF0 elements
- ✅ Activity boxes with labels
- ✅ ICOM arrows (Input, Control, Output, Mechanism)
- ✅ Automatic layout algorithm
- ✅ Live preview with real-time updates
- ✅ YAML validation with error feedback
- ✅ SVG/PNG export

**Success Criteria**: User can create, edit, and export a basic IDEF0 diagram in <5 minutes

### Phase 2: Enhanced Features (Future)
- Hierarchical decomposition (A0 → child diagrams)
- Manual positioning overrides
- Diagram templates library
- Improved layout algorithms
- Zoom and pan controls in preview

### Phase 3: Advanced IDEF0 (Future)
- Call arrows and tunneling
- FEO diagrams
- Full IDEF0 standard compliance
- Import from other tools
- Diagram versioning and diff

## 9. Open Questions

### Technical Decisions
1. **Which JavaScript diagram library to use?**
   - Options: D3.js (flexible, verbose), Cytoscape.js (graph-focused), Mermaid.js (simple DSL)
   - Decision criteria: Ease of custom layout, SVG output quality, learning curve
   - **Recommendation**: Start with D3.js for maximum flexibility

2. **Layout algorithm approach?**
   - Options: Force-directed, layered/hierarchical, grid-based, manual positioning
   - IDEF0 typically uses horizontal flow (left to right)
   - **Recommendation**: Implement simple layered layout with topological sort

3. **How to handle external connections (arrows from/to "outside")?**
   - Option A: Special "external" keyword in YAML
   - Option B: Implicit (any arrow without valid activity reference)
   - **Recommendation**: Option A for clarity

### Product Decisions
4. **Should we support color coding for activities?**
   - IDEF0 standard is monochrome, but colors could aid understanding
   - **Defer to post-MVP**: Keep MVP strictly standard-compliant

5. **Should exported SVG include embedded metadata?**
   - Could include YAML source as SVG metadata
   - Enables "round-trip" editing
   - **Investigate**: Feasibility and value

## 10. Success Criteria & Launch Readiness

### Launch Checklist
- [ ] All MVP functional requirements implemented
- [ ] Extension works on macOS, Windows, Linux
- [ ] Documentation: README with examples, YAML schema reference
- [ ] Sample .idef files included (3+ examples)
- [ ] Performance benchmarks met (NFR1-NFR3)
- [ ] Beta testing with 5+ business analysts
- [ ] Published to VS Code Marketplace

### Post-Launch Monitoring
- User installation count
- Preview command usage frequency
- Export feature usage (SVG vs PNG)
- Error/crash reports
- Feature requests and feedback

## 11. References

### IDEF0 Resources
- [IDEF0 Wikipedia](https://en.wikipedia.org/wiki/IDEF0)
- [IDEF0 Overview (Syque)](https://syque.com/quality_tools/tools/Tools19.htm)
- [IDEF0 Diagrams (Lucidchart)](https://www.lucidchart.com/blog/idef-diagrams)
- [Microsoft Office IDEF0 Guide](https://support.microsoft.com/en-us/office/create-idef0-diagrams-ea7a9289-96e0-4df8-bb26-a62ea86417fc)

### Reference Implementations (Ruby)
- [IDEF0-SVG](https://github.com/jimmyjazz/IDEF0-SVG) - SVG generation approach
- [FindFuncDSL](https://github.com/vorachet/FindFuncDSL) - DSL design patterns

### Related Technologies
- VS Code Extension API
- TextMate Grammars (syntax highlighting)
- JSON Schema (validation)
- D3.js / Cytoscape.js / Mermaid.js (diagram rendering)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-10
**Author**: Business Analyst (based on user requirements)
**Status**: Ready for Development
