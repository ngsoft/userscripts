// ==UserScript==
// @version     3.0
// @name        ViKi+
// @description Download Subtitles on Viki
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @grant       none
// @noframes
//
// @include     /^https?:\/\/(www\.)?viki.com\//
// @icon        https://www.viki.com/favicon.ico
// ==/UserScript==


((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    ["pushState", "replaceState"].forEach(fn => {
        history[fn] = (function(){
            let orig = history[fn];
            return function(){

                Events(doc).trigger(UUID + '.pagechange', {
                    mode: fn,
                    args: Array.from(arguments)
                });
                return orig.call(history, ...arguments);
            };
        })();
    });

    history.replaceState = (function(){
        const old = history.replaceState;
        return function(state, title, url){
            trigger(doc.body, UUID + '.replacestate', {
                state: state,
                title: title,
                url: url
            });
            return old.call(history, state, title, url);
        };
    })();

    let oldversion = localStorage.getItem(UUID + ":version");

    if (oldversion !== GMinfo.script.version) {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem(UUID + ":version", GMinfo.script.version);

    }


    let newsession = sessionStorage.getItem(UUID + ":session") === null;
    sessionStorage.setItem(UUID + ":session", +new Date());


    class Settings {
        static get prefix(){
            return UUID + ":";
        }
        static get store(){
            if (typeof this.__store__ === u) {
                const defaults = {
                    locale: ""
                };
                const store = this.__store__ = new xStore(localStorage);
                Object.keys(defaults).forEach(k => {
                    let key = this.prefix + k;
                    if (typeof store.get(key) !== typeof defaults[k]) store.set(key, defaults[k]);
                });
            }
            return this.__store__;
        }
        static get locale(){
            return this.store.get(this.prefix + "locale") || "";
        }
        static set locale(locale){
            if (typeof locale === s) this.store.set(this.prefix + "locale", locale);
        }

    }


    class LocaleSelector extends gmDialog {

        static replaceLocale(locale){
            let url = new URL(location.href);
            url.searchParams.set('locale', locale);
            location.replace(url.href);
        }

        static getLocales(){
            return new Promise(resolve => {
                let list = [];
                if (typeof document.documentElement.lang === s && document.documentElement.lang.length > 0) list.push(document.documentElement.lang);
                doc.querySelectorAll('link[hreflang]').forEach(el => {
                    let u = new URL(el.href);
                    list.push(u.searchParams.get('locale'));
                });
                if (list.length > 1) resolve(list);
            });
        }
        constructor(locales){
            super(doc.body, {
                buttons: {
                    yes: "Save",
                    no: "Cancel"
                },
                events: {},
                title: GMinfo.script.name + " | Select Locale"
            });
            this.body = `<form class="VikiPlus-Settings">
                                <ul class="gm-list"></ul>
                        </form>`;
            this.form = this.elements.body.querySelector('form');
            this.list = this.form.querySelector('ul.gm-list');

            locales.forEach(locale => {

                let lang = isoCode(locale).lang.split(';')[0].split(',')[0].trim();

                if (locale === "zt") lang = "繁體中文";
                else if (locale === "zh") lang = "简体中文";
                else if (locale === "ja") lang = "日本語";
                else if (locale === "ko") lang = "한국어";
                let li = html2element(`<li>
                                        <span class="switch-rounded-sm">
                                            <input type="checkbox" name="locale_${locale}" data-locale="${locale}" />
                                            <span class="slider"></span>
                                        </span>
                                        <span class="gm-label">${lang}</span>
                                    </li>`);
                this.list.appendChild(li);
            });
            
            Events(this.form)
                    .on('change submit', e => {
                        if (e.type === "submit") {
                            e.preventDefault();
                            return;
                        }
                        let target = e.target.closest('[type="checkbox"]');
                        if (target instanceof Element) {
                            for (let i = 0; i < this.form.elements.length; i++) {
                                this.form.elements[i].checked = null;
                            }
                            target.checked = true;
                            // this.locale = target.data('locale');

                        }
                    })
                    .on('click', e => {
                        if (e.target.closest('[type="checkbox"]') !== null) return;
                        let target = e.target.closest('.gm-list li');
                        if (target instanceof Element) {
                            let ck = target.querySelector('[type="checkbox"]');
                            if (ck instanceof Element) Events(ck).trigger('change');
                        }

                    });
            this
                    .on('confirm', () => {
                        let selected, el;
                        for (let i = 0; i < this.form.elements.length; i++) {
                            el = this.form.elements[i];
                            if (el.checked === true) {
                                selected = el;
                                break;
                            }
                        }
                        if (selected instanceof Element) {
                            Settings.locale = this.locale = selected.data('locale');
                        }


                    })
                    .on('open', () => {
                        let
                                current = Settings.locale.length > 0 ? Settings.locale : "en",
                                ck = this.form.querySelector(`[type="checkbox"][data-locale="${current}"]`);
                        if (ck instanceof Element) {
                            Events(ck).trigger('change');
                        }
                    })
                    .on('hide', () => {
                        if (this.locale) LocaleSelector.replaceLocale(this.locale);
                    });

        }
    }


    function loadResources(){
        if (loadResources.loading !== true) {
            loadResources.loading = true;
            [
                "https://cdn.jsdelivr.net/npm/subtitle@2.0.5/dist/subtitle.bundle.min.js",
                "https://cdn.jsdelivr.net/npm/hls.js@0.14.16/dist/hls.min.js",
                "https://cdn.dashjs.org/latest/dash.all.min.js",
                "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.min.js",

                "https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.css"
            ].forEach(src => {
                if (/\.js$/.test(src)) loadjs(src);
                else if (/\.css$/.test(src)) loadcss(src);
            });
            addstyle(`
                .plyr video{object-fit: fill;}
                .video-player-container{position: absolute;top: 0;right: 0;left: 0;bottom: 0;}
                .video-player-title{
                    position: absolute; top: 0 ; left: 0 ; right: 0;
                    text-align: center; padding: 16px 8px;z-index: 9999;
                    text-align: center;font-size: 24px; color:#FFF;line-height: 1.5;
                    background-color: rgba(0, 0, 0, 0.45);text-decoration: none;cursor: pointer;
                }
                .video-player-title *:hover{filter: drop-shadow(4px 4px 4px #fff);}
                .plyr__caption{
                    -webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;
                     font-weight: 600; text-shadow: 5px 5px 5px #000; min-width: 90%; display: inline-block;
                     background: rgba(0,0,0,.25);transform: translate(0, -60px);font-size: 24px;
                }
                .plyr--captions-enabled video::cue{
                    color: rgba(255,255,255,0); background-color: rgba(255,255,255,0);
                    display: none; text-shadow: none;
                }
                @media (min-width: 768px) {
                    .video-player-container  .plyr__caption{font-size: 32px;}
                }
                @media (min-width: 992px) {
                    .video-player-container  .plyr__caption{font-size: 40px;}
                }
                .hidden, .hidden *, [hidden], [hidden] *{
                    position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                    height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                    display: inline !important;z-index: -1 !important;
                }
            `);

        }

        return new Promise(resolve => {
            new Timer(timer => {
                let
                        vars = ["Subtitle", "Hls", "Plyr", "dashjs"],
                        args = {};
                vars.forEach(name => {
                    if (typeof self[name] !== u) args[name] = self[name];
                });
                if (Object.keys(args).length === vars.length) {
                    timer.stop();
                    resolve(args);
                }
            });

        });
    }


    class VideoPlayer {

        constructor(api, videoid){

            if (!(api instanceof VikiAPI)) throw new Error('Invalid argument api');

            if (typeof videoid !== s) throw new Error('Invalid argument videoid');
            this.api = api;

            const that = this;
            this.sources = [];
            this.quality = {};
            this.tracks = [];

            let size = 540;
            let video = this.video = html2element(`<video controls src="" crossorigin="" preload="none" tabindex="-1" class="altvideo"/>`);
            let root = this.root = html2element('<div class="video-player-container"/>');
            let toolbar = this.toolbar = html2element('<div class="video-player-title"/>');

            this.buttons = {
                nextvideo: html2element(`<button class="plyr__controls__item plyr__control next-video" type="button">
                                            <svg aria-hidden="true" focusable="false"><use xlink:href="#plyr-fast-forward"></use></svg>
                                            <span class="label--not-pressed plyr__tooltip">Next Video</span>
                                            <span class="label--pressed plyr__tooltip">Next Video</span>
                                        </button>`),
                download: html2element(`<button class="plyr__controls__item plyr__control download-subtitles" type="button">
                                            <svg aria-hidden="true" focusable="false"><use xlink:href="#plyr-download"></use></svg>
                                            <span class="label--not-pressed plyr__tooltip">Download</span>
                                            <span class="label--pressed plyr__tooltip">Download</span>
                                        </button>`)
            };
            this.root.appendChild(video);
            (new Events(video, this));



            Events(root).on('click', e => {

                if (e.target.closest('button.download-subtitles') !== null) {
                    e.preventDefault();
                    this.trigger('download');
                    //e.stopImmediatePropagation();
                } else if (e.target.closest('button.next-video') !== null) {
                    e.preventDefault();
                    this.trigger('next');
                    //e.stopImmediatePropagation();
                }


            });
            
            this.loaded(() => {
                const options = this.options = {
                    title: video.data('title'),
                    captions: {active: false, language: 'auto', update: true},
                    settings: ['captions', 'quality'],
                    keyboard: {focused: true, global: true},
                    quality: {
                        default: null,
                        // The options to display in the UI, if available for the source media
                        options: Object.keys(this.quality).sort().reverse(),
                        forced: true,
                        onChange: x => x
                    },
                    tooltips: {
                        controls: true,
                        seek: true
                    },
                    controls: [
                        'play-large',
                        // 'restart',
                        // 'rewind',
                        'play',
                        // 'fast-forward',
                        'progress',
                        'current-time',
                        'duration',
                        'mute',
                        'volume',
                        'captions',
                        'settings',
                        //'pip',
                        //'airplay',
                        //'download',
                        'fullscreen'
                    ],
                    listeners: {

                        quality(e){

                            let
                                    target = e.target.closest('button'),
                                    evt = new Event('qualitychange', {
                                        bubbles: true,
                                        cancelable: true
                                    });
                            evt.detail = {
                                quality: target.value,
                                plyr: that.plyr
                            };
                            that.video.dispatchEvent(evt);


                            console.debug(target.siblings('button'));

                            return false;
                        }
                    }

                };


                NodeFinder.find('video:not(.altvideo)', v => {
                    v.pause();
                    v.remove();
                });

                if(window.player && window.player.videoElement){
                    let v = window.player.videoElement;
                    v.pause();
                    v.remove();
                }
                loadResources().then(exports => {
                    const{Subtitle, Hls, Plyr, dashjs} = exports;

                    const container = doc.querySelector('#__next >.page-wrapper');

                    container.innerHTML = "";
                    container.appendChild(this.root);


                    const plyr = this.plyr = new Plyr(video, options);

                    this
                            .on('qualitychange', e => {
                                console.debug(e.detail);
                                let {quality} = e.detail,
                                ct = plyr.currentTime;

                                if (typeof quality !== s) return;

                                localStorage.videoquality = quality;
                                let source = that.quality[quality];

                                if (that.player) {
                                    that.player.destroy();
                                    that.player = null;
                                }
                                if (/dash/.test(source.type)) {

                                    let player = that.player = dashjs.MediaPlayer().create();
                                    player.destroy = function(){
                                        return player.reset();
                                    };
                                    player.initialize();
                                    player.on(dashjs.MediaPlayer.events.CAN_PLAY, function(){
                                        that.trigger('languagechange');
                                    });
                                    player.setAutoPlay(true);
                                    player.attachView(video);
                                    player.attachSource(source.src);
                                    if (isPlainObject(this.drm)) {
                                        player.setProtectionData({
                                            "com.widevine.alpha": {
                                                "serverURL": this.drm.dt3,
                                                "httpRequestHeaders": {}
                                            },
                                            "com.microsoft.playready": {
                                                "serverURL": this.drm.dt2,
                                                "httpRequestHeaders": {}
                                            }

                                        });
                                    }



                                } else if (/hls/.test(source.type)) {

                                    let options = {
                                        enableWebVTT: false,
                                        enableCEA708Captions: false
                                    };

                                    if (isPlainObject(this.drm)) {
                                        Object.assign(options, {
                                            emeEnabled: true,
                                            widevineLicenseUrl: this.drm.dt3
                                        });
                                    }
                                    
                                    const hls = that.player = new Hls(options);
                                    console.debug(hls);
                                    hls.on(Hls.Events.MANIFEST_PARSED, function(){
                                        that.trigger('languagechange');
                                        if (ct > 0) {
                                            that.one('playing', () => {
                                                plyr.currentTime = ct;
                                            });
                                        }
                                        video.play();
                                    });
                                    hls.on(Hls.Events.MEDIA_ATTACHED, function(){
                                        hls.loadSource(source.src);
                                    });
                                    hls.attachMedia(video);
                                } else video.src = source.src;

                            })
                            .on('languagechange', e => {

                                let ct = plyr.captions.currentTrack;
                                if ((ct >= 0) && that.tracks[ct]) {
                                    let
                                            track = that.tracks[ct],
                                            src = track.data('src') || track.src;
                                    if (track.data('loading') === true) return;
                                    if (!track.text) {
                                        track.data({
                                            src: src,
                                            loading: true
                                        });
                                        fetch(src, {cache: "default", redirect: 'follow'})
                                                .then(r => {
                                                    if (r.status === 200) return r.text();
                                                    throw new Error();
                                                })
                                                .then(text => {
                                                    Object.defineProperty(track, 'text', {
                                                        configurable: true,
                                                        value: text
                                                    });
                                                    let
                                                            blob = new Blob([text], {type: "text/vtt"}),
                                                            url = URL.createObjectURL(blob);
                                                    track.src = url;
                                                    track.data('loading', null);
                                                })
                                                .catch(console.error);
                                    } else {
                                        let
                                                blob = new Blob([track.text], {type: "text/vtt"}),
                                                url = URL.createObjectURL(blob);
                                        track.src = url;
                                    }
                                    doc.querySelectorAll('button[data-plyr="fullscreen"]').forEach(btn => btn.parentElement.insertBefore(this.buttons.download, btn));
                                } else this.buttons.download.remove();
                            })
                            .on('ready', () => {
                                let
                                        quality = localStorage.videoquality || "540",
                                        event = new Event('qualitychange');
                                if (!this.quality[quality]) {
                                    let list = Object.keys(this.quality);
                                    if (list.length > 0) quality = list[0];
                                    else quality = null;
                                }
                                Object.assign(event, {
                                    detail: {
                                        quality: quality,
                                        plyr: plyr
                                    }
                                });
                                this.video.dispatchEvent(event);
                                this.isReady = true;
                                this.trigger('player.ready');
                            })
                            .on('next', () => {
                                if (this.next) location.href = getURL(this.next);
                            })
                            .on('download', () => {
                                let filename = sanitizeFileName(video.data('title'), " ").replace(/\s+/g, " ");
                                let ct = plyr.captions.currentTrack, track = this.tracks[ct];
                                if (track instanceof Element) {
                                    let srt = Subtitle.stringify(Subtitle.parse(track.text));
                                    filename += '.' + track.srclang + ".srt";
                                    Text2File(srt, filename);
                                }
                            })
                            .on('play pause playing', e => {
                                toolbar.hidden = video.paused === true ? null : true;

                            });
                });


               

                



            });

            this.ready(() => {
                this.loadNext();
                toolbar.innerHTML = '<span>' + video.data('title') + '</span>';
                video.parentElement.appendChild(toolbar);

                Events(doc).on('keydown keyup', e => {

                    if (e.target.closest('input') !== null) return;

                    let prevent = false;
                    
                    if ([13, 78].includes(e.keyCode)) e.preventDefault();
                    if (e.type === "keydown") return;

                    switch (e.keyCode) {
                        case 13: //Enter
                            let btn = doc.querySelector('button[data-plyr="fullscreen"]');
                            if (btn !== null) btn.dispatchEvent(new MouseEvent('click'));
                            break;
                        case 78: //n
                            this.trigger('next');
                            break;
                    }
                });
                


                console.debug(scriptname, 'started', this);


            });
            
            this.api.getVideo(videoid).then(json => {
                this.json = json;
                try {
                    this.drm = JSON.parse(atob(json.drm));
                } catch (e) {
                    this.drm = {};
                }
                if (!isPlainObject(this.drm)) delete this.drm;

                //if (Object.keys(this.drm).length > 0) return;
                
                video.data({
                    show: json.video.container.titles.en,
                    episode: json.video.number
                });
                let title = video.data('show');
                if (video.data('episode') > 0) {
                    title += ".E";
                    if (video.data('episode') < 10) title += "0";
                    title += video.data('episode');
                }
                video.data('title', title);
                try {
                    video.poster = json.video.container.images.poster.url;
                } catch (e) {
                    video.poster = null;
                }
                json.subtitles.forEach((item, i) => {
                    let el = doc.createElement('track');
                    Object.assign(el, {
                        src: item.src,
                        label: item.label,
                        srclang: item.srclang,
                        kind: "subtitles",
                        lang: isoCode(item.srclang).lang.split(';')[0].split(',')[0].trim(),
                        id: 'track' + i
                    });
                    this.tracks.push(el);
                    video.appendChild(el);
                });
                this.loadDash();
                if (json.streams.dash) {
                    let
                            item = json.streams.dash,
                            url = new URL(item.url),
                            src = atob(url.searchParams.get('stream')),
                            el = doc.createElement('source'),
                            type = "dash";
                    let label = `${size}p ${type}`;
                    this.quality[label] = {
                        type: "video/" + type,
                        size: size,
                        src: src,
                        label: label
                    };
                    Object.assign(el, this.quality[label]);
                    this.sources.push(el);
                    video.appendChild(el);

                }
                this.loadHLS().then(() => {
                    this.isLoaded = true;
                    this.trigger('player.loaded');
                });

            });
        }

        ready(callback){
            if (this.isReady !== true) {
                this.one('player.ready', () => {
                    callback.call(null, this);
                });
            } else callback.call(null, this);

        }

        loaded(callback){
            if (this.isLoaded !== true) {
                this.one('player.loaded', () => {
                    callback.call(null, this);
                });
            } else callback.call(null, this);

        }

        loadHLS(){
            return new Promise(resolve => {
                if (isPlainObject(this.drm)) {
                    resolve(this);
                    return;
                }
                const json = this.json;
                if (json.streams.hls) {
                    let
                            item = json.streams.hls,
                            url = new URL(item.url),
                            src = atob(url.searchParams.get('stream'));
                    fetch(new URL(src), {cache: "no-store", redirect: 'follow'})
                            .then(r => {
                                if (r.status === 200) return r.text();
                                throw new Error('Unable to fetch hls infos.');

                            })
                            .then(text => {
                                return text.split(/\n+/);
                            })
                            .then(lines => {
                                let res, matches;
                                lines.forEach(line => {
                                    if (/^http/.test(line)) {
                                        let
                                                url = line.trim(), size,
                                                el = doc.createElement('source'),
                                                type = "hls",
                                                label;

                                        try {
                                            size = /(\d+)p/.exec(url)[1];
                                        } catch (e) {
                                            size = res;
                                        }
                                        if(typeof size === s){
                                            size = parseInt(size);
                                            label = `${size}p ${type}`;
                                            this.quality[label] = {
                                                type: "video/" + type,
                                                size: size,
                                                src: src,
                                                label: label
                                            };
                                            res = null;
                                            Object.assign(el, this.quality[label]);
                                            this.sources.push(el);
                                            this.video.appendChild(el);
                                        }
                                    } else if ((matches = /x(\d+),/.exec(line)) !== null) res = matches[1];
                                });
                                resolve(this);
                            })
                            .catch(() => {
                                resolve(this);
                            });
                } else resolve(this);

            });
        }

        loadDash(){
            const json = this.json;
            let
                    item = json.streams.dash,
                    url = new URL(item.url),
                    src = atob(url.searchParams.get('stream'));
            fetch(new URL(src), {cache: "no-store", redirect: 'follow'})
                    .then(r => {

                        if (r.status === 200) return r.text();

                        throw new Error('Invalid status code.');
                    })
                    .then(text => {
                        let
                                p = new DOMParser(),
                                xmlDoc = p.parseFromString(text, "text/xml");
                        console.debug(xmlDoc);

                    })
                    .catch(x => x);





        }

        loadNext(){

            let channel =
                    this.json.video.container.id,
                    id = this.json.video.id;
            this.api.getEpisodes(channel)
                    .then(list => {
                        let next = list.indexOf(id);
                        if (next !== -1) {
                            next++;
                            if (typeof list[next] !== u) {
                                next = list[next];
                                
                                this.api.getVideo(next).then(json => {
                                    if (json.video.blocked == false) {
                                        this.next = next;
                                        doc.querySelectorAll('button[data-plyr="play"]:not(.plyr__control--overlaid)').forEach(btn => {
                                            btn.parentElement.insertBefore(this.buttons.nextvideo, btn.nextElementSibling);
                                        });
                                    }
                                });
                            }
                        }

                    });

        }
    }


    function require(...variables){
        return new Promise(resolve => {
            let sources = require._sources;
            if (variables.length === 0) return;

            variables.forEach(v => {
                let source, match = false;
                for (let i = 0; i < sources.length; i++) {
                    source = sources[i];
                    if (source.vars.includes(v)) {
                        match = true;
                        if (!source.loaded) {
                            source.urls.forEach(u => {
                                if (/\.js$/.test(u)) loadjs(u);
                                else if (/\.css$/.test(u)) loadcss(u);
                            });
                            source.loaded = true;

                        }
                        break;
                    }

                }
                if (match === false) throw new Error('Cannot require ' + v);
            });
            
            let result = {};
            const check = function(){
                variables.forEach(v=>{
                    if (typeof self[v] !== u) result[v] = self[v];
                });
                if (variables.length === Object.keys(result).length) {
                    resolve(result);
                    return true;
                }
            };

            if (check() === true) return;

            new Timer(timer => {
                if (check() === true) timer.stop();
            }, 10, 10 * second);
        });

    }

    require.sources = function(varname, url){
        if (typeof url === s) url = [url];
        if (!Array.isArray(url)) return false;
        if (typeof varname === s) varname = [varname];
        if (!Array.isArray(varname)) return false;
        if (!require._sources) require._sources = [];
        let sources = require._sources;
        sources.push({
            vars: varname,
            urls: url,
            loaded: false
        });
        return true;
    };





    
    class PlyrPlayer {

        static setStyles(){
            if (this.styles === true) return;
            this.styles = true;
            addstyle(`
                .plyr-player video{object-fit: fill;}
                .plyr-player{position: absolute;top: 0;right: 0;left: 0;bottom: 0;}
                .plyr-player .video-toolbar{
                    position: absolute; top: 0 ; left: 0 ; right: 0;
                    text-align: center; padding: 16px 8px;z-index: 9999;
                    text-align: center;font-size: 24px; color:#FFF;line-height: 1.5;
                    background-color: rgba(0, 0, 0, 0.45);text-decoration: none;cursor: pointer;
                }
                .plyr-player .video-toolbar *:hover{filter: drop-shadow(4px 4px 4px #fff);}
                .plyr-player .plyr__caption{
                    -webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;
                     font-weight: 600; text-shadow: 5px 5px 5px #000; min-width: 90%; display: inline-block;
                     background: rgba(0,0,0,.25);transform: translate(0, -60px);font-size: 24px;
                }
                .plyr-player.plyr--captions-enabled video::cue{
                    color: rgba(255,255,255,0); background-color: rgba(255,255,255,0);
                    display: none; text-shadow: none;
                }
                @media (min-width: 768px) {
                    .plyr-player  .plyr__caption{font-size: 32px;}
                }
                @media (min-width: 992px) {
                    .plyr-player  .plyr__caption{font-size: 40px;}
                }
                .plyr-player .hidden, .plyr-player .hidden *, .plyr-player [hidden], .plyr-player [hidden] *{
                    position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                    height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                    display: inline !important;z-index: -1 !important;
                }
            `);

        }

        static get plyrVersion(){
            return '3.6.2';
        }

        static setDeps(){
            if (this.deps === true) return;
            this.deps = true;
            require.sources('Plyr', [
                'https://cdn.jsdelivr.net/npm/plyr@' + this.plyrVersion + '/dist/plyr.min.js',
                'https://cdn.jsdelivr.net/npm/plyr@' + this.plyrVersion + '/dist/plyr.css'
            ]);
            require.sources('dashjs', 'https://cdn.dashjs.org/latest/dash.all.min.js');
            require.sources('Subtitle', 'https://cdn.jsdelivr.net/npm/subtitle@2.0.5/dist/subtitle.bundle.min.js');
            require.sources('Hls', 'https://cdn.jsdelivr.net/npm/hls.js@0.14.16/dist/hls.min.js');
        }
        
        
        get root(){
            return this.elements.root;
        }
        get video(){
            return this.elements.video;
        }
        
        get currentSource(){
            return this._currentSource || -1;
        }
        
        set currentSource(index){
            let current = this._currentSource || -1;
            if (typeof index === n && this.sources[index]) {
                let 
                        newsource = this.sources[index],
                        $this = this,
                        action = function(){
                            Events(newsource.element).trigger('source.load', {
                                source: newsource,
                                plyr: $this.plyr
                            });
                            $this._currentSource = index;
                        };
                
                if (current !== -1) {
                    let source = this.sources[current];
                    Events(source.element)
                            .one('source.unload', action)
                            .trigger('source.unload', {
                                source: source,
                                plyr: this.plyr
                            });
                } else action();

            }

        }


        constructor(container){
            PlyrPlayer.setDeps();

            container = container instanceof HTMLElement ? container : doc.body;
            const $this = this;
            this.elements = {};
            this.sources = [];
            this.tracks = [];
            this.types = {};
            this.currentSource = -1;

            let root = this.elements.root = html2element('<div class="plyr-player"/>');
            let video = this.elements.video = html2element('<video controls crossorigin src="" preload="none" tabindex="-1" class="plyrvideo"/>');

            this.options = {

                captions: {active: false, language: 'auto', update: true},
                settings: ['captions', 'quality'],
                keyboard: {focused: true, global: true},
                tooltips: {controls: true, seek: true},
                controls: [
                    'play-large',
                    // 'restart',
                    // 'rewind',
                    'play',
                    // 'fast-forward',
                    'progress',
                    'current-time',
                    'duration',
                    'mute',
                    'volume',
                    'captions',
                    'settings',
                    //'pip',
                    //'airplay',
                    //'download',
                    'fullscreen'
                ],
                listeners: {
                    //  seek(e){},
                    //  play(e){},
                    // pause(e){},
                    // restart(e){},
                    //  rewind(e){},
                    //  fastForward(e){},
                    //  mute(e){},
                    // volume(e){},
                    // captions(e){},
                    //download(e){},
                    // fullscreen(e){},
                    // pip(e){},
                    // airplay(e){},
                    // speed(e){},
                    // loop(e){},
                    // language(e){},
                    download(e){
                        $this.trigger('download');
                        return false;
                    },
                    quality(e){
                        let target = e.target.closest('button'), evt = new Event('qualitychange', {bubbles: true, cancelable: true});
                        evt.detail = {
                            quality: target.value,
                            plyr: $this.plyr
                        };
                        that.video.dispatchEvent(evt);
                        return false;
                    }
                },
                quality: {
                    default: null,
                    // The options to display in the UI, if available for the source media
                    options: ['adaptive', '1080p', '720p', '480p', '360p', '240p'],
                    forced: true,
                    onChange: x => x
                }
            };

            (new Events(video, this));

            ["webm", "mp4", "ogg"].forEach(type => {
                this.addSourceType(type, source => {
                    $this.video.src = source.src;
                });
            });
            
            



            const listeners = {};

            Object.keys(listeners).forEach(type => {
                this.on(type, listeners[type]);
            });




        }


        ready(){
            return new Promise(resolve => {
                if (this.isReady === true) resolve(this);
                else {
                    this.on('player.ready', () => {
                        resolve(this);
                    });
                }
            });
        }



        addSourceType(type, onload, onunload){
            if (typeof type === s && typeof onload === f) {
                if (this.types[type]) return false;
                this.types[type] = {
                    type: "video/" + type,
                    onload: onload,
                    onunload: typeof onunload === f ? onunload : x => x
                };
                return true;
            }
            return false;

        }
        
        
        addSource(src, size, type, label, onload, onunload){
            if (typeof src === s && /^http/.test(src)) {

                if (typeof size === s && /^\d+$/.test(size)) size = parseInt(size);
                if (typeof size !== n) size = "default";
                type = type || "mp4";
                label = typeof label === s ? label : `${size}p`;
                if (typeof type !== s || !this.types[type]) return false;
                onload = typeof onload === f ? onload : this.types[type].onload;
                onunload = typeof onunload === f ? onunload : this.types[type].onunload;

                let
                        source = {
                            src: src,
                            type: type,
                            label: label
                        },
                        el = source.element = doc.createElement('source');
                el.setAttribute('src', src);
                el.setAttribute('size', size);
                el.setAttribute('type', this.types[type].type);
                el.setAttribute('label', label);
                Events(el)
                        .on('source.load', onload)
                        .on('source.unload', onunload);
                this.sources.push(source);
                this.video.appendChild(el);
                return true;
            }
            return false;
        }
        addTrack(src, srclang, label){

            if (typeof src === s && /^http/.test(src)) {
                srclang = typeof srclang === s ? srclang : "und";
                lang = isoCode(srclang).lang.split(';')[0].split(',')[0].trim();
                label = typeof label === s ? label : lang;
                let
                        id = "track" + this.tracks.length,
                        el = doc.createElement('track');

                el.setAttribute('kind', 'subtitles');
                el.setAttribute('label', label);
                el.setAttribute('lang', lang);
                el.setAttribute('srclang', srclang);
                el.setAttribute('id', id);

                Events(el).on('load, error', e => {
                    let target = e.target, src = target.src;
                    if (/^blob/.test(src)) return;
                    if (target.data('loading') === true) return;
                    target.data('loading', true);
                    if (e.type === "error") src = "https://cors-anywhere.herokuapp.com/" + src;
                    fetch(src, {cache: "default", redirect: 'follow'})
                            .then(r => {
                                if (r.status === 200) return r.text();
                                throw new Error('Invalid status code ' + r.status);
                            })
                            .then(text => {
                                require('Subtitle').then(exports => {
                                    let {Subtitle} = exports;
                                    let parsed, vtt, blob, virtualurl;
                                    if (Array.isArray(parsed = Subtitle.parse(text)) && parsed.length > 0) {
                                        vtt = Subtitle.stringifyVtt(parsed);
                                        if (typeof vtt === s && vtt.length > 0) {
                                            Object.defineProperty(el, 'text', {
                                                configurable: true, value: vtt
                                            });
                                            target.data('loading', null);
                                        }
                                    }
                                });

                            })
                            .catch(console.warn);

                });

                el.setAttribute('src', src);



            }
            return false;

            let el = doc.createElement('track');
            Object.assign(el, {
                src: item.src,
                label: item.label,
                srclang: item.srclang,
                kind: "subtitles",
                lang: isoCode(item.srclang).lang.split(';')[0].split(',')[0].trim(),
                id: 'track' + i
            });
            this.tracks.push(el);
            video.appendChild(el);

        }

        reset(){

        }

        start(){

        }
        
    }


    class VikiPlayer {

        constructor(api, id){
            let container = doc.querySelector('#__next >.page-wrapper');
            container = container instanceof HTMLElement ? container : doc.body;

            if (!(api instanceof VikiAPI)) {
                console.error('Viki API not loaded.');
                return;
            }

            this.api = api;
            this.json = {};
            this.player = new PlyrPlayer(container);
            if (typeof id === s) this.loadVideo(id);

        }

        loadVideo(id){

            const $this = this;

            this.api.getVideo(id).then(json => {

                this.json = json;
                let drm, player = this.player, video = player.video;

                try {
                    drm = JSON.parse(atob(json.drm));
                } catch (e) {
                    drm = null;
                }
                if (!isPlainObject(drm)) drm = null;

                player.reset();

                video.data({
                    show: json.video.container.titles.en,
                    episode: json.video.number
                });

                let title = video.data('show');
                if (video.data('episode') > 0) {
                    title += ".E";
                    if (video.data('episode') < 10) title += "0";
                    title += video.data('episode');
                }
                video.data('title', title);
                try {
                    video.poster = json.video.container.images.poster.url;
                } catch (e) {
                    video.poster = null;
                }

                this.loadSubs(json);
                this.loadStreams(json.streams, drm)
                        .then(() => {
                            player.start();
                        });




            });







        }


        loadSubs(json){

        }
        loadStreams(json, drm){

            let src, label, size, type;

            if (json.dash) {




            }

        }


    }



    class VikiAPI {
        constructor(appid, appversion){
            if (typeof appid !== s) throw new Error('Invalid app id');
            if (typeof appversion !== s) throw new Error('Invalid app version');
            this.appid = appid;
            this.appversion = appversion;
        }


        call(url, headers){
            return new Promise((resolve, reject) => {

                if (typeof url !== s || !(/^http/.test(url))) {
                    reject('Invalid URL');
                    return;
                }
                url = new URL(url);
                url.searchParams.set('app', this.appid);
                const options={
                    cache: "no-store",
                    redirect: 'follow',
                    credentials: "same-origin"
                };
                if (headers instanceof Headers) options.headers = headers;
                fetch(url, options)
                        .then(r => {
                            if (r.status === 200) return r.json();
                            throw new Error("Cannot Fetch APi data");
                        })
                        .then(json => {
                            resolve(json);
                        })
                        .catch(() => {
                            reject('Cannot Fetch APi data ' + url);
                        });
            });
        }

        getVideo(id){
            return new Promise(resolve => {
                if ((typeof id !== s) || !(/^\d+v$/.test(id))) return;
                let url = 'https://www.viki.com/api/videos/' + id;
                this.call(url, new Headers({'x-viki-app-ver': this.appversion})).then(json => resolve(json)).catch(console.error);
            });
        }

        getChannel(id){
            return new Promise(resolve => {
                if ((typeof id !== s) || !(/^\d+c$/.test(id))) return;
                let url = 'https://api.viki.io/v4/series/' + id + '.json';
                this.call(url).then(json => resolve(json)).catch(console.error);
            });
        }

        getEpisodes(id){
            return new Promise(resolve => {
                if ((typeof id !== s) || !(/^\d+c$/.test(id))) return;
                let url = 'https://api.viki.io/v4/containers/' + id + '/episodes.json?&direction=asc&with_upcoming=true&sort=number&blocked=true&only_ids=true';
                this.call(url).then(json => resolve(json.response)).catch(console.error);
            });
        }

    }




    /**
     * API Load data
     */
    let api, matches, app_ver, app_id, vplayer;
    
    

    Events(doc).on(UUID + '.pagechange', e => {

        
        let  uri = e.data.args[2];

        

        if ((matches = /^\/videos\/(\d+v)/.exec(uri)) !== null) {
            let id = matches[1];
            
            if (!(vplayer instanceof VikiPlayer) ){
                if (!(api instanceof VikiAPI)) {
                    NodeFinder.findOne('[src*="app_ver="][src*="?app_id"]', el => {
                        let url = new URL(el.src);
                        app_ver = url.searchParams.get('app_ver');
                        app_id = url.searchParams.get('app_id');
                        api = new VikiAPI(app_id, app_ver);
                        vplayer = window.vplayer = new VikiPlayer(api, id);
                    });
                } else vplayer = window.vplayer = new VideoPlayer(api, id);
            } else vplayer.loadVideo(id);
            

        } else {
            on.loaded().then(() => {
                if (Settings.locale.length === 0) {
                    LocaleSelector.getLocales().then(list => {
                        let sel = new LocaleSelector(list);
                        sel.open();
                    });
                } else if (newsession === true) {
                    LocaleSelector.replaceLocale(Settings.locale);
                }
            });
        }

    });

    /*   if(/^\/videos\/(\d+v)/.test(location.pathname)){
     Events(doc).trigger(UUID + '.pagechange',{
     mode: "init",
     args:[null,null,location.pathname]
     });
     }*/

})(document);