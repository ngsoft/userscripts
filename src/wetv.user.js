// ==UserScript==
// @version     1.0
// @name        WETV Video Player
// @description Video Player modificatons
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.8/dist/gmutils.min.js
// @grant       none
// @noframes
//
// @include     /^https?:\/\/(www\.)?wetv.\w+\//
// @icon        https://v.qq.com/favicon.ico
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */


    class SubtitleDownloader {
        
        get drama(){

            let el = doc.querySelector('.cover_title');
            if (el instanceof Element) {
                return sanitizeFileName(el.innerText.trim(), " ");
            }
            return null;

        }

        get episode(){
            let el = doc.querySelector('.video_episode_box a.video_current span');
            if (el instanceof Element) {
                let num = el.innerText.trim(), matches;
                if (/^[0-9]+$/.test(num)) {
                    return `.E${num}`;
                }
            }
            return "";
        }

        get src(){
            let el = doc.querySelector(`video txptrack[label="English"]`);
            if (el instanceof Element) {
                return el.getAttribute('src');
            }
            return null;
        }
        
        get filename(){
            const self = this;
            let filename = self.drama;
            if ((typeof self.drama === s) && (typeof self.episode === s)) {
                filename += self.episode;
                filename += ".srt";
            }
            return filename;
        }


        getsubs(src, filename){
            if ((typeof src === s) && (typeof filename === s)) {
                fetch(src, {cache: "no-store", redirect: 'follow'})
                        .then(r => {
                            if (r.status === 200) return r.text();
                            throw new Error("Cannot Fetch " + src);
                        })
                        .then(text => {
                            if (text.length > 0) Text2File(text, filename);
                        })
                        .catch(ex => console.warn(ex));
            } else throw new Error("Cannot download subtitles");
        }
        
        

        constructor(nextelement){

            if (!(nextelement instanceof Element) || (nextelement.parentElement === null)) {
                throw new Error("Invalid Control");
            }
            const self = this, btn = html2element(`<txpdiv class="txp_btn txp_btn_definition userscript_dlbtn"><txpdiv class="txp_label">SRT</txpdiv></txpdiv>`);

            Events(btn).on('click', (e) => {
                e.preventDefault();
                if ((self.filename !== null) && (self.src !== null)) {
                    self.getsubs(self.src, self.filename);
                }
            });

            nextelement.parentElement.insertBefore(btn, nextelement);
            console.debug(scriptname, "started.");
        }
    }

    
    class WETVCustomPlayer {

        static get hasVideo(){
            return doc.querySelector(`.txp_player video[id]`) !== null;
        }
        
        static get player(){
            return doc.querySelector('.txp_player');
        }

        static applyStyles(){
            if (this.styles === true) return;
            this.styles = true;
            addstyle(`
                .txp_player .txp-watermark, .txp_player > button {display: none !important;}
            `);
        }
  
        
        
        static applyEvents(){
            if (this.events !== true) {
                this.events = true;

                const codes = {
                    32: 'video_playpause',
                    13: 'video_fullscreen',
                    78: 'video_next',
                    80: 'video_prev'

                };
                Events(doc.body).on('keydown keyup', (e) => {
                    let prevent = true, player = WETVCustomPlayer.player;
                    if ((e.target.closest('input') !== null) || (player === null) || (WETVCustomPlayer.hasVideo === false)) return;
                    let key = e.keyCode;
                    if(typeof codes[key] === s){
                        e.preventDefault();
                        if (e.type === "keyup") trigger(player, codes[key]);
                    }
                });



            }
        }


        get EpisodeList(){
            return doc.querySelectorAll(`.video_episode_box > a`);
        }

        get CurrentEpisodeIndex(){
            let index = -1;
            this.EpisodeList.forEach((a, i) => {
                if (a.classList.contains('video_current')) index = i;
            });
            return index;
        }

        constructor(txp_player){

            if (!(txp_player instanceof Element)) throw new Error('Invalid Player.');

            Object.assign(this, {
                player: txp_player,
                video: txp_player.querySelector('video[id]'),
                events: {
                    video_playpause(e){
                        if (self.video.paused === true) self.video.play();
                        else self.video.pause();
                    },
                    video_prev(e){
                        let ci = this.CurrentEpisodeIndex, list = this.EpisodeList, prev = ci - 1;

                        if ((prev >= 0) && (typeof list[prev] !== u)) {
                            list[prev].dispatchEvent( new MouseEvent('click', {bubbles: true, cancelable: true})  );
                        }

                    },
                    video_next(e){
                        let ci = this.CurrentEpisodeIndex, list = this.EpisodeList, next = ci + 1;
                        if ((next >= 0) && (typeof list[next] !== u)) {
                            list[next].dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
                        }

                    },
                    video_fullscreen(e){
                        let btn = doc.querySelector('.txp_btn_fullscreen');
                        if (btn !== null) btn.dispatchEvent(new MouseEvent('click'));
                    }
                }
            });
            const self = this;
            new Events(self.player, self);

            Object.keys(self.events).forEach((type) => {
                self.on(type, self.events[type]);
            });

            WETVCustomPlayer.applyEvents();
            WETVCustomPlayer.applyStyles();


            /* Object.defineProperty(txp_player, 'CustomPlayer', {
                value: self, configurable: true
            });*/







        }




    }

    find({
        selector: `.txp_right_controls .txp_btn[data-role*="txp-ui-control-subtitle-btn"]`,
        timeout: 0,
        interval: 100,
        onload(el){
            new SubtitleDownloader(el);
        }

    });

    find({
        selector: `.txp_player video[id]`,
        timeout: 0,
        interval: 100,
        onload(el){
            let player = el.closest('.txp_player');
            if (player !== null) new WETVCustomPlayer(player);
        }

    });


})(document);