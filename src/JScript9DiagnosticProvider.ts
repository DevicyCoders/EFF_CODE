import * as vscode from 'vscode';
import { JScript9Parser } from './JScript9Parser';

export class JScript9DiagnosticProvider {
    private parser: JScript9Parser;
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor(parser: JScript9Parser) {
        this.parser = parser;
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('jscript9');
    }

    public updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'jscript9' && !document.fileName.endsWith('.js')) {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];

        // Check imports
        const importDiagnostics = this.parser.validateImports(document);
        diagnostics.push(...importDiagnostics);

        // Check for syntax issues
        const syntaxDiagnostics = this.validateSyntax(document);
        diagnostics.push(...syntaxDiagnostics);

        // Check for undefined references
        const referenceDiagnostics = this.validateReferences(document);
        diagnostics.push(...referenceDiagnostics);

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private validateSyntax(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        // Check for import statements outside of comment blocks
        const importPattern = /@import\s+(?:(\w+)\s+from\s+)?["']([^"']+)["']/;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (importPattern.test(line)) {
                // Check if this line is inside a comment block
                const lineStart = text.split('\n').slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
                const lineEnd = lineStart + line.length;
                
                let isInComment = false;
                const commentBlocks = text.match(/\/\*[\s\S]*?\*\//g) || [];
                for (const block of commentBlocks) {
                    const blockStart = text.indexOf(block);
                    const blockEnd = blockStart + block.length;
                    if (lineStart >= blockStart && lineEnd <= blockEnd) {
                        isInComment = true;
                        break;
                    }
                }
                
                if (!isInComment) {
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(i, 0, i, line.length),
                        '@import statements must be inside a comment block (/* ... */)',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'jscript9';
                    diagnostics.push(diagnostic);
                }
            }
        }

        // Check for common JScript9 issues
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for ES6+ features that might not be supported in JScript9
            if (/\bconst\s+/.test(line) || /\blet\s+/.test(line)) {
                const match = line.match(/\b(const|let)\s+/);
                if (match) {
                    const startChar = line.indexOf(match[0]);
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(i, startChar, i, startChar + match[0].length),
                        `'${match[1]}' might not be supported in JScript9. Consider using 'var' instead.`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostic.source = 'jscript9';
                    diagnostics.push(diagnostic);
                }
            }
            
            // Check for arrow functions
            if (/=>\s*{/.test(line) || /=>\s*\w/.test(line)) {
                const match = line.match(/=>/);
                if (match) {
                    const startChar = line.indexOf('=>');
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(i, startChar, i, startChar + 2),
                        'Arrow functions are not supported in JScript9. Use function expressions instead.',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'jscript9';
                    diagnostics.push(diagnostic);
                }
            }
            
            // Check for template literals
            if (/`[^`]*`/.test(line)) {
                const match = line.match(/`[^`]*`/);
                if (match) {
                    const startChar = line.indexOf(match[0]);
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(i, startChar, i, startChar + match[0].length),
                        'Template literals are not supported in JScript9. Use string concatenation instead.',
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'jscript9';
                    diagnostics.push(diagnostic);
                }
            }
        }

        return diagnostics;
    }

    private validateReferences(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const imports = this.parser.getImports(document);
        
        // Get all imported module names
        const importedModules = imports
            .filter(imp => imp.importName)
            .map(imp => imp.importName!);
        
        // Check for usage of modules that haven't been imported
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for module method calls (e.g., SomeModule.someMethod())
            const moduleCallPattern = /\b([A-Z]\w+)\.\w+/g;
            let match;
            
            while ((match = moduleCallPattern.exec(line)) !== null) {
                const moduleName = match[1];
                
                // Skip if it's a built-in object
                const builtIns = ['Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'JSON', 'Error'];
                if (builtIns.includes(moduleName)) {
                    continue;
                }
                
                // Check if this module has been imported
                if (!importedModules.includes(moduleName)) {
                    const startChar = line.indexOf(match[0]);
                    const diagnostic = new vscode.Diagnostic(
                        new vscode.Range(i, startChar, i, startChar + moduleName.length),
                        `Module '${moduleName}' is not imported. Add '@import ${moduleName} from "..."' to use it.`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'jscript9';
                    diagnostics.push(diagnostic);
                }
            }
        }
        
        // Check for unused imports
        for (const imp of imports) {
            if (imp.importName && imp.importName !== 'ecma') {
                const usagePattern = new RegExp(`\\b${imp.importName}\\b`, 'g');
                const textWithoutImports = text.replace(/\/\*[\s\S]*?\*\//g, '');
                
                if (!usagePattern.test(textWithoutImports)) {
                    const diagnostic = new vscode.Diagnostic(
                        imp.range,
                        `Import '${imp.importName}' is never used`,
                        vscode.DiagnosticSeverity.Hint
                    );
                    diagnostic.source = 'jscript9';
                    diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
                    diagnostics.push(diagnostic);
                }
            }
        }
        
        return diagnostics;
    }

    public clearDiagnostics(document: vscode.TextDocument): void {
        this.diagnosticCollection.delete(document.uri);
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}