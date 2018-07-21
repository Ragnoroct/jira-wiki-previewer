'use strict';
import * as vscode from 'vscode';
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
                    enableScripts: true
                }
            );

            const webView = new JiraMarkdownWebView(panel);
            webView.update();

            vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
                var activeTextEditor = vscode.window.activeTextEditor;
                if (activeTextEditor !== undefined) {
                    if (e.document === activeTextEditor.document) {
                        webView.update();
                    }
                }
            });

            vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
                if (e.textEditor === vscode.window.activeTextEditor) {
                    webView.update();
                    let line = e.selections[0].start.line;
                    webView.webView.webview.postMessage({ command: "selectLine", line: line });
                }
            });

            context.subscriptions.push(
                vscode.window.onDidChangeTextEditorVisibleRanges((event: vscode.TextEditorVisibleRangesChangeEvent) => {
                    webView.webView.webview.postMessage({ command: "scroll", line: event.visibleRanges[0].start.line });
                }),
            );
        })
    );
}

// function addCount() {
//     console.log("1")
// }

// function throttle(fn, wait) {
//     var time = Date.now();
//     return function() {
//       if ((time + wait - Date.now()) < 0) {
//         fn();
//         time = Date.now();
//       }
//     }
// }

// function syncScroll() {
//     var textarea   = $('.source'),
//         lineHeight = parseFloat(textarea.css('line-height')),
//         lineNo, posTo;

//     lineNo = Math.floor(textarea.scrollTop() / lineHeight);
//     if (!scrollMap) { scrollMap = buildScrollMap(); }
//     posTo = scrollMap[lineNo];
//     $('.result-html').stop(true).animate({
//       scrollTop: posTo
//     }, 100, 'linear');
// }

  // Build offsets for each line (lines can be wrapped)
  // That's a bit dirty to process each line everytime, but ok for demo.
  // Optimizations are required only for big texts.
//   function buildScrollMap() {
//     var i, offset, nonEmptyList, pos, a, b, lineHeightMap, linesCount,
//         acc, sourceLikeDiv, textarea = $('.source'),
//         _scrollMap;

//     sourceLikeDiv = $('<div />').css({
//       position: 'absolute',
//       visibility: 'hidden',
//       height: 'auto',
//       width: textarea[0].clientWidth,
//       'font-size': textarea.css('font-size'),
//       'font-family': textarea.css('font-family'),
//       'line-height': textarea.css('line-height'),
//       'white-space': textarea.css('white-space')
//     }).appendTo('body');

//     offset = $('.result-html').scrollTop() - $('.result-html').offset().top;
//     _scrollMap = [];
//     nonEmptyList = [];
//     lineHeightMap = [];

//     acc = 0;
//     textarea.val().split('\n').forEach(function(str) {
//       var h, lh;

//       lineHeightMap.push(acc);

//       if (str.length === 0) {
//         acc++;
//         return;
//       }

//       sourceLikeDiv.text(str);
//       h = parseFloat(sourceLikeDiv.css('height'));
//       lh = parseFloat(sourceLikeDiv.css('line-height'));
//       acc += Math.round(h / lh);
//     });
//     sourceLikeDiv.remove();
//     lineHeightMap.push(acc);
//     linesCount = acc;

//     for (i = 0; i < linesCount; i++) { _scrollMap.push(-1); }

//     nonEmptyList.push(0);
//     _scrollMap[0] = 0;

//     $('.line').each(function(n, el) {
//       var $el = $(el), t = $el.data('line');
//       if (t === '') { return; }
//       t = lineHeightMap[t];
//       if (t !== 0) { nonEmptyList.push(t); }
//       _scrollMap[t] = Math.round($el.offset().top + offset);
//     });

//     nonEmptyList.push(linesCount);
//     _scrollMap[linesCount] = $('.result-html')[0].scrollHeight;

//     pos = 0;
//     for (i = 1; i < linesCount; i++) {
//       if (_scrollMap[i] !== -1) {
//         pos++;
//         continue;
//       }

//       a = nonEmptyList[pos];
//       b = nonEmptyList[pos + 1];
//       _scrollMap[i] = Math.round((_scrollMap[b] * (i - a) + _scrollMap[a] * (b - i)) / (b - a));
//     }

//     return _scrollMap;
//   }

// $('.source').on('scroll', _.debounce(syncScroll, 50, { maxWait: 50 }));

// function syncScroll() {
//     var textarea   = $('.source'),
//         lineHeight = parseFloat(textarea.css('line-height')),
//         lineNo, posTo;

//     lineNo = Math.floor(textarea.scrollTop() / lineHeight);
//     if (!scrollMap) { scrollMap = buildScrollMap(); }
//     posTo = scrollMap[lineNo];
//     $('.result-html').stop(true).animate({
//         scrollTop: posTo
//     }, 100, 'linear');
// }

// this method is called when your extension is deactivated
export function deactivate() {
}