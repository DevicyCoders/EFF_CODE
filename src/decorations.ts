import * as vscode from 'vscode';
import { MacroLanguageService } from './MacroLanguageService';
import { MacroDefinitionProvider } from './macroDefinitionProvider';

export class DecorationManager {
    private gutterDecorationType: vscode.TextEditorDecorationType;

    constructor(extensionUri: vscode.Uri) {
        const iconUri = vscode.Uri.joinPath(extensionUri, 'media', 'icon.svg');
        this.gutterDecorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: iconUri,
            gutterIconSize: 'contain'
        });
    }

    public async updateDecorations(editor: vscode.TextEditor, macroService: MacroLanguageService, definitionProvider: MacroDefinitionProvider) {
        if (!editor || editor.document.languageId !== 'efficy-macro') {
            return;
        }

        const decorations: vscode.DecorationOptions[] = [];
        const macrosInFile = macroService.getMacrosForFile(editor.document.uri);

        for (const macro of macrosInFile) {
            const standardMacroPath = definitionProvider.getStandardMacroPath(macro.document.uri);
            if (standardMacroPath) {
                const standardMacros = await definitionProvider.findMacrosInFile(macro.name, standardMacroPath);
                if (standardMacros.length > 0) {
                    const range = macro.range;
                    const decoration = { range, hoverMessage: 'Standard macro exists' };
                    decorations.push(decoration);
                }
            }
        }
        editor.setDecorations(this.gutterDecorationType, decorations);
    }

    public get disposable() {
        return this.gutterDecorationType;
    }
}
