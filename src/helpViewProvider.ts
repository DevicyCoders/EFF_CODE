import * as vscode from 'vscode';

export class HelpViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'eff-code-help';

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview();
	}

	private _getHtmlForWebview() {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="frame-src https://help.efficy.io; style-src 'unsafe-inline';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Efficy Help</title>
				<style>
					body, html, iframe {
						margin: 0;
						padding: 0;
						height: 100%;
						overflow: hidden;
					}
					iframe {
						width: 100%;
						border: none;
					}
				</style>
			</head>
			<body>
				<iframe src="https://help.efficy.io/edn/home"></iframe>
			</body>
			</html>`;
	}
}