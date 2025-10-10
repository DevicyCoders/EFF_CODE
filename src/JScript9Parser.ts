import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface JScript9Import {
    fullStatement: string;
    importName?: string;
    modulePath: string;
    range: vscode.Range;
    resolvedPath?: string;
}

export class JScript9Parser {
    private static readonly IMPORT_PATTERN = /@import\s+(?:(\w+)\s+from\s+)?["']([^"']+)["']/g;
    private static readonly COMMENT_BLOCK_PATTERN = /\/\*[\s\S]*?\*\//g;
    private customBasePath: string;

    constructor(customBasePath: string = '/mnt/c/inetpub/wwwroot/12.0/customs/fidal-gh/efficy/serverjs') {
        this.customBasePath = customBasePath;
    }

    /**
     * Parse a document for JScript9 imports
     */
    public parseDocument(document: vscode.TextDocument): JScript9Import[] {
        const imports: JScript9Import[] = [];
        const text = document.getText();
        
        // Find all comment blocks that might contain imports
        const commentBlocks = text.match(JScript9Parser.COMMENT_BLOCK_PATTERN) || [];
        
        for (const block of commentBlocks) {
            const blockStart = text.indexOf(block);
            const linesBeforeBlock = text.substring(0, blockStart).split('\n').length - 1;
            
            // Parse imports within the comment block
            let match;
            const importPattern = new RegExp(JScript9Parser.IMPORT_PATTERN);
            while ((match = importPattern.exec(block)) !== null) {
                const importStart = blockStart + match.index;
                const importText = match[0];
                const importName = match[1];
                const modulePath = match[2];
                
                // Calculate line and character positions
                const textBeforeImport = text.substring(0, importStart);
                const lines = textBeforeImport.split('\n');
                const startLine = lines.length - 1;
                const startChar = lines[lines.length - 1].length;
                const endChar = startChar + importText.length;
                
                const range = new vscode.Range(
                    new vscode.Position(startLine, startChar),
                    new vscode.Position(startLine, endChar)
                );
                
                imports.push({
                    fullStatement: importText,
                    importName: importName,
                    modulePath: modulePath,
                    range: range,
                    resolvedPath: this.resolveModulePath(modulePath)
                });
            }
        }
        
        return imports;
    }

    /**
     * Resolve a module path to an actual file path
     */
    public resolveModulePath(modulePath: string): string | undefined {
        // Handle different module path patterns
        if (modulePath === 'ecma') {
            // Built-in module, no file path
            return undefined;
        }
        
        if (modulePath.startsWith('custom/')) {
            // Custom module path
            const relativePath = modulePath.replace('custom/', '');
            const fullPath = path.join(this.customBasePath, relativePath + '.js');
            
            // Check if file exists
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        
        // Try to resolve as absolute or relative path
        const withExtension = modulePath.endsWith('.js') ? modulePath : modulePath + '.js';
        if (fs.existsSync(withExtension)) {
            return path.resolve(withExtension);
        }
        
        return undefined;
    }

    /**
     * Get all imports from a document
     */
    public getImports(document: vscode.TextDocument): JScript9Import[] {
        return this.parseDocument(document);
    }

    /**
     * Find import at a specific position
     */
    public getImportAtPosition(document: vscode.TextDocument, position: vscode.Position): JScript9Import | undefined {
        const imports = this.parseDocument(document);
        return imports.find(imp => imp.range.contains(position));
    }

    /**
     * Validate imports in a document
     */
    public validateImports(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const imports = this.parseDocument(document);
        
        for (const imp of imports) {
            if (imp.modulePath !== 'ecma' && !imp.resolvedPath) {
                const diagnostic = new vscode.Diagnostic(
                    imp.range,
                    `Cannot resolve module '${imp.modulePath}'`,
                    vscode.DiagnosticSeverity.Warning
                );
                diagnostic.source = 'jscript9';
                diagnostics.push(diagnostic);
            }
        }
        
        return diagnostics;
    }

    /**
     * Get exported symbols from a JScript9 file
     */
    public getExportsFromFile(filePath: string): string[] {
        const exports: string[] = [];
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Look for module pattern
            const modulePattern = /var\s+module\s*=\s*\{([^}]+)\}/s;
            const moduleMatch = content.match(modulePattern);
            
            if (moduleMatch) {
                // Extract function/property names from module object
                const moduleContent = moduleMatch[1];
                const propertyPattern = /(\w+)\s*:/g;
                let propMatch;
                while ((propMatch = propertyPattern.exec(moduleContent)) !== null) {
                    exports.push(propMatch[1]);
                }
            }
            
            // Look for return statement
            const returnPattern = /return\s+(\w+)\s*;/;
            const returnMatch = content.match(returnPattern);
            if (returnMatch && returnMatch[1] === 'module') {
                // Module is returned, exports are valid
                return exports;
            }
            
            // Also check for direct returns of objects
            const directReturnPattern = /return\s*\{([^}]+)\}/s;
            const directMatch = content.match(directReturnPattern);
            if (directMatch) {
                const returnContent = directMatch[1];
                const propertyPattern = /(\w+)\s*:/g;
                let propMatch;
                while ((propMatch = propertyPattern.exec(returnContent)) !== null) {
                    exports.push(propMatch[1]);
                }
            }
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
        }
        
        return exports;
    }
}