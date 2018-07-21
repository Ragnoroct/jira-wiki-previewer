'use strict';
import * as vscode from 'vscode';
const nonce = require('nonce')();
var request = require('request');

export default class JiraMarkdownWebView {
    public webView: vscode.WebviewPanel;

    private lastText = "";

    private jsSource: string;
    private nonceString: string;

    readonly invisibleDelim = "\u200C";

    public constructor(webView: vscode.WebviewPanel, jsSource: string) {
        this.webView = webView;
        this.jsSource = jsSource;
        this.nonceString = nonce();
    }

    public async update() {
        let editor = vscode.window.activeTextEditor as vscode.TextEditor;
        let text = editor.document.getText();

        //Insert invisible delim to mark the line
        //If if the end of the current line ends with }
        /*
            match   {{monospaced}}
            match   {quote}
                        here is quotable
                        content to be quoted
                    {quote} 
            match   {quote}here is quotable content to be quoted{quote} 
            NOTE: detect if at the end or beginning of curly quote....
        */
        let selectedLineText = editor.document.lineAt(editor.selection.active.line).text;
        if (selectedLineText.replace(/\s/g, '').length !== 0) {
            let lines = text.split(/\r?\n/);
            for (var i = 0; i < editor.document.lineCount; i++) {
                if (i === editor.selection.active.line) {
                    lines[i] += this.invisibleDelim;
                }
            }
            text = lines.join("\n");
        }

        
        // let cursorPos = this.getCursorPos(editor.selection.active, text);
        // cursorPos--;
        // text = text.substr(0, cursorPos) + this.invisibleDelim + text.substr(cursorPos); //Insert cursor marker
        // let hasUnicode = this.hasUnicode(text);
        let body = await this.convertToHtml(text);
        let html = this.getWebviewContent(body);
        // hasUnicode = this.hasUnicode(text);
        this.webView.webview.html = html;
        this.webView.webview.postMessage({ command: "selectLine", linePercent: 0, textToMatch: "" });
        this.lastText = text;
    }

    // private hasUnicode (str: string) {
    //     for (var i = 0; i < str.length; i++) {
    //         if (str.charAt(i) === this.invisibleDelim) {
    //             return i;
    //         } 
    //     }
    //     return -1;
    // }

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
        console.log("> Making api request");
        return new Promise<string>((res, rej) => {
            request(
                {
                    url: 'https://jira.atlassian.com/rest/api/1.0/render',
                    method: 'post',
                    headers: {
                        "Content-Type": "application/json",
                        "accepts": "*/*"
                    },
                    body: JSON.stringify({"rendererType":"atlassian-wiki-renderer","unrenderedMarkup": text,"issueKey":"SUPPORT-1"})
                },
                (error: any, response: any, body: any) => {
                    // console.log(response);
                    // console.log('error:', error); // Print the error if one occurred
                    // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                    // console.log('body:', body); // Print the HTML for the Google homepage.
                    res(body);
                }
            );
        });
    }

    private getCursorPos(cursorPos: vscode.Position, str: string) {
        var currentLine = 0;
        var currentChar = 0;
        var strLength = str.length;
        if (cursorPos.line === 0) {
            currentChar = 0;
        } else {
            while (true) {
                if (currentChar === strLength) {
                    break;
                }
                if (str.charAt(currentChar) === "\n") {
                    currentLine++;
                    if (currentLine === cursorPos.line) {
                        currentChar++;
                        break;
                    }
                }
                currentChar++;
            }
        }
    
        currentChar += cursorPos.character;
        return currentChar;
    }
}