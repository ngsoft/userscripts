// ==UserScript==
// @name         Kissasian 2.0
// @namespace    https://github.com/ngsoft
// @version      1.0a
// @description  Kissasian, Kissanime, Kissmanga Integration
// @author       daedelus
// 
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.1/dist/gmutils.min.js
// @noframes
// @grant none
// @run-at       document-body
//
// @icon        https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/assets/img/kissasian.ico
// @include     /^https?:\/\/(\w+\.)?kiss(asian|anime|manga)(\w+)?\.\w+\//
// ==/UserScript==

((doc, undef) => {
    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    if (doc.querySelector('.ray_id') !== null) {
        return;
    }
    if (location.pathname.indexOf('/Special/') !== -1) {
        return;
    }

    /**
     * Use search engine
     */
    const url = new URL(location.href);
    let query = url.searchParams.get('q');
    if (query !== null) {
        find('#formSearch', (form) => {
            let input = form.querySelector('#keyword'), btn = form.querySelector('#imgSearch');
            input.value = query;
            btn.click();
        });
    }

    /**
     * Hide ads and more
     */
    let css = `
        .hidden, .hidden *,
        .bigBarContainer + div:not(.bigBarContainer),
        [id*="ads"]:not(.bigBarContainer), [id*="ads"]:not(.bigBarContainer) *,
        [id*="Ads"], [id*="Ads"] *,[class*="Ads"], [class*="Ads"] *,
        [src*="/Ads"], [src*="/Ads"] *,
        .episodeList div:not(.arrow-general) div:not([id]),
        #subcontent > div:not([id])
        {
            position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
            height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
            display: inline !important;z-index: -1 !important;
        }
        [class*="clear"]{ height: 0 !important;max-height: 0 !important;}
        #centerDivVideo{ margin-top: 15px;}
    `;

    addstyle(css);


    /**
     * Some Alterations
     */
    find('[src*="firefox.png"]', (node) => {
        node.parentElement.parentElement.classList.add('hidden');
    });

    find('#divContentVideo, #my_video_1', (node) => {
        node.style.width = "854px";
        node.style.height = "552px";
    });

    /**
     * Reverse Episode List
     */
    find('.episodeList .listing', (node) => {
        let list = [], header = [];
        node.querySelectorAll('tr').forEach((tr) => {
            if (tr.querySelector('td') === null) header.push(tr);
            else list.push(tr);
            tr.remove();
        });
        console.debug(header, list);
        list = list.reverse();
        header.forEach(tr => node.appendChild(tr));
        list.forEach(tr => node.appendChild(tr));



    });


    console.debug(scriptname, 'started');






})(document);