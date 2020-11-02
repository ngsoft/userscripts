// ==UserScript==
// @version     2.0
// @name        Stream Grabber 2.0
// @description Helps to download streams (videojs, jwvideo based sites)
// @author      daedelus
// @namespace   https://github.com/ngsoft/userscripts
// @icon        https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/altvideo.png
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @grant       none
// @run-at      document-body
//
// @include     /^https?:\/\/hls\.hdv\.\w+\/imdb\//
// @include     /^https?:\/\/(\w+\.)?streamtape\.\w+/(e|v)\//
// ==/UserScript==

((doc, undef) => {


    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    function loadResources(){
        if (loadResources.loading !== true) {
            loadResources.loading = true;
            [
                "https://cdn.jsdelivr.net/npm/subtitle@2.0.5/dist/subtitle.bundle.min.js",
                "https://cdn.jsdelivr.net/npm/hls.js@0.14.16/dist/hls.min.js",
                "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.min.js",
                // @link https://izitoast.marcelodolza.com/
                "https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/js/iziToast.min.js",

                "https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap-reboot.min.css",
                "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.css",
                "https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/css/iziToast.min.css"
            ].forEach(src => {
                if (/\.js$/.test(src)) loadjs(src);
                else if (/\.css$/.test(src)) loadcss(src);
            });
            addstyle(`
                .iziToast-wrapper {z-index: 2147483647 !important;}
                .iziToast-wrapper-bottomRight{top: 40% !important;bottom: auto !important;}
            `);
        }

        return new Promise(resolve => {
            new Timer(timer => {
                let
                        vars = ["Subtitle", "Hls", "Plyr", "iziToast"],
                        args = {};
                vars.forEach(name => {
                    if (typeof window[name] !== u) args[name] = window[name];
                });
                if (Object.keys(args).length === vars.length) {
                    timer.stop();
                    resolve(args);
                }
            });

        });
    }






    /**
     * Video Element Builder
     */
    class AltVideo {

        get sources(){
            if (!this.__sources) this.__sources = [];
            return this.__sources;
        }

        set sources(list){
            list = list || [];
            if (Array.isArray(list)) {
                this.__sources.forEach(source => source.remove());
                this.__sources = [];
                list.forEach(source => {
                    if (source instanceof AltVideoSource) {
                        this.__sources.push(source);
                        this.element.appendChild(source.element);
                    }
                });
            }
        }

        get captions(){
            if (!this._captions) this._captions = [];
            return this._captions;
        }

        set captions(list){
            list = list || [];

            if (Array.isArray(list)) {

                this.__captions.forEach(caption => caption.remove());
                this.__captions = [];
                list.forEach(caption => {
                    if (caption instanceof AltVideoCaption) {
                        this._captions.push(caption);
                        this.element.appendChild(caption.element);
                    }
                });
            }

        }

        get src(){
            return getURL(this.element.getAttribute('src'));
        }
        set src(src){
            if (typeof src === s) {
                if ((src = getURL(src)) && src !== location.href) this.element.setAttribute('src', src);
            }
        }

        get poster(){
            return getURL(this.element.getAttribute('poster'));
        }

        set poster(src){
            if (typeof src === s) {
                if ((src = getURL(src)) && src !== location.href) this.element.poster = src;
            }
        }


        get element(){
            return this.__element;
        }

        addSource(src, size = "default", type = "mp4"){

            if (typeof src === s) {
                let source = new altvideoSource(src, size, type, this);
                return source;
            }

        }
        addCaption(src, lang, label){
            if (typeof src === s) {
                let track = new altvideoCaption(src, lang, this);
                if (typeof lang === s) track.label = label;
                return track;
            }
        }

        playpause(){
            if (this.element.paused === true) return this.play();
            this.pause();
        }
        play(){
            if (this.element.paused === true) this.element.play();
        }
        pause(){
            if (this.element.paused === false) this.element.pause();
        }
        stop(){
            this.pause();
            this.element.currentTime = 0;
        }

        constructor(video){
            const self = this;
            this.__element = html2element(`<video controls src="" crossorigin="" preload="none" tabindex="-1" class="altvideo" />`);
            const evts = new Events(self.element, self);

            if (video instanceof Element && video.tagName === "VIDEO") {
                video.querySelectorAll('source[src]').forEach(source => {
                    let obj = self.addSource(source.src), size = source.getAttribute('size'), type = source.getAttribute('type');
                    if (typeof size === s) obj.size = size;
                    if (typeof type === s) obj.type = type;
                });
                video.querySelectorAll('track[kind="captions"][src], track[kind="subtitles"][src]').forEach(track => {
                    let obj = self.addCaption(track.src), lang = track.getAttribute('srclang'), label = track.getAttribute('label');
                    if (typeof label === s) obj.label = label;
                    if (typeof lang === s) obj.lang = lang;
                });
                if (video.querySelector('source[src]') === null) {
                    self.addSource(video.src);
                    self.sources[0].selected = true;
                }
                let poster;
                if ((poster = video.getAttribute('poster'))) self.poster = poster;
            }
        }
    }

    class AltVideoSource {

        get altvideo(){
            return this.__altvideo;
        }

        get selected(){
            return this.element.selected === true;
        }

        set selected(selected){
            this.element.selected = selected === true ? true : null;
            if (this.__altvideo instanceof AltVideo) {
                const self = this;
                this.__altvideo.sources.forEach(source => {
                    if (source !== self) source.__element.selected = null;
                });
                this.__altvideo.src = this.src;
            }
        }

        get src(){
            return getURL(this.element.getAttribute('src'));
        }
        set src(src){
            if (typeof src === s) {
                if ((src = getURL(src)) && src !== doc.location.href) this.element.setAttribute('src', src);
            }
        }
        get size(){
            return this.element.getAttribute('size');
        }
        set size(size){
            size = parseInt(size);
            if (isNaN(size)) size = "default";
            this.element.setAttribute('size', size);
        }
        get type(){
            return this.element.getAttribute('type');
        }
        set type(type){
            let supported = ["webm", "mp4", "ogg", "hls", "dash"];
            if (typeof type === s) {
                type = type.toLowerCase();
                if (/^video\//i.test(type)) {
                    this.element.setAttribute('type', type);
                } else if (supported.includes(type.toLowerCase())) {
                    this.element.setAttribute('type', 'video/' + type.toLowerCase());
                }
            }
        }
        get element(){
            return this.__element;
        }

        constructor(src, size = "default", type = "mp4", altvideo){
            this.__element = html2element(`<source src="" size="default" />`);
            if (typeof src === s && src.length > 0) this.src = src;
            this.size = size;
            this.type = type;
            if (altvideo instanceof AltVideo) {
                this.__altvideo = altvideo;
                this.altvideo.sources.push(this);
                this.altvideo.appendChild(this.element);

            }
        }
    }
    class AltVideoCaption {

        get altvideo(){
            return this.__altvideo;
        }

        get src(){
            return getURL(this.element.getAttribute('src'));
        }
        set src(src){
            if (typeof src === s) {
                if ((src = getURL(src)) && src !== doc.location.href) this.element.setAttribute('src', src);
            }
        }

        get label(){
            return this.element.getAttribute('label');
        }
        //label can be anything
        set label(label){
            if (typeof label === s && s.length > 0) {
                this.element.setAttribute('label', label);
            }
        }

        get lang(){
            return this.element.getAttribute('lang');
        }

        set lang(langcode){
            if (typeof langcode === s) {
                let entry = isoCode(langcode);
                this.label = entry.lang;
                this.element.setAttribute('srclang', entry.codes[0]);
            }
        }

        get element(){
            return this.__element;
        }
        
        loadtrack(){
            Events(this.element).on('load error', e => {
                let target = e.target, src = target.src;
                if (/^blob/.test(src)) return;
                if (target.data('loading') === true) return;
                target.data('loading', true);

                if (e.type === "error") src = "https://cors-anywhere.herokuapp.com/" + src;
                fetch(src, {cache: "default", redirect: 'follow'})
                        .then(r => {
                            if (r.status === 200) {
                                r.text().then(text => {
                                    let parsed, vtt, blob, virtualurl;
                                    if (Array.isArray(parsed = Subtitle.parse(text)) && parsed.length > 0) {
                                        vtt = Subtitle.stringifyVtt(parsed);
                                        if (typeof vtt === s && vtt.length > 0) {
                                            blob = new Blob([vtt], {type: "text/vtt"});
                                            e.target.dataset.src = e.target.src;
                                            virtualurl = URL.createObjectURL(blob);
                                            e.target.src = virtualurl;
                                            target.data('loading', null);
                                        }
                                    }
                                });
                            }
                        })
                        .catch(ex => console.error(ex));
            });
        }

        constructor(src, lang = "", altvideo){
            this.__element = html2element(`<track kind="subtitles" label="Caption" srclang="" src="" />`);
            this.loadtrack();
            if (typeof src === s && src.length > 0) this.src = src;
            this.lang = lang;
            if (altvideo instanceof AltVideo) {
                this.__altvideo = altvideo;
                this.element.id = "track" + altvideo.captions.length;
                this.altvideo.captions.push(this);
                this.altvideo.element.appendChild(this.element);
            }

        }

    }



    /*on.loaded().then(()=>{
         loadResources().then(function(exports){
            console.debug(arguments);
            const {iziToast} = exports;
            console.debug(iziToast);
            console.debug(video);
            iziToast.success({
                title: 'OK',
                message: 'Successfully inserted record!'

            });




        });
    });*/





})(document);