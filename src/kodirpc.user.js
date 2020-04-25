// ==UserScript==
// @name         KodiRPC 2.0
// @namespace    https://github.com/ngsoft/userscripts
// @version      2.0
// @description  Sends Video Streams to Kodi
// @author       ngsoft
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.3/dist/gmutils.min.js
// 
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
//
// @grant       GM_xmlhttpRequest
//
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
//
// @compatible  firefox+tampermonkey
// @compatible  chrome+tampermonkey
//
// @icon         https://kodi.tv/favicon.ico
// @include      *
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */



    const{UserSettings, gmLoader} = gmData;
    const {uniqid, on, loadcss, loadjs, isoCode} = gmTools;

    const {gmDialog} = gmUI;





    let d = new gmDialog();
    d.body = "test";
    d.elements.buttons.confirm.disabled = true;
    d.open().then(e => {
        console.debug(e);
    });


    console.debug(d.elements.buttons.confirm.disabled, d.elements.buttons.confirm);



    /*  NodeFinder.find('video, video source, video track', video => {
     console.debug(video);
     });*/


})(document);