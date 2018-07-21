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
            // console.log(elems[i].innerText);
        }
    }

    var matchResult = document.evaluate(`//body/*[contains(., '\u200C')]`, document, null, XPathResult.ANY_TYPE, null );
    var match = matchResult.iterateNext();

    if (match !== null) {
        match.classList.add('selectedLine');
    }
    
    // var percentages = [];
    // var nodesSnapshot = document.evaluate(`//body/*[contains(., '${textToMatch}')]`, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
    // if (nodesSnapshot.length > 1) {
    //     for (var i=0 ; i < nodesSnapshot.snapshotLength; i++) {
    //         var node = nodesSnapshot.snapshotItem(i);
    //         var elemPosPercent = node.offsetTop / document.body.scrollHeight;
    //         percentages.push(elemPosPercent);
    //     }
    
    //     var closestNodeIndex = percentages.reduce((prev, curr, currIndex) => Math.abs(curr - linePercent) < Math.abs(prev - linePercent) ? currIndex : currIndex - 1);
    //     var nodeToHighlight = nodesSnapshot.snapshotItem(closestNodeIndex);
    //     nodeToHighlight.classList.add('selectedLine');
    // } else {
    //     var line = Math.ceil(linePercent * elems.length);
    //     elems[line].classList.add('selectedLine');
    // }
}

window.addEventListener('message', event => {
    const message = event.data;
    console.log(message)
    switch (message.command) {
        case 'scroll':
            scrollToLine(message.linePercent);
            break;
        case 'selectLine':
            selectLine(message.linePercent, message.textToMatch);
            break;
    }
});