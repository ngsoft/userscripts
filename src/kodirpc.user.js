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


    const {gmTimer} = gmtools;


    let timer = new gmTimer(e => {
        console.debug("callback", e);
    }, 5000);

    console.debug(timer);

    timer.start().then(e => {
        console.debug("promise", e);
    });

    let c = 0;
timer.interval = 1000;
    timer.onInterval = e => {
        console.debug(c++);
    };

    timer.timeout = 20000;
    //timer.start();

    // timer.stop();

    console.debug(timer.canstart);











    /*  NodeFinder.find('video, video source, video track', video => {
     console.debug(video);
     });*/


})(document);