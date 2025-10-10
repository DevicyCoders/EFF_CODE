import * as vscode from 'vscode';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    }

    public show() {
        this.statusBarItem.show();
    }

    public hide() {
        this.statusBarItem.hide();
    }

    public updateText(text: string) {
        this.statusBarItem.text = text;
    }

    public get disposable() {
        return this.statusBarItem;
    }
}