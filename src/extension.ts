'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import JiraMarkdownWebView from './JiraMarkdownWebView';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "jira-wiki-previewer" is now active!');

    context.subscriptions.push(
        vscode.commands.registerCommand('extension.showJiraWikiPreview', () => {
            const panel = vscode.window.createWebviewPanel(
                "jira-preview",
                "Jira Preview",
                vscode.ViewColumn.Two,
                { 
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(context.extensionPath)]
                }
            );

            const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview.js'));
            const jsSrc = onDiskPath.with({ scheme: 'vscode-resource' });
            const webView = new JiraMarkdownWebView(panel, jsSrc.toString());

            let baseUrl = vscode.workspace.getConfiguration().get<string>('jira-wiki-preview.jiraHostUrl') as string;
            webView.baseHost = baseUrl;
            vscode.workspace.onDidChangeConfiguration(e => {
                let baseUrlChanged = e.affectsConfiguration('jira-wiki-preview.jiraHostUrl');
                if (baseUrlChanged === true) {
                    let baseUrl = vscode.workspace.getConfiguration().get<string>('jira-wiki-preview.jiraHostUrl') as string;
                    webView.baseHost = baseUrl;
                }
            });
            
            webView.update();

            vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
                var activeTextEditor = vscode.window.activeTextEditor;
                if (activeTextEditor !== undefined && activeTextEditor.document.languageId === "jirawiki") {
                    if (e.document === activeTextEditor.document) {
                        webView.update();
                    }
                }
            });

            vscode.window.onDidChangeTextEditorSelection((event: vscode.TextEditorSelectionChangeEvent) => {
                if (event.textEditor === vscode.window.activeTextEditor && event.textEditor.document.languageId === "jirawiki") {
                    webView.update();
                    let line = event.selections[0].start.line;
                    let linePercent = line / event.textEditor.document.lineCount;
                    let textToMatch = event.textEditor.document.lineAt(line).text.replace(/\W/g, '');
                    webView.webView.webview.postMessage({ command: "selectLine", linePercent: linePercent, textToMatch: textToMatch });
                }
            });

            context.subscriptions.push(
                vscode.window.onDidChangeTextEditorVisibleRanges((event: vscode.TextEditorVisibleRangesChangeEvent) => {
                    if (event.textEditor === vscode.window.activeTextEditor && event.textEditor.document.languageId === "jirawiki") {
                        let linePercent = event.visibleRanges[0].start.line / event.textEditor.document.lineCount;
                        webView.webView.webview.postMessage({ command: "scroll", linePercent });
                    }
                }),
            );
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}