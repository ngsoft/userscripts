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



    const{gmStore} = gmData;
    let st = new gmStore();
    console.debug(st);

    /*
    let loader = new gmLoader();




    loader.require(
            "https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js",
            "https://cdn.jsdelivr.net/npm/plyr@latest/dist/plyr.css",
            "https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1.2/dist/altvideo.css",
            "https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js",
            "https://cdn.jsdelivr.net/npm/plyr@latest/dist/plyr.min.js"
            )
            .then(e => {
                console.debug(e);
            })
            .catch(e => {
                console.error(e);
            });


 console.debug(loader);


*/


    /*  NodeFinder.find('video, video source, video track', video => {
     console.debug(video);
     });*/


})(document);