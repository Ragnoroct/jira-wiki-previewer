'use strict';
import * as vscode from 'vscode';
import * as url from 'url';
const crypto = require('crypto');
var request = require('request');

export default class JiraMarkdownWebView {
    public webView: vscode.WebviewPanel;

    private lastText = "";

    private jsSource: string;
    private cssSource: string;
    private _baseHost: string = "";

    readonly invisibleDelim = "\u200C";

    public constructor(webView: vscode.WebviewPanel, jsSource: string, cssSource: string) {
        this.webView = webView;
        this.jsSource = jsSource;
        this.cssSource = cssSource;
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

        //Add nonce to inline styles

        if (text !== this.lastText) {
            let body = await this.convertToHtml(text);
            let nonceString = crypto.randomBytes(16).toString('base64');
            let html = this.getWebviewContent(body, nonceString);
            html = html.replace(/(style=".*?")/g, "");
            this.webView.webview.html = html;
            this.webView.webview.postMessage({ command: "selectLine", linePercent: 0, textToMatch: "" });
            this.lastText = text;
        }
    }

    private getWebviewContent(body: string, nonceString: string) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
            
                <meta http-equiv="Content-Security-Policy" 
                    content="default-src 'none'; img-src vscode-resource: https:; script-src vscode-resource:; style-src vscode-resource: 'nonce-${nonceString}';">
            
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="${this.jsSource}"></script>
                <link rel="stylesheet" type="text/css" href="${this.cssSource}">
            </head>
            <body>
                ${body}
            </body>
            </html>
        `;
    }

    private convertToHtml(text: string): Promise<string> {
        if (this._baseHost === undefined) {
            vscode.window.showErrorMessage("This extension needs a base url set in configuration 'jira-wiki-preview.jiraHostUrl'");
        }
        let apiUrl = vscode.Uri.parse(url.resolve(this._baseHost, "/rest/api/1.0/render"));
        return new Promise<string>((res, rej) => {
            request(
                {
                    url: apiUrl.toString(),
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                        "accepts": "*/*"
                    },
                    body: JSON.stringify({"rendererType":"atlassian-wiki-renderer","unrenderedMarkup": text,"issueKey":"SUPPORT-1"})
                },
                (error: any, response: any, body: any) => {
                    if (error) {
                        vscode.window.showErrorMessage("Invalid jiraHostUrl: " + error.message);
                        body = "<h>You need to set jira-wiki-preview.jiraHostUrl to a correct url.";
                    }
                    res(body);
                }
            );
        });
    }
}