# JScript9 Language Support for VS Code

This extension provides language support for JScript9 files used in Efficy CRM backend development.

## Features

### 1. Import Statement Parsing
The extension recognizes and parses the custom `@import` syntax used in JScript9:

```javascript
/*
@import "ecma"
@import Mails from "custom/rpva/crm/mails";
@import Documents from "custom/rpva/crm/documents";
*/
```

### 2. Go to Definition
- **Ctrl+Click** or **F12** on import statements to navigate to the imported file
- Works with:
  - Import paths (e.g., clicking on `"custom/rpva/crm/mails"`)
  - Module references (e.g., clicking on `Mails` in `Mails.saveMailFromRPVA()`)
  - Method calls (e.g., clicking on method names to jump to their definitions)

### 3. Hover Information
Hover over:
- Import statements to see resolved file paths and available exports
- Module names to see available methods
- Method calls to see JSDoc documentation

### 4. Syntax Validation
The extension validates:
- Import statement syntax (must be in comment blocks)
- Module resolution (warns if imported modules can't be found)
- ES6+ features that aren't supported in JScript9:
  - `const` and `let` declarations (suggests using `var`)
  - Arrow functions (suggests using function expressions)
  - Template literals (suggests using string concatenation)
- Unused imports
- References to undefined modules

### 5. Diagnostics
Real-time diagnostics showing:
- ⚠️ **Warnings**: Unresolved module paths, modern JavaScript features
- ❌ **Errors**: Invalid syntax, undefined module references
- 💡 **Hints**: Unused imports

## Configuration

### Settings
Configure the extension through VS Code settings:

```json
{
  "jscript9.customBasePath": "/mnt/c/inetpub/wwwroot/12.0/customs/fidal-gh/efficy/serverjs",
  "jscript9.enableDiagnostics": true
}
```

- **`jscript9.customBasePath`**: Base path for resolving `custom/` module imports
- **`jscript9.enableDiagnostics`**: Enable/disable syntax and import validation

## Module Path Resolution

The extension resolves module paths as follows:

1. **Built-in modules**: `@import "ecma"` - No file resolution needed
2. **Custom modules**: `@import ModuleName from "custom/path/to/module"`
   - Resolves to: `{customBasePath}/path/to/module.js`
   - Example: `custom/rpva/crm/mails` → `/mnt/c/inetpub/wwwroot/12.0/customs/fidal-gh/efficy/serverjs/rpva/crm/mails.js`

## File Detection

The extension automatically activates for:
- Files matching `**/efficy/serverjs/**/*.js`
- Files matching `**/customs/**/serverjs/**/*.js`
- Any `.js` file containing `@import` statements in comment blocks

## Usage Example

```javascript
/*
@import rpvaTojson from "custom/rpva/utils/xmlToJson";
@import rechercheDEC from "custom/rpva/core/rechercheDEC";
@import consultationDossiersAC from "custom/rpva/core/consultationDossiersAC";
*/

var module = {
    processData: function(data) {
        // Ctrl+Click on 'rechercheDEC' to go to its definition
        var result = rechercheDEC.search(data);
        
        // Hover over 'consultationDossiersAC' to see available methods
        return consultationDossiersAC.process(result);
    }
};

return module;
```

## Troubleshooting

### Imports not resolving?
1. Check that `jscript9.customBasePath` is correctly configured
2. Verify the file exists at the expected path
3. Ensure the import path follows the `custom/...` convention

### Go to Definition not working?
1. Make sure the import is inside a comment block `/* ... */`
2. Check that the module is properly imported
3. Verify the file extension is `.js`

### Diagnostics not showing?
1. Ensure `jscript9.enableDiagnostics` is set to `true`
2. Save the file to trigger validation
3. Check the Problems panel (View → Problems)

## Known Limitations

- Currently only supports module-level exports (not individual function exports)
- Method signature completion is not yet implemented
- Auto-import suggestions are not yet available