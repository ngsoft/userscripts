// ==UserScript==
// @version      1.0
// @name         China Stream
// @description  FIX Stream + download stream (FFMPEG)
// @namespace    https://github.com/ngsoft/userscripts
// @author       daedelus
// @require      https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @run-at       document-body
// @include      /^https?:\/\/(\w+\.)?(duboku|dboku|fanstui|newsinportal|jhooslea)\.\w+\//
// @icon         https://cdn.jsdelivr.net/gh/ngsoft/userscripts/dist/altvideo.png
// @defaulticon  data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpFOUY5MTVCMUMwMjlFMzExQTIzMENGMDZEN0ZFMENDRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozRENEQTcwMzI5QzIxMUUzOTNGRUI5Mzg0NzgxNUVEMiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozRENEQTcwMjI5QzIxMUUzOTNGRUI5Mzg0NzgxNUVEMiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkVERjkxNUIxQzAyOUUzMTFBMjMwQ0YwNkQ3RkUwQ0NGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkU5RjkxNUIxQzAyOUUzMTFBMjMwQ0YwNkQ3RkUwQ0NGIi8+IDwvcmRmOkRlc2NyaXB0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
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


    /**
     * MDL Parser
     */
    class MyDramaList {

        static get cors(){
            return "https://cors-anywhere.herokuapp.com/";
        }
        static get endpoint(){
            return "/search?adv=titles&so=newest";
        }
        static get base(){
            return "https://mydramalist.com";
        }


        static search(query, callback){

            if (typeof query === s && typeof callback === f) {

                let url = new URL(this.base + this.endpoint);
                url.searchParams.set("q", query);

                const results = [];
                fetch(this.cors + url.href).then(r => {
                    if (r.status === 200) return r.text();
                }).then(text => html2doc(text)).then(page => page.querySelectorAll('[id*="mdl-"].box')).then(list => {
                    list.forEach(node => {
                        results.push(new MyDramaList(node));
                    });
                    callback(results);
                }).catch(console.warn);
            }
        }

        constructor(node){
            Object.assign(this, {
                title: "",
                id: 0,
                url: "",
                description: "",
                type: "",
                year: 0,
                cover: ""
            });

            if (node instanceof HTMLElement) this.parse(node);
        }

        parse(node){
            if (node instanceof HTMLElement) {
                let el = node.querySelector('h6.title a'), matches;
                this.url = new URL(MyDramaList.base + el.href);
                this.title = el.innerText.trim();
                this.description = node.querySelector('p+p').innerText.trim();
                if ((matches = /(\d+)$/.exec(node.id)) !== null) {
                    this.id = matches[1];
                }
                if ((el = node.querySelector('span.text-muted')) !== null) {
                    let val = el.innerText.split('-'), type, year;
                    [type, year] = val;
                    this.type = type.trim();
                    this.year = parseInt(year.split(',').shift().trim());
                }
                this.cover = getURL(node.querySelector('img').src);
            }
        }
    }

    class Media {

        set show(show){
            if (typeof show === s) {
                this.__show = show;

            }
        }
        get show(){
            return typeof this.__show === s ? this.__show : undef;
        }

        set translation(show){
            if (typeof show === s) this.__translation = show;
        }
        get translation(){
            return typeof this.__translation === s ? this.__translation : undef;
        }
        set episode(ep){
            if (typeof ep === n) this.__episode = ep;
        }

        get episode(){
            return this.__episode;
        }

        get title(){
            let
                    title = this.translation || this.show,
                    ep = this.episode;
            if (title === undef) return undef;
            if (ep > 0) {
                if (ep < 10) ep = `0${ep}`;
                title += `.E${ep}`;
            }
            title += ".mp4";
            return title;
        }


        constructor(){
            Object.assign(this, {
                "__show": null,
                "__episode": 0,
                "__translation": null
            });
        }

    }



    class Assets {

        static load(){
            if (this.loading === true) return;
            if (this.loaded !== true) {
                this.loading = true;
                const self = this;

                [
                    "https://cdn.jsdelivr.net/npm/alertifyjs@1.13.1/build/alertify.min.js",
                    "https://cdn.jsdelivr.net/npm/alertifyjs@1.13.1/build/css/alertify.min.css",
                    "https://cdn.jsdelivr.net/npm/alertifyjs@1.13.1/build/css/themes/semantic.min.css",
                    "https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js",
                    "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.css",
                    // "https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1.2/dist/altvideo.css",
                    "https://cdn.jsdelivr.net/npm/hls.js@0.14.12/dist/hls.min.js",
                    "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.min.js",

                ].forEach(params => {
                    if (/\.js$/.test(params)) loadjs(params);
                    else loadcss(params);
                    // rload.require(params);
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
                    'fullscreen' // Toggle fullscreen
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