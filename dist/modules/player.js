/**
 * Module player
 */
(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'player',
            dependencies = [
                'require',

                'utils', 'config', 'storage', 'isocode', 'Request',
                        'Plyr', 'Subtitle', 'Hls'
                        //, 'dashjs'
            ];
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
}(typeof self !== 'undefined' ? self : this, function h27jb09534f10ckayj3dt(require, utils, config, storage){


    const
            Request = require('Request'),
            isocode = require('isocode'),
            Subtitle = require('Subtitle'),
            Plyr = require('Plyr'),
            Hls = require('Hls');



    const {
        doc, loadcss, sprintf, gettype,
        s, f, u, n, b, assert, Events,
        DataSet, html2element, Text2File,
        isPlainObject, prequire, sanitizeFileName
        } = utils;
    const {xStore, exStore} = storage;
    const cfg = config.get('Plyr');

    let undef, dashjs;
    //, Plyr, Subtitle, Hls;


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
            return 'video/' + this.config.type;
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
            if (!gettype(size, 'int') && !gettype(size, s)) size = "default";

            if (gettype(label, u)) {
                if (gettype(size, 'int')) {
                    let sizes = player.options.quality.options, matches;
                    label = sizes[0];
                    sizes.forEach(str => {
                        if ((matches = /(\d+)/.exec(str)) !== null) {
                            let num = parseInt(matches[1]);
                            if (num >= size) label = str;
                        }
                    });

                    if (/^\d+$/.test(label)) label += 'p';

                } else label = size;
            }

            Object.defineProperties(this, {
                element: {
                    enmerable: true, configurable: true, writable: true,
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
            let result;
            if (this.loaded) {
                result = Subtitle.stringifyVtt(this.config.subtitles);
            }
            return result;
        }

        get srt(){
            let result;
            if (this.loaded) {
                result = Subtitle.stringify(this.config.subtitles);
            }
            return result;
        }

        get subtitles(){
            return this.config.subtitles;
        }

        get loaded(){
            return Array.isArray(this.subtitles) && this.subtitles.length > 0;
        }


        get selected(){
            return this.id === this.player.currentTrack;
        }

        get textTrack(){
            let track = this, tt;
            let
                    id = track.element.id,
                    tts = this.player.video.textTracks;
            for (let i = 0; i < tts.length; i++) {
                let ctt = tts[i];
                if (id === ctt.id) {
                    tt = ctt;
                    break;
                }
            }
            return tt;
        }



        constructor(player, src, srclang, label){

            assert(player instanceof PlyrPlayer, 'Invalid argument player.');
            assert((/^http/.test(src)) || (src instanceof URL), 'Invalid argument src.');
            src = src instanceof URL ? src : new URL(src);
            srclang = gettype(srclang, s) ? srclang : "und";

            let
                    lang = isocode(srclang).lang.split(';')[0].split(',')[0].trim(),
                    id = player.tracks.length,
                    el = doc.createElement('track'),
                    data = new DataSet(el);

            label = gettype(label, s) ? label : lang;

            Object.defineProperties(this, {
                element: {
                    enmerable: true, configurable: true, writable: true,
                    value: el
                },
                config: {
                    enmerable: false, configurable: true, writable: true,
                    value: {
                        src, lang, srclang, label, id, vtt: null
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
            el.setAttribute('data-src', src.href);
            Events(el, this);
            this.on('loaded', e => {
                e.stopPropagation();
                if (this.loaded) {
                    let tt = this.textTrack, subs = this.subtitles;
                    if (tt.cues.length !== subs.length) {
                        subs
                                .map(entry => new VTTCue(entry.start / 1000, entry.end / 1000, entry.text))
                                .forEach(entry => tt.addCue(entry));
                    }
                }
            });
        }


        load(src){

            if (this.loaded) return;

            if (src instanceof URL) src = src.href;
            let url = /^http/.test(src) ? src : this.src;
            (new Request(url))
                    .fetch()
                    .then(r => {

                        let
                                text = r.text,
                                parsed = Subtitle.parse(text);

                        if (Array.isArray(parsed) && parsed.length > 0) {
                            this.config.subtitles = parsed;
                            this.trigger('loaded');
                        }
                    })
                    .catch(err => {
                        console.warn(err);
                        if (gettype(src, u)) {
                            src = "https://cors-anywhere.herokuapp.com/" + this.src;
                            this.load(src);
                        }
                    });

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

            if (gettype(index, 'int') && this.sources[index] instanceof PlyrPlayerSource) {
                if (current === index) return;

                let newsource = this.sources[index];
                if (current !== -1) {
                    let source = this.sources[current];
                    source.detach(source);
                    //this.tracks.forEach(track => track.element.remove());
                }
                this.data.set('src', newsource.src);
                newsource.attach(newsource);

                //store prefs
                this.storage.set('quality', newsource.label);
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
                this.data.set('title', title);
            } else if (title === null) {
                this.data.remove('title');
            }

            this.trigger('player.title', {
                detail: {
                    plyr: this.plyr,
                    title: this.data.get('title') || ""
                }
            });
        }

        get title(){
            return this.data.get('title') || "";
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

        get currentTextTrack(){
            let track = this.currentTrack;
            if (track instanceof PlyrPlayerCaption) {
                return track.textTrack;
            }
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

        get loaded(){
            return new Promise(resolve => {
                
                if(this.sources.some(source=> source.type === "dash")){
                    prequire('dashjs')
                            .then(exp => {
                                dashjs = exp.dashjs;
                                resolve(this);
                            })
                            .catch(() => {
                                console.warn('Cannot Load dashjs.');
                            });
                } else resolve(this);

            });
        }


        constructor(){

            Object.defineProperties(this, {
                elements: {
                    enmerable: false, configurable: true, writable: true,
                    value: {}
                },
                toolbar: {
                    enmerable: false, configurable: true, writable: true,
                    value: null
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
                storage: {
                    enmerable: true, configurable: true, writable: false,
                    value: new exStore(new xStore(localStorage), 'plyr')
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
                    video = this.elements.video = html2element('<video controls crossorigin="" src="" preload="none" tabindex="-1" class="plyrvideo"/>'),
                    data = this.data = new DataSet(video);

            root.appendChild(video);

            Events(video, this);

            this.options.listeners = {
                download(e){
                    e.preventDefault();
                    e.stopPropagation();
                    player.trigger('download');
                    return false;
                },
                quality(e){
                    e.preventDefault();
                    e.stopPropagation();
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
                        let cttcues = track.textTrack.cues;

                        if (cttcues instanceof TextTrackCueList) {
                            if (track.loaded) {
                                if (cttcues.length === 0) track.trigger('loaded');
                            } else track.load();
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
                download(e){
                    let track = player.currentTrack;
                    if (track instanceof PlyrPlayerCaption && track.loaded) {
                        let file = data.get('filename') || data.get('title') || "subtitles";
                        file = sanitizeFileName(file, ' ');
                        file += '.' + track.srclang + '.srt';
                        Text2File(track.srt, file);
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
                this.addType(type, source => {
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
                if (this.types[type] instanceof PlyrPlayerType) {
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

            if (!this.video.paused) {
                this.video.pause();
            }
            if (this.currentTime > 0) this.currentTime = 0;
            let source = this.sources[this.currentSource];
            if (source instanceof PlyrPlayerSource) {
                source.detach(source);
            }
            this.title = null;
            this.data.clear();
            this.video.poster = null;
            this.tracks = [];
            this.sources = [];
            this.video.innerHTML = "";
        }


        start(root){

            if (root instanceof Element) {


                this.ready.then(player => {

                    if (this.toolbar === null) this.toolbar = new PlyrToolbar(this);

                    this.root.querySelectorAll('button[data-plyr="quality"][value]').forEach(btn => {
                        btn.disabled = true;
                        if (this.sources.map(x => x.label).includes(btn.value)) btn.disabled = null;
                    });

                    let
                            quality = player.storage.get('quality') || null,
                            index = player.sources.map(x => x.label).indexOf(quality);
                    if (index === -1 && player.sources.length > 0) index = 0;

                    if (index !== -1) {

                        player.trigger('qualitychange', {
                            detail: {
                                quality: player.sources[index].label,
                                plyr: player.plyr,
                                init: true
                            }
                        });

                    }


                });
                this.loaded.then(()=>{
                    if (this.root.parentElement !== root) {
                        root.innerHTML = "";
                        root.appendChild(this.root);
                    }
                    if (this.plyr === null) {
                        this.plyr = new Plyr(this.video, this.options);
                    }
                });


            }

        }
        

    }


    class PlyrToolbar {

        static loadSprite(){
            if (this.loaded !== false) {








            }
        }


        get root(){
            return this.elements.root;
        }

        get title(){
            return this.elements.title.innerHTML;
        }
        set title(title){
            this.elements.title.innerHTML = "";
            if (gettype(title, s)) this.elements.title.innerHTML = title;
            else if (title instanceof Element) {
                this.elements.title.innerHTML = "";
                this.elements.title.appendChild(title);
            } else if (title === null) {
                this.elements.title.innerHTML = "";
            }
        }

        get hidden(){
            return this.root.hidden === true;
        }

        set hidden(flag){
            if (gettype(flag, b)) this.root.hidden = flag === true ? true : null;

        }




        constructor(player){


            assert(player instanceof PlyrPlayer, 'Invalid argument player.');

            Object.defineProperties(this, {
                elements: {
                    enmerable: false, configurable: true, writable: true,
                    value: {
                        root: '<div class="plyr-toolbar"/>',


                        title: '<span class="plyr-title"/>',
                        icon: '<svg><use xlink:href="#gm-film"></use></svg>',
                        sprite: '<div id="sprite-plyr-player" />',

                        areas: {
                            left: '<div class="plyr-toolbar-left"/>',
                            center: '<div class="plyr-toolbar-center"/>',
                            right: '<div class="plyr-toolbar-right"/>'
                        },
                        buttons: {
                            title: '<span class="plyr-toolbar-btn"/>'
                        }
                    }
                },
                data: {
                    enmerable: false, configurable: true, writable: true,
                    value: null
                },
                options: {
                    enmerable: false, configurable: true, writable: true,
                    value: Object.assign({}, options)
                },
                storage: {
                    enmerable: true, configurable: true, writable: false,
                    value: new exStore(new xStore(localStorage), 'plyr')
                },
                player: {
                    enmerable: false, configurable: true, writable: true,
                    value: player
                },
                isReady: {
                    enmerable: true, configurable: true, writable: true,
                    value: false
                }
            });

            const
                    H2EL = function(obj){

                        if (isPlainObject(obj)) {
                            Object.keys(obj).forEach(key => {
                                if (gettype(obj[key], s)) obj[key] = html2element(obj[key]);
                                else if (isPlainObject(obj[key])) H2EL(obj[key]);
                            });
                        }
                    },
                    pdata = player.data,
                    toolbar = this;
                    

            H2EL(this.elements);
            this.elements.buttons.title.appendChild(this.elements.icon);
            this.elements.buttons.title.appendChild(this.elements.title);
            this.elements.areas.left.appendChild(this.elements.buttons.title);
            this.root.appendChild(this.elements.areas.left);
            this.root.appendChild(this.elements.areas.center);
            this.root.appendChild(this.elements.areas.right);
            player.video.parentElement.appendChild(this.root);

            this.title = pdata.get('title');


            const listeners = {
                player: {
                    title(e){
                        toolbar.title = e.detail.title;
                    }
                },
                controlshidden(){
                    toolbar.hidden = true;
                },
                controlsshown(){
                    toolbar.hidden = false;
                }

            };

            Object.keys(listeners).forEach(type => {
                if (gettype(listeners[type], f)) player.on(type, listeners[type]);
                else if (isPlainObject(listeners[type])) {
                    Object.keys(listeners[type]).forEach(t => {
                        if (gettype(listeners[type][t], f)) {
                            player.on(type + '.' + t, listeners[type][t]);
                        }
                    });
                }
            });





        }






    }


    loadcss(sprintf(cfg.path, cfg.version) + '.css');
    loadcss(config.get('root') + 'css/player.css');
    return {PlyrPlayer, PlyrPlayerType, PlyrPlayerSource, PlyrPlayerCaption};
}));








