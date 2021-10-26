// ==UserScript==
// @version      2.0
// @name         MyDramaList
// @description  UI Remaster
// @author       daedelus
// @namespace    https://github.com/ngsoft/userscripts
// 
// @grant       GM_addStyle
// @run-at      document-end
// @noframes
// 
// @include     /^https?:\/\/(\w+\.)?mydramalist\.\w+\//
// @icon        https://mydramalist.com/favicon.ico
// ==/UserScript==


(function(){
    /**
     * Works best wit uBlock Origin
     */

    const visuallyHiddenStyle = `{
        position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
        height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
        display: inline !important;z-index: -1 !important;
    }`, toHide = [];


    [
        '.hidden',
        '[class*="_right_"]',
        '.nav-link[href*="/vip"]',
        '.nav-link[href*="store."]',
        '.mdl-support-goal',

    ].forEach(sel => {
        toHide.push(sel);
        toHide.push(sel + ' *');
    });


    GM_addStyle(toHide.join(", ") + visuallyHiddenStyle);

})();

