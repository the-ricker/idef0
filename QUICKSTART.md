# Quick Start Guide

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Compile TypeScript**
   ```bash
   npm run compile
   ```

3. **Run the extension**
   - Press `F5` in VS Code/Cursor
   - Or run: `npm run watch` in terminal and press F5

## Development

### File Structure
```
src/
├── extension.ts              # Extension entry point
├── types.ts                  # TypeScript type definitions
├── languageService/          # Auto-completion, syntax features
├── previewProvider/          # Webview preview functionality
├── parser/                   # YAML to model parsing
├── validator/                # IDEF0 rule validation
├── layout/                   # Automatic diagram layout
├── renderer/                 # SVG generation
└── export/                   # Export to SVG/PNG
```

### Testing the Extension

1. Press `F5` to launch Extension Development Host
2. In the new window, open one of the example files:
   - `examples/simple.idef`
   - `examples/order-processing.idef`
   - `examples/manufacturing.idef`
3. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
4. Run command: `IDEF0: Open Preview to the Side`
5. Edit the YAML and watch the preview update

### Key Features to Test

- ✅ **Syntax Highlighting**: Keywords should be colored
- ✅ **Auto-completion**: Type `activities:` or `arrows:` and press Tab
- ✅ **Live Preview**: Changes update automatically in preview
- ✅ **Validation**: Try removing a required field to see validation errors
- ✅ **Export**: Use `IDEF0: Export as SVG` command

### Making Changes

1. Edit source files in `src/`
2. If `npm run watch` is running, changes compile automatically
3. Press `Cmd+R` / `Ctrl+R` in Extension Development Host to reload
4. Test your changes

### Common Tasks

**Add new validation rule**:
- Edit `src/validator/index.ts`
- Add method to check rule
- Call from `validate()` method

**Modify diagram layout**:
- Edit `src/layout/index.ts`
- Adjust spacing constants or layout algorithm

**Change diagram appearance**:
- Edit `src/renderer/index.ts`
- Modify SVG generation in `render()` method

**Add auto-completion items**:
- Edit `src/languageService/completionProvider.ts`
- Add items in `provideCompletionItems()` method

## Troubleshooting

**Extension doesn't activate**:
- Check Output panel → "Extension Host"
- Look for error messages

**Preview doesn't update**:
- Check the file extension is `.idef`
- Check Console in Developer Tools (`Help → Toggle Developer Tools`)

**Compilation errors**:
- Run `npm run compile` to see TypeScript errors
- Fix errors in source files

**Can't see syntax highlighting**:
- Ensure file extension is `.idef`
- Check language mode in status bar (should show "IDEF0")

## Publishing

Before publishing to VS Code Marketplace:

1. Update `publisher` in `package.json`
2. Test thoroughly with example files
3. Update version number
4. Create CHANGELOG.md
5. Package extension:
   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```
6. Publish:
   ```bash
   vsce publish
   ```

## Next Steps

See [docs/prd.md](docs/prd.md) for roadmap and future features.

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [IDEF0 Standard](http://www.idef.com/idef0.htm)
