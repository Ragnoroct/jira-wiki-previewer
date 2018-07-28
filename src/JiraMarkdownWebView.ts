'use strict';
import * as vscode from 'vscode';
import * as path from 'path'
const nonce = require('nonce')();
var request = require('request');

export default class JiraMarkdownWebView {
    public webView: vscode.WebviewPanel;

    private lastText = "";

    private jsSource: string;
    private nonceString: string;
    private _baseHost: string = "";

    readonly invisibleDelim = "\u200C";

    public constructor(webView: vscode.WebviewPanel, jsSource: string) {
        this.webView = webView;
        this.jsSource = jsSource;
        this.nonceString = nonce();
    }

    public set baseHost(value: string) { this._baseHost = value; }

    public async update() {
        let editor = vscode.window.activeTextEditor as vscode.TextEditor;
        let text = editor.document.getText();

        let selectedLineText = editor.document.lineAt(editor.selection.active.line).text;
        if (selectedLineText.replace(/\s/g, '').length !== 0) {
            let lines = text.split(/\r?\n/);
            let lineToEdit = lines[editor.selection.active.line];
            if (/^\s*{[^{}]*}\s*$/.test(lineToEdit) === false) {
                lineToEdit += " " + this.invisibleDelim;
            } else {
                lineToEdit += this.invisibleDelim;
            }
            lines[editor.selection.active.line] = lineToEdit;
            text = lines.join("\n");
        }

        if (text !== this.lastText) {
            let body = await this.convertToHtml(text);
            let html = this.getWebviewContent(body);
            this.webView.webview.html = html;
            this.webView.webview.postMessage({ command: "selectLine", linePercent: 0, textToMatch: "" });
            this.lastText = text;
        }
    }

    private getWebviewContent(body: string) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
            
                <meta http-equiv="Content-Security-Policy" 
                    content="default-src 'none'; img-src vscode-resource: https:; script-src vscode-resource:; style-src 'nonce-${this.nonceString}'">
            
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="${this.jsSource}"></script>
                <style nonce="${this.nonceString}">
                    body > * {
                        border-left: thick solid transparent;
                        padding-left: 5px;
                    }
                    .selectedLine {
                        border-left: thick solid #666666;
                    }
                    li {
                        list-style-position: inside;
                    }
                </style>
            </head>
            <body>
                ${body}
            </body>
            </html>
        `;
    }

    private convertToHtml(text: string): Promise<string> {
        if (this.baseHost === undefined) {
            vscode.window.showErrorMessage("This extension needs a base url set in configuration 'jira-wiki-preview.jiraHostUrl'");
        }
        let url = vscode.Uri.parse(path.join(this.baseHost, "rest/api/1.0/render"));
        return new Promise<string>((res, rej) => {
            request(
                {
                    url: url,
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                        "accepts": "*/*"
                    },
                    body: JSON.stringify({"rendererType":"atlassian-wiki-renderer","unrenderedMarkup": text,"issueKey":"SUPPORT-1"})
                },
                (error: any, response: any, body: any) => {
                    res(body);
                }
            );
        });
    }
}