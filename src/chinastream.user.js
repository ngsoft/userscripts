// ==UserScript==
// @version      1.0
// @name         China Stream
// @description  FIX Stream + download stream (FFMPEG)
// @namespace    https://github.com/ngsoft/userscripts
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @run-at      document-body
//
// @include     /^https?:\/\/(\w+\.)?(duboku|dboku|fanstui|newsinportal|jhooslea)\.\w+\//
// @icon        https://cdn.jsdelivr.net/gh/ngsoft/userscripts/dist/altvideo.png
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    let provider, video = false;
    if (/(duboku|dboku|fanstui|newsinportal|jhooslea)/.test(location.host)) provider = "duboku";
    else if (/zhuijukan/.test(location.host)) provider = "zhuijukan";
    else if (/16ys/.test(location.host)) provider = "16ys";
    else if (/(5nj|cechi8)/.test(location.host)) provider = "5nj";

    const rload = new rloader(UUID, week);

    //clear cache on upgrade
    (() => {
        let last = localStorage.getItem(UUID);
        if (last !== GMinfo.script.version) rload.clear();
        localStorage.setItem(UUID, GMinfo.script.version);
    })();

    class Assets {

        static load(){
            if (this.loading === true) return;
            if (this.loaded !== true) {
                this.loading = true;
                const self = this;

                [
                    "https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js",
                    "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.css",
                    // "https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1.2/dist/altvideo.css",
                    "https://cdn.jsdelivr.net/npm/hls.js@0.14.12/dist/hls.min.js",
                    "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.min.js"
                ].forEach(params => {
                    rload.require(params);
                });

                new Timer(timer => {
                    if (typeof Hls === f && typeof Plyr === f) {
                        timer.stop();
                        self.loaded = true;
                        Events(doc.body).trigger('assetsloaded');
                    }
                });




            } else Events(doc.body).trigger('assetsloaded');
        }



        constructor(callback){
            if (typeof callback === f) Events(doc.body).one('assetsloaded', callback);
            Assets.load();

        }

    }

    class Video {
        
        applyStyles(){
            addstyle(`
                .cvideo-container{width: 100%; heigth:100%; position: relative;}
                .cvideo-container > video.cvideo{width: 100%; heigth:100%; position: absolute;}
                
            `);
        }

        get ishls(){
            if (this.__src instanceof URL) return /m3u8/.test(this.__src.pathname);
            return false;
        }
        get src(){

            if (this.__src instanceof URL) return this.__src.href;
            return undef;
            
        }
        set src(src){
            if(typeof src === s && (src = getURL(src))){
                this.__src = new URL(src);
            }
        }

        constructor(url, target){
            this.__src = this.hls = null;
            target = (target instanceof Element) ? target : doc.body;
            const self = this;
            this.root = html2element('<div class="cvideo-container paused" id="cvideo"/>');
            this.video = html2element('<video preload="none" controls tabindex="-1" src="" class="cvideo" data-src=""></video>');
            this.target = target;
            new Events(this.video, this);
            if (typeof url === s) this.src = url;
            if (typeof this.src === s) {
                this.video.data('src', this.src);
                this.video.src = this.src;
            }
            new Assets(body => {
                self.start();
            });
        }
        start(ready = true){
            if (this.started !== true) {
                // const self = this;
                this.applyStyles();
                this.root.appendChild(this.video);

                for (let i = 0; i < this.target.children.length; ++i) {
                    let c = this.target.children[i];
                    this.target.removeChild(c);
                }
                this.target.appendChild(this.root);
                if (this.ishls === true) {
                    let hls = this.hls = new Hls();
                    this.ready(e => {
                        hls.on(Hls.Events.MEDIA_ATTACHED, e => {
                            hls.loadSource(this.src);

                        });
                        hls.attachMedia(this.video);

                        //  console.debug(self);
                    });
                    /*hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
                     //self.resize();
                     if (self.settings.get('autoplay') === true) self.video.play();
                     });*/

                }
                this.on('play pause', e => {
                    this.root.classList.remove('paused');
                    if (e.type === "pause") this.root.classList.add('paused');
                });
                this.started = true;
            }
            if (ready === true) this.trigger("started");

        }
        ready(callback){
            if (typeof callback === f) this.one('started', callback);
            if (this.started === true) this.trigger('started');
        }
    }


    class Player extends Video {
        applyStyles(){
            super.applyStyles();

        }

        start(){
            if (this.started === true) return;
            super.start(false);
            const plyropts = {
                captions: {
                    active: true,
                    language: 'und',
                    update: true
                },
                settings: ['captions', 'quality'],
                keyboard: {
                    focused: true,
                    global: true
                },
                invertTime: false,
                controls: [
                    'play', // Play/pause playback
                    'progress', // The progress bar and scrubber for playback and buffering
                    'current-time', // The current time of playback
                    'duration', // The full duration of the media
                    'mute', // Toggle mute
                    'volume', // Volume control
                    'captions', // Toggle captions
                    'settings', // Settings menu
                    'fullscreen', // Toggle fullscreen
                ]
            };

            this.plyr = new Plyr(this.video, plyropts);
            this.plyr.on('ready', e => {
                this.trigger("started");
            });

        }

    }

    class ToolBar {

        constructor(videoplayer){
            if (videoplayer instanceof Video) {
                this.player = videoplayer;
                this.root = html2element('<div class="cvideo-toolbar" />');
                this.buttons = {

                };











            }
        }


    }


    if (provider === "duboku" && /videojs\.html/.test(location.pathname)) {
        const MacPlayer = parent.MacPlayer;
        if (typeof MacPlayer === o && typeof MacPlayer.PlayUrl === s) {
            const player = new Player(MacPlayer.PlayUrl);

            console.debug(player, MacPlayer);

        }
        


    }














})(document);