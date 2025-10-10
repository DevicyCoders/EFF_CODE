import * as vscode from 'vscode';
import { JScript9Parser } from './JScript9Parser';
import * as fs from 'fs';
import * as path from 'path';

export class JScript9HoverProvider implements vscode.HoverProvider {
    private parser: JScript9Parser;

    constructor(parser: JScript9Parser) {
        this.parser = parser;
    }

    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        
        // Check if we're on an import statement
        const importAtPosition = this.parser.getImportAtPosition(document, position);
        
        if (importAtPosition) {
            const markdown = new vscode.MarkdownString();
            markdown.appendMarkdown(`**JScript9 Import**\n\n`);
            
            if (importAtPosition.importName) {
                markdown.appendMarkdown(`Module: \`${importAtPosition.importName}\`\n\n`);
            }
            
            markdown.appendMarkdown(`Path: \`${importAtPosition.modulePath}\`\n\n`);
            
            if (importAtPosition.resolvedPath) {
                markdown.appendMarkdown(`Resolved to: \`${importAtPosition.resolvedPath}\`\n\n`);
                
                // Try to get exports from the file
                const exports = this.parser.getExportsFromFile(importAtPosition.resolvedPath);
                if (exports.length > 0) {
                    markdown.appendMarkdown(`**Exports:**\n`);
                    exports.forEach(exp => {
                        markdown.appendMarkdown(`- \`${exp}\`\n`);
                    });
                }
            } else {
                markdown.appendMarkdown(`⚠️ *Module not found*\n`);
            }
            
            return new vscode.Hover(markdown);
        }
        
        // Check if we're hovering over an imported module reference
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }
        
        const word = document.getText(wordRange);
        const imports = this.parser.getImports(document);
        
        // Find if the word matches any imported module name
        for (const imp of imports) {
            if (imp.importName === word && imp.resolvedPath) {
                const markdown = new vscode.MarkdownString();
                markdown.appendMarkdown(`**Imported Module: ${word}**\n\n`);
                markdown.appendMarkdown(`From: \`${imp.modulePath}\`\n\n`);
                
                // Get exports from the module
                const exports = this.parser.getExportsFromFile(imp.resolvedPath);
                if (exports.length > 0) {
                    markdown.appendMarkdown(`**Available methods:**\n`);
                    exports.forEach(exp => {
                        markdown.appendMarkdown(`- \`${exp}\`\n`);
                    });
                }
                
                // Try to get a brief description from the file
                const description = this.getModuleDescription(imp.resolvedPath);
                if (description) {
                    markdown.appendMarkdown(`\n**Description:**\n${description}\n`);
                }
                
                return new vscode.Hover(markdown);
            }
        }
        
        // Check for method calls on imported modules
        const line = document.lineAt(position.line).text;
        const beforePosition = line.substring(0, position.character);
        const methodCallPattern = /(\w+)\.(\w+)$/;
        const match = beforePosition.match(methodCallPattern);
        
        if (match) {
            const moduleName = match[1];
            const methodName = match[2];
            
            const moduleImport = imports.find(imp => imp.importName === moduleName);
            if (moduleImport && moduleImport.resolvedPath) {
                const methodDoc = this.getMethodDocumentation(moduleImport.resolvedPath, methodName);
                if (methodDoc) {
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown(`**${moduleName}.${methodName}**\n\n`);
                    markdown.appendMarkdown(methodDoc);
                    return new vscode.Hover(markdown);
                }
            }
        }
        
        return undefined;
    }

    private getModuleDescription(filePath: string): string | undefined {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Look for a module-level comment at the beginning of the file
            const moduleCommentPattern = /^\/\*\*[\s\S]*?\*\//;
            const match = content.match(moduleCommentPattern);
            
            if (match) {
                // Clean up the comment
                let comment = match[0];
                comment = comment.replace(/^\/\*\*/, '').replace(/\*\/$/, '');
                comment = comment.replace(/^\s*\*\s?/gm, '');
                return comment.trim();
            }
        } catch (error) {
            console.error(`Error reading module description from ${filePath}:`, error);
        }
        
        return undefined;
    }

    private getMethodDocumentation(filePath: string, methodName: string): string | undefined {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Look for the method and its JSDoc comment
            for (let i = 0; i < lines.length; i++) {
                const methodPattern = new RegExp(`${methodName}\\s*:\\s*function`);
                if (methodPattern.test(lines[i])) {
                    // Look backwards for a JSDoc comment
                    let j = i - 1;
                    let commentLines: string[] = [];
                    let inComment = false;
                    
                    while (j >= 0) {
                        const line = lines[j].trim();
                        if (line.endsWith('*/')) {
                            inComment = true;
                            commentLines.unshift(line);
                        } else if (inComment) {
                            commentLines.unshift(line);
                            if (line.startsWith('/**')) {
                                // Found the start of the comment
                                break;
                            }
                        } else if (!line || line.startsWith('//')) {
                            // Skip empty lines and single-line comments
                            j--;
                            continue;
                        } else {
                            // Non-comment line, stop searching
                            break;
                        }
                        j--;
                    }
                    
                    if (commentLines.length > 0) {
                        let comment = commentLines.join('\n');
                        comment = comment.replace(/^\/\*\*/, '').replace(/\*\/$/, '');
                        comment = comment.replace(/^\s*\*\s?/gm, '');
                        return comment.trim();
                    }
                }
            }
        } catch (error) {
            console.error(`Error reading method documentation from ${filePath}:`, error);
        }
        
        return undefined;
    }
}