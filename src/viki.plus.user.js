// ==UserScript==
// @name        ViKi+
// @namespace   https://github.com/ngsoft/userscripts
// @version     1.0
// @description Viki+
// @author      daedelus
// @noframes
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/gmutils.min.js
//
// @grant       none
// @include     /^https?:\/\/(www\.)?viki.com\//
// @icon        https://www.viki.com/favicon.ico
// ==/UserScript==


((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    const rload = new rloader(UUID, week);

    //clear cache on upgrade
    (() => {
        let last = localStorage.getItem(UUID);
        if (last !== GMinfo.script.version) rload.clear();
        localStorage.setItem(UUID, GMinfo.script.version);
    })();

    const resources = [
        "https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js",

    ];













})(document);