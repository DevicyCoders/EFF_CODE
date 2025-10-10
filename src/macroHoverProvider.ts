import * as vscode from 'vscode';
import { MacroLanguageService, IMacro } from './MacroLanguageService';
import * as path from 'path';
import { MacroDefinitionProvider } from './macroDefinitionProvider';

export class MacroHoverProvider implements vscode.HoverProvider {
    constructor(private macroService: MacroLanguageService) {}

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        const definitionProvider = new MacroDefinitionProvider(this.macroService);

        const customMacros = await definitionProvider.findMacrosInFile(word, document.uri);
        if (customMacros.length === 0) {
            return null;
        }
        const customMacro = customMacros[0];

        const standardMacroPath = definitionProvider.getStandardMacroPath(document.uri);
        if (!standardMacroPath) {
            return new vscode.Hover(new vscode.MarkdownString(`**${word}**\n\n*This does not appear to be a custom macro file.*`));
        }

        const standardMacros = await definitionProvider.findMacrosInFile(word, standardMacroPath);
        if (standardMacros.length === 0) {
            return new vscode.Hover(new vscode.MarkdownString(`**${word}**\n\n*Standard macro not found.*`));
        }
        const standardMacro = standardMacros[0];

        const content = new vscode.MarkdownString();
        content.appendMarkdown(`**${word}**\n\n`);
        content.appendMarkdown(`**Custom:**\n`);
        content.appendCodeblock(customMacro.content, 'efficy-macro');
        content.appendMarkdown(`\n**Standard:**\n`);
        content.appendCodeblock(standardMacro.content, 'efficy-macro');

        return new vscode.Hover(content);
    }
}