/**
 * Module player
 */
(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'player',
            dependencies = ['utils', 'config', 'storage', 'isocode', 'Plyr', 'Subtitle', 'dash', 'Hls'];
    if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    } else if (typeof exports === 'object' && module.exports) {
        module.exports = factory(...dependencies.map(dep => require(dep)));
    } else {
        root.require = root.require || function(dep){
            let result;
            Object.keys(Object.getOwnPropertyDescriptors(root)).some(key => {
                if (key.toLowerCase() === dep.toLowerCase()) result = root[key];
                return typeof result !== "undefined";
            });
            return result;
        };
        root["player"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function h27jb09534f10ckayj3dt(utils, config, storage, isoCode, Plyr, Subtitle, dashjs, Hls){


    const {doc, loadcss, sprintf, gettype, s, f, u, n, b, assert, Events, DataSet, html2element, Text2File} = utils;
    const cfg = config.get('Plyr');


    const options = {

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
        /*listeners: {
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
        },*/
        quality: {
            default: null,
            // The options to display in the UI, if available for the source media
            options: ['adaptive', '4320p', '2880p', '2160p', '1440p', '1080p', '720p', '540p', '480p', '360p', '240p', '144p'],
            forced: true,
            onChange: x => x
        },

        i18n: {
            qualityBadge: {
                '4320p': '8K',
                '2880p': '4K',
                '2160p': '4K',
                '1440p': 'HD',
                '1080p': 'HD',
                '720p': 'HD',
                '540p': 'SD',
                '480p': 'SD'
            }
        }
        
        

    };

    class PlyrPlayerType {

        get type(){
            return 'video/' + this.options.type;
        }

        get attach(){
            return this.config.attach;
        }

        get detach(){
            return this.config.detach;
        }

        constructor(player, type, attach, detach){

            assert(player instanceof PlyrPlayer, 'Invalid argument player.');
            assert(gettype(type, s), 'Invalid argument type.');
            assert(gettype(attach, f), 'Invalid argument attach.');
            
            if (!gettype(detach, f)) detach = x => x;

            Object.defineProperties(this, {
                config: {
                    enmerable: false, configurable: true, writable: false,
                    value: {type, attach, detach}
                },
                player: {
                    enmerable: false, configurable: true, writable: false,
                    value: player
                }
            });
        }


    }


    class PlyrPlayerSource {

        get src(){
            return this.config.src.href;
        }

        get type(){
            return this.config.type.config.type;
        }

        get label(){
            return this.config.label;
        }

        get size(){
            return this.config.size;
        }
        
        get attach(){
            return this.config.attach;
        }
        set attach(fn){
            if (gettype(fn, f)) this.config.attach = fn;
        }
        get detach(){
            return this.config.detach;

        }
        set detach(fn){
            if (gettype(fn, f)) this.config.detach = fn;
        }
        
        get selected(){
            return this.src === this.player.video.dataset.src;
        }

        constructor(player, type, src, size, label){

            assert(player instanceof PlyrPlayer, 'Invalid argument player.');
            assert(type instanceof PlyrPlayerType, 'Invalid argument type.');
            assert((/^http/.test(src)) || (src instanceof URL), 'Invalid argument src.');
            src = src instanceof URL ? src : new URL(src);

            if (gettype(size, s) && /^\d+$/.test(size)) size = parseInt(size);
            if (!gettype(size, n) && !gettype(size, s)) size = "default";

            if (gettype(label, u)) {
                if (gettype(size, n)) {
                    let sizes = player.options.quality.options, matches;
                    label = sizes[0];
                    sizes.forEach(str => {
                        if ((matches = /(\d+)/.exec(str)) !== null) {
                            let num = parseInt(matches[1]);
                            if (num >= size) label = str;
                        }
                    });
                } else label = size;
            }

            Object.defineProperties(this, {
                element: {
                    enmerable: true, configurable: true, writable: false,
                    value: doc.createElement('source')
                },
                config: {
                    enmerable: false, configurable: true, writable: true,
                    value: {
                        src,
                        type,
                        label,
                        size,
                        attach: type.attach,
                        detach: type.detach
                    }
                },
                player: {
                    enmerable: false, configurable: true, writable: false,
                    value: player
                }
            });
            const el = this.element;
            el.setAttribute('src', src);
            el.setAttribute('size', size);
            el.setAttribute('type', type.type);
            el.setAttribute('label', label);
        }
    }



    class PlyrPlayerCaption {

        get src(){
            return this.config.src.href;
        }

        get lang(){
            return this.config.lang;
        }

        get srclang(){
            return this.config.srclang;
        }

        get label(){
            return this.config.label;
        }

        get id(){
            return this.config.id;
        }

        get vtt(){
            return this.element.text;
        }


        get selected(){
            return this.id === this.player.currentTrack;
        }

        constructor(player, src, srclang, label){

            assert(player instanceof PlyrPlayer, 'Invalid argument player.');
            assert((/^http/.test(src)) || (src instanceof URL), 'Invalid argument src.');
            src = src instanceof URL ? src : new URL(src);
            srclang = gettype(srclang, s) ? srclang : "und";

            let
                    lang = isoCode(srclang).lang.split(';')[0].split(',')[0].trim(),
                    id = player.tracks.length,
                    el = doc.createElement('track'),
                    data = new DataSet(el);

            label = gettype(label, s) ? label : lang;

            Object.defineProperties(this, {
                element: {
                    enmerable: true, configurable: true, writable: false,
                    value: el
                },
                config: {
                    enmerable: false, configurable: true, writable: true,
                    value: {
                        src, lang, srclang, label, id
                    }
                },
                player: {
                    enmerable: false, configurable: true, writable: false,
                    value: player
                }
            });

            el.setAttribute('kind', 'subtitles');
            el.setAttribute('label', label);
            el.setAttribute('lang', lang);
            el.setAttribute('srclang', srclang);
            el.setAttribute('id', "plyrtrack" + id);

            el.onload = el.onerror = e => {
                let
                        target = e.target,
                        src = target.src;
                if (/^blob/.test(src)) return;
                if (gettype(el.text, s)) return;
                if (data.get('loading') === true) return;
                data.set('loading', true);
                if (e.type === "error") src = "https://cors-anywhere.herokuapp.com/" + src;
                (new Request(src))
                        .then(text => {
                            let parsed = Subtitle.parse(text);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                let vtt = Subtitle.stringifyVtt(parsed);
                                if (gettype(vtt, s) && vtt.length > 0) {
                                    Object.defineProperty(el, 'text', {
                                        configurable: true, value: vtt
                                    });
                                    data.set({
                                        loading: null,
                                        src: src
                                    });
                                    target.src = URL.createObjectURL(new Blob([vtt], {type: "text/vtt"}));
                                }
                            }
                        })
                        .catch(console.warn);
            };

            el.setAttribute('src', src);
        }

    }





    class PlyrPlayer {

        get root(){
            return this.elements.root;
        }
        get video(){
            return this.elements.video;
        }

        get currentSource(){
            let result = -1;
            this.sources.forEach((source, i) => {
                if (source.selected) result = i;
            });
            return result;
        }

        set currentSource(index){

            let current = -1;
            this.sources.forEach((source, i) => {
                if (source.selected) current = i;
            });

            if (gettype(index, n) && this.sources[index] instanceof PlyrPlayerSource) {

                if (current === index) return;
                let newsource = this.sources[index];
                if (current !== -1) {
                    let source = this.sources[current];
                    source.detach(source);
                }
                this.data.set('src', newsource.src);
                newsource.attach(newsource);
                //store prefs

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
            if (gettype(title, s)) {
                this.elements.title.innerHTML = title;
                this.data.set('title', title);
                this.elements.toolbar.classList.remove('hidden');
            } else if (title === null) {
                this.elements.title.innerHTML = "";
                this.data.remove('title');
                this.elements.toolbar.classList.add('hidden');
            }
        }

        get title(){
            return this.data('title') || "";
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
                if (track instanceof PlyrPlayerCaption) return track;
            }
            return null;
        }

        get ready(){
            return new Promise(resolve => {
                if (this.isReady === true) resolve(this);
                else {
                    this.one('player.ready', () => {
                        resolve(this);
                    });
                }
            });
        }


        constructor(){

            Object.defineProperties(this, {
                elements: {
                    enmerable: false, configurable: true, writable: true,
                    value: {}
                },
                data: {
                    enmerable: false, configurable: true, writable: true,
                    value: null
                },
                plyr: {
                    enmerable: false, configurable: true, writable: true,
                    value: null
                },
                options: {
                    enmerable: false, configurable: true, writable: true,
                    value: Object.assign({}, options)
                },
                sources: {
                    enmerable: false, configurable: true, writable: true,
                    value: []
                },
                tracks: {
                    enmerable: false, configurable: true, writable: true,
                    value: []
                },
                types: {
                    enmerable: false, configurable: true, writable: true,
                    value: {}
                },
                isReady: {
                    enmerable: true, configurable: true, writable: true,
                    value: false
                }
            });

            const
                    player = this,
                    root = this.elements.root = html2element('<div class="plyr-player"/>'),
                    video = this.elements.video = html2element('<video controls crossorigin src="" preload="none" tabindex="-1" class="plyrvideo"/>'),
                    data = this.data = new DataSet(video);

            root.appendChild(video);
            this.elements.toolbar = html2element('<div class="plyr-toolbar hidden"><span class="plyr-title"></span></div>');
            this.elements.title = this.elements.toolbar.querySelector('.plyr-title');

            Events(video, this);

            this.options.listeners = {
                download(e){
                    e.preventDefault();
                    e.stopPropagation();
                    player.trigger('download');
                    return false;
                },
                quality(e){
                    let target = e.target.closest('button');
                    player.trigger('qualitychange', {
                        detail: {
                            quality: target.value,
                            plyr: player.plyr
                        }
                    });
                    return false;
                }
            };

            let position = 0;

            const listeners = {
                ready(){
                    player.isReady = true;
                    player.trigger('player.ready');
                },
                qualitychange(e){
                    if (e.detail !== undef) {
                        if (player.currentSource === -1 && e.detail.init !== true) return;
                        position = video.currentTime;
                        if (gettype(e.detail.quality, s)) player.quality = e.detail.quality;
                    }
                },

                player: {
                    trackchange(e){
                        let {track} = e.detail;
                        if (gettype(track.vtt, s)) {
                            track.element.src = URL.createObjectURL(new Blob([track.text], {type: "text/vtt"}));
                        }
                    }
                },

                languagechange(e){
                    let {plyr} = e.detail;
                    let
                            tn = plyr.captions.currentTrack,
                            active = plyr.captions.active;
                    plyr.elements.buttons.download.hidden = true;

                    if (tn !== -1 && active === true) {
                        let track = player.tracks[tn];
                        player.trigger('player.trackchange', {
                            detail:{
                                track: track,
                                plyr: plyr
                            }
                        });
                        plyr.elements.buttons.download.hidden = null;
                    }
                },
                captionsenabled(e){
                    let {plyr} = e.detail;
                    plyr.elements.buttons.download.hidden = true;
                    if (player.currentTrack instanceof  PlyrPlayerCaption) plyr.elements.buttons.download.hidden = null;

                },
                captionsdisabled(e){
                    let {plyr} = e.detail;
                    plyr.elements.buttons.download.hidden = true;
                },
                loadedmetadata(){
                    if (player.currentTrack instanceof PlyrPlayerCaption) {
                        player.trigger('player.trackchange', {
                            detail:{
                                track: player.currentTrack,
                                plyr: player.plyr
                            }
                        });
                    }

                    if (typeof position === n && position > 0) {
                        this.currentTime = position;
                        video.play();
                    }
                    position = 0;
                },
                controlshidden(){
                    player.elements.toolbar.hidden = true;
                },
                controlsshown(){
                    player.elements.toolbar.hidden = null;
                },
                download(e){
                    let track = player.currentTrack;
                    if (track instanceof PlyrPlayerCaption && gettype(track.vtt, s)) {
                        let file = data.get('filename') || data.get('title') || "subtitles";
                        file = sanitizeFileName(file, ' ');
                        file += '.' + track.srclang + '.srt';
                        Text2File(track.text, filename);
                    }
                }
            };

            Object.keys(listeners).forEach(type => {
                if (gettype(listeners[type], f)) this.on(type, listeners[type]);
                else if (isPlainObject(listeners[type])) {
                    Object.keys(listeners[type]).forEach(t => {
                        if (gettype(listeners[type][t], f)) {
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

            this.addType(
                    'hls',
                    source => {

                        let options = {
                            enableWebVTT: false,
                            enableCEA708Captions: false
                        };

                        let hls = source.hls = new Hls(options);

                        hls.on(Hls.Events.MANIFEST_PARSED, function(){ });
                        hls.on(Hls.Events.MEDIA_ATTACHED, function(){
                            hls.loadSource(source.src);
                        });
                        hls.attachMedia(video);

                    },
                    source => {
                        if (source.hls) {
                            source.hls.destroy();
                            delete source.hls;
                        }

                    }
            );

            this.addType(
                    'dash',
                    source => {
                        let dash = source.dash = dashjs.MediaPlayer().create();
                        dash.initialize();
                        dash.setAutoPlay(false);
                        dash.attachView(video);
                        dash.attachSource(source.src);
                    },
                    source => {
                        if (source.dash) {
                            source.dash.reset();
                            delete source.dash;
                        }

                    }
            );
        }


        addType(type, attach, detach){
            if (gettype(type, s) && gettype(this.types[type], u)) {
                this.types[type] = new PlyrPlayerType(this, type, attach, detach);
                return true;
            }
            return false;
        }

        addSource(src, size, type, attach, detach){

            if (/^http/.test(src) || src instanceof URL) {
                type = type || "mp4";
                if(this.types[type] instanceof PlyrPlayerType){
                    let source = new PlyrPlayerSource(this, this.types[type], src, size);
                    if(gettype(attach, f)) source.attach = attach;
                    if(gettype(detach, f)) source.detach = detach;
                    this.sources.push(source);
                    this.video.appendChild(source.element);
                    return true;
                }
            }
            return false;
        }
        
        addCaption(src, srclang, label){
            if (/^http/.test(src) || src instanceof URL) {
                let track = new PlyrPlayerCaption(this, src, srclang, label);
                this.tracks.push(track);
                this.video.appendChild(track.element);
                return true;
            }
            return false;
        }



        reset(){


        }


        start(root){










        }
        
        




    }


    class PlyrPlayerOld {




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
                let storage = this.plyr.storage.get() || {};
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

                        prequire('Hls').then(exports => {
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
                        if (source.hls) {
                            source.hls.destroy();
                            delete source.hls;
                        }

                    }
            );

            this.addSourceType(
                    'dash',
                    source => {
                        prequire('dashjs').then(exports => {
                            let {dashjs} = exports,
                            player = source.dash = dashjs.MediaPlayer().create();
                            player.initialize();
                            player.setAutoPlay(false);
                            player.attachView(video);
                            player.attachSource(source.src);
                        });
                    },
                    source => {
                        if (source.dash) {
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
                                prequire('Subtitle').then(exports => {
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

            if (this.starting === true) return;
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
                prequire('Plyr').then(exports => {
                    let {Plyr} = exports;
                    PlyrPlayer.setStyles();
                    let plyr = this.plyr = new Plyr(this.video, this.options);
                });
            }
        }

    }

    loadcss(sprintf(cfg.path, cfg.version) + '.css');
    loadcss(config.get('root') + 'css/player.css');
    return {PlyrPlayer, PlyrPlayerType, PlyrPlayerSource, dashjs, Hls, Plyr};
}));








