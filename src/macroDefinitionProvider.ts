import * as vscode from 'vscode';
import { MacroLanguageService, IMacro } from './MacroLanguageService';
import * as path from 'path';

export class MacroDefinitionProvider implements vscode.DefinitionProvider {
    constructor(private macroService: MacroLanguageService) {}

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        const standardMacroPath = this.getStandardMacroPath(document.uri);
        if (!standardMacroPath) {
            return [];
        }

        const standardMacros = await this.findMacrosInFile(word, standardMacroPath);

        if (standardMacros.length > 0) {
            return standardMacros.map(m => new vscode.Location(m.document.uri, m.range));
        }

        return [];
    }

    public getStandardMacroPath(uri: vscode.Uri): vscode.Uri | null {
        const customPath = uri.fsPath;
        const customFileName = path.basename(customPath);
    
        if (!customFileName.endsWith('Custom.txt')) {
            return null;
        }
    
        const standardFileName = customFileName.replace('Custom.txt', '.txt');
    
        const pathParts = uri.path.split('/');
        const customsIndex = pathParts.indexOf('customs');
    
        if (customsIndex === -1) {
            return null;
        }
    
        // Remove 'customs' and the customer directory
        const standardPathParts = pathParts.slice(0, customsIndex).concat(pathParts.slice(customsIndex + 2));
        
        // Replace the filename
        standardPathParts[standardPathParts.length - 1] = standardFileName;
    
        const standardUri = uri.with({ path: standardPathParts.join('/') });
    
        return standardUri;
    }

    public async findMacrosInFile(name: string, fileUri: vscode.Uri): Promise<IMacro[]> {
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const text = document.getText();
            const regex = new RegExp(`(${name})\\s\*{\\[(.*?)\\]}`, 'gs');
            const macros: IMacro[] = [];
            let match;

            while ((match = regex.exec(text)) !== null) {
                const macroName = match[1];
                if (macroName === name) {
                    const content = match[2];
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);
                    macros.push({ name: macroName, content, document, range });
                }
            }
            return macros;
        } catch (error) {
            return [];
        }
    }
}