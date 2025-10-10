import * as vscode from 'vscode';
import { JScript9Parser } from './JScript9Parser';
import * as fs from 'fs';

export class JScript9DefinitionProvider implements vscode.DefinitionProvider {
    private parser: JScript9Parser;

    constructor(parser: JScript9Parser) {
        this.parser = parser;
    }

    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        
        // Check if we're on an import statement
        const importAtPosition = this.parser.getImportAtPosition(document, position);
        
        if (importAtPosition && importAtPosition.resolvedPath) {
            // Return the location of the imported file
            const uri = vscode.Uri.file(importAtPosition.resolvedPath);
            return new vscode.Location(uri, new vscode.Position(0, 0));
        }
        
        // Check if we're on a reference to an imported module
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }
        
        const word = document.getText(wordRange);
        const imports = this.parser.getImports(document);
        
        // Find if the word matches any imported module name
        for (const imp of imports) {
            if (imp.importName === word && imp.resolvedPath) {
                // Look for the specific export in the imported file
                const exports = this.parser.getExportsFromFile(imp.resolvedPath);
                
                // For now, just go to the file. In the future, we could parse
                // the file to find the exact location of the export
                const uri = vscode.Uri.file(imp.resolvedPath);
                
                // Try to find the exact location of the export
                const location = this.findExportLocation(imp.resolvedPath, word);
                if (location) {
                    return new vscode.Location(uri, location);
                }
                
                return new vscode.Location(uri, new vscode.Position(0, 0));
            }
        }
        
        // Check for method calls on imported modules (e.g., Mails.saveMailFromRPVA)
        const line = document.lineAt(position.line).text;
        const methodCallPattern = /(\w+)\.(\w+)/;
        const match = line.match(methodCallPattern);
        
        if (match) {
            const moduleName = match[1];
            const methodName = match[2];
            
            // Find the import for this module
            const moduleImport = imports.find(imp => imp.importName === moduleName);
            if (moduleImport && moduleImport.resolvedPath) {
                const uri = vscode.Uri.file(moduleImport.resolvedPath);
                const methodLocation = this.findMethodLocation(moduleImport.resolvedPath, methodName);
                
                if (methodLocation) {
                    return new vscode.Location(uri, methodLocation);
                }
                
                return new vscode.Location(uri, new vscode.Position(0, 0));
            }
        }
        
        return undefined;
    }

    private findExportLocation(filePath: string, exportName: string): vscode.Range | undefined {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Look for the export in the module definition
            const patterns = [
                new RegExp(`${exportName}\\s*:\\s*function`),
                new RegExp(`${exportName}\\s*:\\s*\\(`),
                new RegExp(`function\\s+${exportName}\\s*\\(`),
                new RegExp(`var\\s+${exportName}\\s*=`),
                new RegExp(`const\\s+${exportName}\\s*=`),
                new RegExp(`let\\s+${exportName}\\s*=`)
            ];
            
            for (let i = 0; i < lines.length; i++) {
                for (const pattern of patterns) {
                    if (pattern.test(lines[i])) {
                        const match = lines[i].match(pattern);
                        if (match) {
                            const startChar = lines[i].indexOf(exportName);
                            return new vscode.Range(
                                new vscode.Position(i, startChar),
                                new vscode.Position(i, startChar + exportName.length)
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error finding export location in ${filePath}:`, error);
        }
        
        return undefined;
    }

    private findMethodLocation(filePath: string, methodName: string): vscode.Range | undefined {
        return this.findExportLocation(filePath, methodName);
    }
}