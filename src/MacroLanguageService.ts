import * as vscode from 'vscode';

export interface IMacro {
    name: string;
    content: string;
    document: vscode.TextDocument;
    range: vscode.Range;
}

export class MacroLanguageService {
    private macroCache = new Map<string, IMacro[]>();

    constructor() {
        this.buildMacroCache();
    }

    public async buildMacroCache() {
        console.log("Building macro cache...");
        this.macroCache.clear();
        const macroFiles = await vscode.workspace.findFiles('**/efficy/macros/Macro*.txt');
        console.log(`Found ${macroFiles.length} macro files.`);
        console.log(macroFiles.map(uri => uri.fsPath));

        for (const file of macroFiles) {
            const document = await vscode.workspace.openTextDocument(file);
            const macros = this.parseMacros(document);
            console.log(`Parsed ${macros.length} macros from ${file.fsPath}`);
            for (const macro of macros) {
                if (!this.macroCache.has(macro.name)) {
                    this.macroCache.set(macro.name, []);
                }
                this.macroCache.get(macro.name)!.push(macro);
            }
        }
        console.log("Macro cache built.");
    }

    private parseMacros(document: vscode.TextDocument): IMacro[] {
        const macros: IMacro[] = [];
        const text = document.getText();
        const regex = /(\w+)\s*{\[(.*?)\]}/gs;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const name = match[1];
            const content = match[2];
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + match[0].length);
            const range = new vscode.Range(startPos, endPos);

            macros.push({ name, content, document, range });
        }

        return macros;
    }

    public getMacro(name: string): IMacro[] | undefined {
        return this.macroCache.get(name);
    }

    public getMacrosForFile(uri: vscode.Uri): IMacro[] {
        const macrosInFile: IMacro[] = [];
        for (const macros of this.macroCache.values()) {
            for (const macro of macros) {
                if (macro.document.uri.fsPath === uri.fsPath) {
                    macrosInFile.push(macro);
                }
            }
        }
        return macrosInFile;
    }
}
