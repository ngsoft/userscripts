// ==UserScript==
// @version     2.4.1
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
                            this.locale = target.data('locale');

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
                    .altplayer  .plyr__caption{font-size: 32px;}
                }
                @media (min-width: 992px) {
                    .altplayer  .plyr__caption{font-size: 40px;}
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
                    if (typeof window[name] !== u) args[name] = window[name];
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
                        options: Object.keys(this.quality),
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
                    ]
                };

                NodeFinder.find('video[src*="blob"]:not(.altvideo)', v => {
                    v.pause();
                    v.src = null;
                    v.remove();
                    loadResources().then(exports => {
                        const{Subtitle, Hls, Plyr, dashjs} = exports;
                        doc.body.innerHTML = "";
                        doc.body.appendChild(this.root);
                        const plyr = this.plyr = new Plyr(video, options);

                        this
                                .on('qualitychange', e => {
                                    let {quality} = e.detail,
                                    ct = plyr.currentTime;
                                    localStorage.videoquality = quality;
                                    if (that.player) {
                                        that.player.destroy();
                                        that.player = null;
                                    }
                                    let source = that.quality[quality];
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

                                    } else if (/hls/.test(source.type)) {
                                        const hls = that.player = new Hls();

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
                                    }
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

                console.debug(scriptname, 'started');


            });
            
            this.api.getVideo(videoid).then(json => {
                this.json = json;
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
                if (json.streams.dash) {
                    let
                            item = json.streams.dash,
                            url = new URL(item.url),
                            src = atob(url.searchParams.get('stream')),
                            el = doc.createElement('source');
                    this.quality[size] = {
                        type: "video/dash",
                        size: size,
                        src: src
                    };
                    Object.assign(el, this.quality[size]);
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
                                lines.forEach(line => {
                                    if (/^http/.test(line)) {
                                        let
                                                url = line.trim(),
                                                size = /(\d+)p/.exec(url)[1],
                                                el=doc.createElement('source');
                                        size = parseInt(size);
                                        this.quality[size] = {
                                            type: "video/hls",
                                            size: size,
                                            src: src
                                        };
                                        Object.assign(el, this.quality[size]);
                                        this.sources.push(el);
                                        this.video.appendChild(el);
                                        resolve(this);
                                    }
                                });
                            })
                            .catch(() => {
                                resolve(this);
                            });
                } else resolve(this);

            });
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
    let api, matches, version, appid;
    if ((matches = /^\/videos\/(\d+v)/.exec(location.pathname)) !== null) {
        let id = matches[1];


        NodeFinder.findOne('[src*="app_ver="][src*="?app_id"]', el => {
            let url = new URL(el.src);
            version = url.searchParams.get('app_ver');
            appid = url.searchParams.get('app_id');
            api = new VikiAPI(appid, version);
            const vplayer = window.vplayer = new VideoPlayer(api, id);
        });



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


})(document);