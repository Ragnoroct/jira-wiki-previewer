'use strict';
import * as vscode from 'vscode';
// import { resolve } from 'url';
// var fetch = require('unfetch');
var request = require('request');

export default class JiraMarkdownWebView {
    public webView: vscode.WebviewPanel;

    private lastText = "";

    public constructor(webView: vscode.WebviewPanel) {
        this.webView = webView;
    }

    public async update() {
        let editor = vscode.window.activeTextEditor as vscode.TextEditor;
        let text = editor.document.getText();
        if (this.lastText !== text) {
            let html = await this.convertToHtml(text);
            this.webView.webview.html = html;
            this.lastText = text;
        }
    }

    readonly extraHtml = `<script>
        function scrollToLine(line) {
            let elems = document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, hr, table');
            if (elems.length > 0) {
                elems[line].scrollIntoView();
                // $(body).stop();
                // $(body).animate({ scrollTop: elems[line].offsetTop, queue: false });
            }
        }

        function selectLine(line) {
            let elems = document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, hr, table');
            if (elems.length > 0) {
                var count = elems.length;
                for (var i = 0; i < count; i++) {
                    if (i === line) {
                        elems[i].classList.add('selectedLine');
                    } else {
                        elems[i].classList.remove('selectedLine');
                    }
                }
            }
        }
    
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'scroll':
                    scrollToLine(message.line);
                    break;
                case 'selectLine':
                    selectLine(message.line);
                    break;
            }
        });
    </script>
    <style>
        .selectedLine {
            border-left: thick solid #666666;
        }
    </style>
    `;

    private convertToHtml(text: string): Promise<string> {
        console.log("> Making api request");
        var requestPromise = new Promise<string>((res, rej) => {
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
                    body += this.extraHtml;
                    res(body);
                }
            );
        });
        // var requestPromise = new Promise<string>((resolve, rej) => {
        //     var html = text.split("\n").map(line => { return "<p>" + line + "</p>"; }).join("");
        //     html += this.javascript;
        //     resolve(html);
        // });

        return requestPromise;
    }
}