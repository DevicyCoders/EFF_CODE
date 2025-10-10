import * as vscode from 'vscode';
import { MacroLanguageService } from './MacroLanguageService';
import * as path from 'path';
import { MacroDefinitionProvider } from './macroDefinitionProvider';
import { MacroHoverProvider } from './macroHoverProvider';
import { HelpViewProvider } from './helpViewProvider';
import { StatusBarManager } from './statusBar';
import { DecorationManager } from './decorations';
import { JScript9Parser } from './JScript9Parser';
import { JScript9DefinitionProvider } from './JScript9DefinitionProvider';
import { JScript9HoverProvider } from './JScript9HoverProvider';
import { JScript9DiagnosticProvider } from './JScript9DiagnosticProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	console.log('Congratulations, your extension "eff-code" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('eff-code.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from EFF_Code!');
	});

	context.subscriptions.push(disposable);

	const provider = new HelpViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(HelpViewProvider.viewType, provider));

	const macroService = new MacroLanguageService();
	const definitionProvider = new MacroDefinitionProvider(macroService);

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ language: 'efficy-macro', scheme: 'file' },
			definitionProvider
		)
	);
	
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ language: 'efficy-macro', scheme: 'file' },
			new MacroHoverProvider(macroService)
		)
	);

	const statusBar = new StatusBarManager();
    context.subscriptions.push(statusBar.disposable);

	const decorationManager = new DecorationManager(context.extensionUri);
    context.subscriptions.push(decorationManager.disposable);

	// Initialize JScript9 support
	const customBasePath = vscode.workspace.getConfiguration('jscript9').get<string>('customBasePath') 
		|| '/mnt/c/inetpub/wwwroot/12.0/customs/fidal-gh/efficy/serverjs';
	
	const jscript9Parser = new JScript9Parser(customBasePath);
	const jscript9DefinitionProvider = new JScript9DefinitionProvider(jscript9Parser);
	const jscript9HoverProvider = new JScript9HoverProvider(jscript9Parser);
	const jscript9DiagnosticProvider = new JScript9DiagnosticProvider(jscript9Parser);

	// Register JScript9 providers for .js files
	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			[{ language: 'javascript', scheme: 'file' }, { language: 'jscript9', scheme: 'file' }],
			jscript9DefinitionProvider
		)
	);

	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			[{ language: 'javascript', scheme: 'file' }, { language: 'jscript9', scheme: 'file' }],
			jscript9HoverProvider
		)
	);

	// Update diagnostics on file change
	const updateJScript9Diagnostics = (document: vscode.TextDocument) => {
		if (document.fileName.endsWith('.js') || document.languageId === 'jscript9') {
			jscript9DiagnosticProvider.updateDiagnostics(document);
		}
	};

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			updateJScript9Diagnostics(event.document);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(document => {
			updateJScript9Diagnostics(document);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(document => {
			jscript9DiagnosticProvider.clearDiagnostics(document);
		})
	);

	// Update diagnostics for all open documents
	vscode.workspace.textDocuments.forEach(document => {
		updateJScript9Diagnostics(document);
	});

	context.subscriptions.push(jscript9DiagnosticProvider);

	let activeEditor = vscode.window.activeTextEditor;

	function updateAll() {
		if (activeEditor && activeEditor.document.languageId === 'efficy-macro') {
			statusBar.updateText(`$(check) Efficy Macros Active`);
			statusBar.show();
			decorationManager.updateDecorations(activeEditor, macroService, definitionProvider);
		} else {
			statusBar.hide();
		}
	}

    if (activeEditor) {
        updateAll();
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
			activeEditor = editor;
			updateAll();
        })
    );

	context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (activeEditor && event.document === activeEditor.document) {
                updateAll();
            }
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}






