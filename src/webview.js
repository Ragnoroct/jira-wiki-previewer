function scrollToLine(linePercent) {
    let elems = document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, hr, table');
    let line = Math.ceil(elems.length * linePercent);
    console.log("line:" + line)
    if (elems.length > 0) {
        elems[line].scrollIntoView();
    }
}

function selectLine(linePercent, textToMatch) {
    let elems = document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, hr, table');
    if (elems.length > 0) {
        var count = elems.length;
        for (var i = 0; i < count; i++) {
            elems[i].classList.remove('selectedLine');
        }
    }

    var matchResult = document.evaluate(`//body/*[contains(., '\u200C')]`, document, null, XPathResult.ANY_TYPE, null );
    var match = matchResult.iterateNext();

    if (match !== null) {
        match.classList.add('selectedLine');
    }
}

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'scroll':
            scrollToLine(message.linePercent);
            break;
        case 'selectLine':
            selectLine(message.linePercent, message.textToMatch);
            break;
    }
});