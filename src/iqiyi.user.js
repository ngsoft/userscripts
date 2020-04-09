// ==UserScript==
// @version     1.0
// @name        iQiyi Video Player
// @description Video Player modificatons
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.1/dist/gmutils.min.js
// @grant       none
// @noframes
//
// @include     /^https?:\/\/(www\.)?iqiyi.com\/intl\/play\//
// @icon        https://www.iqiyipic.com/common/images/logo.ico
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */


    function setVideoSize(){
        let video = doc.querySelector('video');
        if (video instanceof Element) {
            let width = video.offsetWidth, player = doc.querySelector('.iqp-player');
            player.classList.remove('video-m', 'video-l', 'video-xl');
            if (width > 1900) player.classList.add('video-xl');
            else if (width > 1100) player.classList.add('video-l');
            else if (width > 615) player.classList.add('video-m');

        }
    }
    
    let style = `
        video{object-fit: cover;}
        .iqp-logo-box{display: none;}
        .iqp-subtitle{
            bottom: 10% !important; text-shadow: 5px 5px 5px #000 !important;
            min-width: 60% !important; background: rgba(0,0,0,.55) !important;
            padding: 2% 0 !important;text-align: center !important;font-size: 16px !important;
        }
        .video-m .iqp-subtitle{font-size: 24px !important;}
        .video-l .iqp-subtitle{font-size: 28px !important;}
        .video-xl .iqp-subtitle{font-size: 40px !important;}
    `;






    addEventListener('resize', setVideoSize);

    find('video', (video, obs) => {
        obs.stop();
        setVideoSize();
        addstyle(style);
        console.debug(scriptname, "started.");
    });


})(document);