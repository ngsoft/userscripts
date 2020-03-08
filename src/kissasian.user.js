// ==UserScript==
// @name         Kissasian 2.0
// @namespace    https://github.com/ngsoft
// @version      1.0
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
     * Some Alterations
     */
    find('[src*="firefox.png"]', (node) => {
        node.parentElement.parentElement.classList.add('hidden');
    });

    find('#divContentVideo, #my_video_1', (node) => {
        node.style.width = "854px";
        node.style.height = "552px";
    });

    find('#rightside .rightBox .barTitle', (div) => {
        let title = div.innerText;
        if(/ads/.test(title) || /Like me/.test(title)){
            div.parentElement.classList.add('hidden');
        }
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
        list = list.reverse();
        header.forEach(tr => node.appendChild(tr));
        list.forEach(tr => node.appendChild(tr));
    });
    /**
     * Same for mobile
     */
    find('.shifter-page .main ul.list', (ul) => {

        let list = Array.from(ul.querySelectorAll('li')).map((li) => {
            li.remove();
            return li;
        }).reverse();
        list.forEach(li => ul.appendChild(li));

    });

    /**
     * Hide ads and more
     */
    addstyle(`
        .hidden, .hidden *,
        .bigBarContainer + div:not(.bigBarContainer),
        [id*="ads"]:not(.bigBarContainer), [id*="ads"]:not(.bigBarContainer) *,
        [id*="Ads"], [id*="Ads"] *,[class*="Ads"], [class*="Ads"] *,
        [src*="/Ads"], [src*="/Ads"] *,
        .episodeList div:not(.arrow-general) div:not([id]),
        #subcontent > div:not([id]),
        [id*="mgi"], [style*="fixed"], [style*="fixed"] *,
        [style*="width: 610px"], [style*="width: 610px"] *
        {
            position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
            height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
            display: inline !important;z-index: -1 !important;
        }
        [class*="clear"]{ height: 0 !important;max-height: 0 !important;}
        #centerDivVideo{ margin-top: 15px;}
    `);

    console.debug(scriptname, 'started');

})(document);