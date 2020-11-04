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
                .plyr-toolbar{
                    position: absolute; top: 0 ; left: 0 ; right: 0;
                    text-align: center; padding: 16px 8px;z-index: 9999;
                    text-align: center;font-size: 16px; color:#FFF;line-height: 1.5;text-decoration: none;cursor: pointer;
                    background: linear-gradient(rgba(0,0,0,.75),rgba(0,0,0,0));transition: opacity .4s ease-in-out,transform .4s ease-in-out;
                }
                .plyr-toolbar *:hover{filter: drop-shadow(4px 4px 4px #fff);}
                .plyr__poster {background-size: cover;}
                .plyr__caption{
                    -webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;
                     font-weight: 600; text-shadow: 5px 5px 5px #000; min-width: 90%; display: inline-block;
                     background: rgba(0,0,0,.1);transform: translate(0, 10%);font-size: 16px;
                }
               .plyr--captions-enabled video::cue{
                    color: rgba(255,255,255,0); background-color: rgba(255,255,255,0);
                    display: none; text-shadow: none;
                }
                @media (min-width: 768px) {
                    .plyr__caption, .plyr-toolbar{font-size: 24px;}
                }
                @media (min-width: 992px) {
                    .plyr__caption{font-size: 32px;}
                }
                .plyr-player [disabled], .plyr-player .disabled{pointer-events: none !important;}
                .plyr-player .hidden, .plyr-player .hidden *{
                    position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                    height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                    display: inline !important;z-index: -1 !important;
                } 
                .plyr-player [hidden], .plyr-player button[data-plyr="quality"][disabled]{display: none;}
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
            let cs = typeof this._currentSource === n ? this._currentSource : -1;
            if (!this.sources[cs]) cs = -1;
            return  cs;
        }
        
        set currentSource(index){
            let current = typeof this._currentSource === n ? this._currentSource : -1;
            if (typeof index === n && this.sources[index]) {
                if (current === index) return;
                let newsource = this.sources[index];
                
                if (current !== -1) {
                    let source = this.sources[current];
                    source.unload(source);
                }
                newsource.load(newsource);
                let storage = this.plyr.storage.get();
                storage.quality = newsource.label;
                this.plyr.storage.set(storage);
                this._currentSource = index;
            }

        }

        get quality(){
            let cs = this.currentSource;
            if (cs === -1) return null;
            return this.sources[cs].label;
        }


        set quality(label){
            if (typeof label === s) {
                let index = this.sources.map(x => x.label).indexOf(label);
                if (index !== -1) this.currentSource = index;

            }
        }

        set title(title){
            if (typeof title === s) {
                this.elements.title.innerHTML = title;
                this.video.data('title', title);
                this.ready().then(player => {
                    player.video.parentElement.appendChild(player.elements.toolbar);
                });
            } else if (title === null) {
                this.elements.title.innerHTML = "";
                this.video.data('title', title);
                this.ready().then(player => {
                    player.elements.toolbar.remove();
                });
            }

        }

        get title(){
            return this.video.data('title') || "";
        }

        set currentTime(float){
            if (typeof float === n) this.video.currentTime = float;
        }

        get currentTime(){
            return  this.video.currentTime;
        }

        get currentTrack(){
            if (this.plyr) {
                let tn = this.plyr.captions.currentTrack, track = this.tracks[tn];
                if (track instanceof Element) return track;
            }
            return null;
        }


        constructor(container){
            const $this = this;
            PlyrPlayer.setDeps();

            container = container instanceof HTMLElement ? container : doc.body;
            this.container = container;
            this.elements = {};
            this.sources = [];
            this.tracks = [];
            this.types = {};
            this._currentSource = -1;

            let root = this.elements.root = html2element('<div class="plyr-player"/>');
            let video = this.elements.video = html2element('<video controls crossorigin src="" preload="none" tabindex="-1" class="plyrvideo"/>');
            this.elements.toolbar = html2element('<div class="plyr-toolbar"><span class="plyr-title"></span></div>');
            this.elements.title = this.elements.toolbar.querySelector('.plyr-title');

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
                    'download',
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
                        e.preventDefault();
                        e.stopPropagation();
                        $this.trigger('download');
                        return false;
                    },
                    quality(e){
                        let target = e.target.closest('button'), evt = new Event('qualitychange', {bubbles: true, cancelable: true});
                        evt.detail = {
                            quality: target.value,
                            plyr: $this.plyr
                        };
                        video.dispatchEvent(evt);
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
            const listeners = {
                ready(){
                    $this.isReady = true;
                    $this.trigger('player.ready');
                },
                qualitychange(e){
                    

                    if (e.detail !== undef) {
                        if ($this.currentSource === -1 && e.detail.init !== true) return;
                        $this._pos = $this.currentTime;
                        if (typeof e.detail.quality === s) $this.quality = e.detail.quality;
                    }
                },

                player: {
                    trackchange(e){
                        let {track} = e.data;
                        if (track.text) {
                            track.dataset.src = track.dataset.src || track.src;
                            track.src = URL.createObjectURL(new Blob([track.text], {type: "text/vtt"}));
                        }
                    }
                },

                languagechange(e){
                    let {plyr} = e.detail,
                    tn = plyr.captions.currentTrack, active = plyr.captions.active;
                    plyr.elements.buttons.download.hidden = true;
                    if (tn !== -1 && active === true) {
                        let track = $this.tracks[tn];
                        $this.trigger('player.trackchange', {
                            track: track,
                            plyr: e.detail.plyr
                        });
                        plyr.elements.buttons.download.hidden = null;
                    }
                },
                captionsenabled(e){
                    let {plyr} = e.detail;
                    plyr.elements.buttons.download.hidden = true;
                    if ($this.currentTrack instanceof  Element) plyr.elements.buttons.download.hidden = null;

                },
                captionsdisabled(e){
                    let {plyr} = e.detail;
                    plyr.elements.buttons.download.hidden = true;
                },
                loadedmetadata(){
                    if ($this.currentTrack instanceof Element) {
                        $this.trigger('player.trackchange', {
                            track: $this.currentTrack
                        });
                    }

                    if (typeof $this._pos === n && $this._pos > 0) {
                        this.currentTime = $this._pos;
                        video.play();
                    }
                    delete $this._pos;
                },
                ended(e){
                    console.debug(e);
                },
                controlshidden(){
                    $this.elements.toolbar.hidden = true;
                },
                controlsshown(){
                    $this.elements.toolbar.hidden = null;
                },
                download(e){
                    let track = this.currentTrack;
                    if (track instanceof Element && track.text) {
                        let filename = video.data('filename') || video.data('title') || "subtitles";
                        filename = sanitizeFileName(filename, ' ');
                        filename += '.' + track.srclang + '.srt';
                        Text2File(track.text, filename);
                    }

                }
            };

            Object.keys(listeners).forEach(type => {
                if (typeof listeners[type] === f) this.on(type, listeners[type]);
                else if (isPlainObject(listeners[type])) {
                    Object.keys(listeners[type]).forEach(t => {
                        if (typeof listeners[type][t] === f) {
                            this.on(type + '.' + t, listeners[type][t]);
                        }
                    });
                }

            });

            ["webm", "mp4", "ogg"].forEach(type => {
                this.addSourceType(type, source => {
                    video.src = source.src;
                });
            });

            this.addSourceType(
                    'hls',
                    source => {
                        let options = {
                            enableWebVTT: false,
                            enableCEA708Captions: false
                        };
                        
                        require('Hls').then(exports => {
                            let {Hls} = exports,
                            hls = source.hls = new Hls(options);
                            hls.on(Hls.Events.MANIFEST_PARSED, function(){ });
                            hls.on(Hls.Events.MEDIA_ATTACHED, function(){
                                hls.loadSource(source.src);
                            });
                            hls.attachMedia(video);
                        });
                    },
                    source => {
                        if(source.hls){
                            source.hls.destroy();
                            delete source.hls;
                        }

                    }
            );

            this.addSourceType(
                    'dash',
                    source => {
                        require('dashjs').then(exports => {
                            let {dashjs} = exports,
                            player = source.dash = dashjs.MediaPlayer().create();
                            player.initialize();
                            player.setAutoPlay(false);
                            player.attachView(video);
                            player.attachSource(source.src);
                        });
                    },
                    source => {
                        if(source.dash){
                            source.dash.reset();
                            delete source.dash;
                        }

                    }
            );

        }


        ready(){
            return new Promise(resolve => {
                if (this.isReady === true) resolve(this);
                else {
                    this.one('player.ready', () => {
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
                if (typeof size !== n && typeof size !== s) size = "default";
                type = type || "mp4";
                label = typeof label === s ? label : (typeof size === n ? `${size}p` : size);
                if (typeof type !== s || !this.types[type]) return false;
                onload = typeof onload === f ? onload : this.types[type].onload;
                onunload = typeof onunload === f ? onunload : this.types[type].onunload;

                let
                        source = {
                            src: src,
                            type: type,
                            label: label,
                            size: size,
                            load: onload,
                            unload: onunload
                        },
                        el = source.element = doc.createElement('source');
                el.setAttribute('src', src);
                el.setAttribute('size', size);
                el.setAttribute('type', this.types[type].type);
                el.setAttribute('label', label);
                this.sources.push(source);
                this.video.appendChild(el);
                return true;
            }
            return false;
        }
        addTrack(src, srclang, label){

            if (typeof src === s && /^http/.test(src)) {
                srclang = typeof srclang === s ? srclang : "und";
                let lang = isoCode(srclang).lang.split(';')[0].split(',')[0].trim();
                label = typeof label === s ? label : lang;
                let
                        id = "track" + this.tracks.length,
                        el = doc.createElement('track');

                el.setAttribute('kind', 'subtitles');
                el.setAttribute('label', label);
                el.setAttribute('lang', lang);
                el.setAttribute('srclang', srclang);
                el.setAttribute('id', id);

                el.onload = el.onerror = e => {
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

                };

                el.setAttribute('src', src);
                this.tracks.push(el);
                this.video.appendChild(el);
                return true;
            }
            return false;
        }

        reset(){
            this.video.pause();
            this.currentTime = 0;

            let source = this.sources[this.currentSource];
            if (isPlainObject(source)) source.unload(source);
            this.title = null;
            this.video.data({
                filename: null,
                src: null,
                poster: null
            });
            this.video.poster = null;
            this._currentSource = -1;
            this.tracks = [];
            this.sources = [];
            this.video.innerHTML = "";

        }

        start(container){

            if (this.starting=== true) return;
            this.starting = true;

            if (container instanceof Element) {
                this.container = container;
                this.container.innerHTML = "";
                this.container.appendChild(this.elements.root);
            }
            
            if (this.elements.video.parentElement === null) {
                this.elements.root.appendChild(this.elements.video);
            }
            if (this.root.parentElement === null) {
                this.container.innerHTML = "";
                this.container.appendChild(this.elements.root);
            }

            this.ready().then(player => {
                delete this.starting;

                this.root.querySelectorAll('button[data-plyr="quality"][value]').forEach(btn => {
                    btn.disabled = true;
                    if (this.sources.map(x => x.label).includes(btn.value)) btn.disabled = null;
                });

                let
                        quality = this.plyr.storage.get('quality') || null,
                        index = this.sources.map(x => x.label).indexOf(quality);
                if (index === -1 && this.sources.length > 0) index = 0;

                if (index !== -1) {
                    let ev = new Event('qualitychange', {bubbles: true, cancelable: true});
                    ev.detail = {
                        quality: this.sources[index].label,
                        plyr: this.plyr,
                        init: true
                    };
                    this.video.dispatchEvent(ev);
                }

            });

            if (!this.plyr) {
                require('Plyr').then(exports => {
                    let {Plyr} = exports;
                    PlyrPlayer.setStyles();
                    let plyr = this.plyr = new Plyr(this.video, this.options);
                });
            }
        }
        
    }


    class VikiPlayer {

        static setStyles(){
            if (this.styles === true) return;
            this.styles = true;
            addstyle(`
                .plyr-player video{object-fit: fill;}
                .plyr-player{position: absolute;top: 0;right: 0;left: 0;bottom: 0;}
                .plyr-toolbar{
                    position: absolute; top: 0 ; left: 0 ; right: 0;
                    text-align: center; padding: 16px 8px;z-index: 9999;
                    text-align: center;font-size: 16px; color:#FFF;line-height: 1.5;text-decoration: none;cursor: pointer;
                    background: linear-gradient(rgba(0,0,0,.75),rgba(0,0,0,0));transition: opacity .4s ease-in-out,transform .4s ease-in-out;
                }
                .plyr-toolbar *:hover{filter: drop-shadow(4px 4px 4px #fff);}
                .plyr__poster {background-size: cover;}
                .plyr__caption{
                    -webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;
                     font-weight: 600; text-shadow: 5px 5px 5px #000; min-width: 90%; display: inline-block;
                     background: rgba(0,0,0,.1);transform: translate(0, 10%);font-size: 16px;
                }
               .plyr--captions-enabled video::cue{
                    color: rgba(255,255,255,0); background-color: rgba(255,255,255,0);
                    display: none; text-shadow: none;
                }
                @media (min-width: 768px) {
                    .plyr__caption, .plyr-toolbar{font-size: 24px;}
                }
                @media (min-width: 992px) {
                    .plyr__caption{font-size: 32px;}
                }
                .plyr-player [disabled], .plyr-player .disabled{pointer-events: none !important;}
                .plyr-player .hidden, .plyr-player .hidden *{
                    position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                    height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                    display: inline !important;z-index: -1 !important;
                }
                .plyr-player [hidden], .plyr-player button[data-plyr="quality"][disabled]{display: none;}
            `);

        }



        constructor(api, id){
            let container = doc.querySelector('#__next >.page-wrapper');
            container = container instanceof HTMLElement ? container : doc.body;

            if (!(api instanceof VikiAPI)) {
                console.error('Viki API not loaded.');
                return;
            }

            this.api = api;
            this.json = {};
            let player = this.player = new PlyrPlayer(container);
            let video = player.video;

            Events(doc).on('keydown keyup', e => {

                if (e.target.closest('input') !== null) return;

                let prevent = false;

                if ([13, 78].includes(e.keyCode)) e.preventDefault();
                if (e.type === "keydown") return;

                switch (e.keyCode) {
                    case 13: //Enter
                        let btn = player.root.querySelector('button[data-plyr="fullscreen"]');
                        if (btn !== null) btn.dispatchEvent(new MouseEvent('click'));
                        break;
                    case 78: //n
                        player.trigger('next');
                        break;
                }
            });


            let listeners = {
                next(){

                },
                loadedmetadata(){
                    video.play();
                },
                ended(){
                    player.trigger('next');

                }
            };

            Object.keys(listeners).forEach(type => {
                if (typeof listeners[type] === f) player.on(type, listeners[type]);
                else if (isPlainObject(listeners[type])) {
                    Object.keys(listeners[type]).forEach(t => {
                        if (typeof listeners[type][t] === f) {
                            player.on(type + '.' + t, listeners[type][t]);
                        }
                    });
                }

            });



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
                player.title = title;
                if (video.data('episode') > 0) {
                    title += ".E";
                    if (video.data('episode') < 10) title += "0";
                    title += video.data('episode');
                }
                video.data('filename', title);
                try {
                    video.poster = json.video.container.images.poster.url;
                } catch (e) {
                    video.poster = null;
                }

                this.loadSubs(json.subtitles);
                this.loadStreams(json.streams, drm)
                        .then(() => {
                            console.debug(this);
                            player.ready().then(player => {
                                VikiPlayer.loadStyles()
                            });

                            let container = doc.querySelector('#__next >.page-wrapper');
                            if (player.container !== container) player.start(container);
                            else player.start();
                        });
            });

        }


        loadSubs(json){
            if (Array.isArray(json)) {
                json.forEach(item => this.player.addTrack(item.src, item.srclang, item.label));
            }

        }
        loadStreams(json, drm){
            return new Promise(resolve=>{
                let src, label, size, type;

                if (json.dash) {
                    //addSource(src, size, type, label, onload, onunload)
                    type = "dash";
                    label = "adaptive";
                    size = "adaptive";
                    src = atob((new URL(json.dash.url)).searchParams.get('stream'));
                    if (isPlainObject(drm)) {
                        this.player.addSource(src, size, type, label, source => {
                            require('dashjs').then(exports => {
                                let {dashjs} = exports,
                                player = source.dash = dashjs.MediaPlayer().create();
                                player.initialize();
                                player.setAutoPlay(false);
                                player.attachView(this.player.video);
                                player.attachSource(source.src);
                                player.setProtectionData({
                                    "com.widevine.alpha": {
                                        "serverURL": drm.dt3,
                                        "httpRequestHeaders": {}
                                    },
                                    "com.microsoft.playready": {
                                        "serverURL": drm.dt2,
                                        "httpRequestHeaders": {}
                                    }

                                });
                            });
                        });
                    } else this.player.addSource(src, size, type, label);
                }

                if (json.hls && !isPlainObject(drm)) {

                    let manifest = atob((new URL(json.hls.url)).searchParams.get('stream'));
                    type = "hls";
                    let sizes = [1080, 720, 480, 360, 240];

                    fetch(new URL(manifest), {cache: "no-store", redirect: 'follow'})
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
                                        src = line.trim();
                                        size = null;
                                        if (typeof res !== n) return;
                                        sizes.forEach(num => {
                                            if (num >= res) size = num;
                                        });
                                        
                                        if (typeof size === n) this.player.addSource(src, size, type);

                                    } else if ((matches = /x(\d+),/.exec(line)) !== null) res = parseInt(matches[1]);
                                });
                                resolve(this.player);
                            })
                            .catch(() => {
                                resolve(this.player);
                            });

                } else resolve(this.player);

            });



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

            new Timer(timer => {
                if (typeof player === o && player.player) {
                    if (player.player.isReady_) {
                        timer.stop();
                        player.player.dispose();
                    }
                }
            }, 10, 20 * second);


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

    /* states
     [
     {
     __N: true,
     as: "/videos/1128053v",
     url: "/videos/[vid]?vid=1128053v", replaceState(pushstate without var)
     options:{}

     },
     "",
     "/videos/1128053v"

     ];*/

    /*   if(/^\/videos\/(\d+v)/.test(location.pathname)){
     Events(doc).trigger(UUID + '.pagechange',{
     mode: "init",
     args:[null,null,location.pathname]
     });
     }*/

})(document);