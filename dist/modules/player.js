/**
 * Module player
 */
(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'player',
            dependencies = [
                'require',

                'utils', 'config', 'storage', 'cache', 'isocode', 'Request',
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
}(typeof self !== 'undefined' ? self : this, function h27jb09534f10ckayj3dt(require){


    const
            utils = require('utils'),
            config = require('config'),
            storage = require('storage'),
            cache = require('cache'),
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


    const
            options = {

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



            },
            //svg icons
            icons = {
                cog: '#gm-cog',
                clipboard: 'gm-clipboard',
                code: '#gm-code',
                cc: '#gm-cc',
                popcorn: '#gm-popcorn',
                film: '#gm-film',
                tvalt: '#gm-tvalt',
                tvretro: '#gm-tvretro',
                arrowright: '#gm-arrowright',
                arrowleft: '#gm-arrowleft'
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
                    enumerable: false, configurable: true, writable: false,
                    value: {type, attach, detach}
                },
                player: {
                    enumerable: false, configurable: true, writable: false,
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
                    enumerable: true, configurable: true, writable: true,
                    value: doc.createElement('source')
                },
                config: {
                    enumerable: false, configurable: true, writable: true,
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
                    enumerable: false, configurable: true, writable: false,
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
                    enumerable: true, configurable: true, writable: true,
                    value: el
                },
                config: {
                    enumerable: false, configurable: true, writable: true,
                    value: {
                        src, lang, srclang, label, id, vtt: null
                    }
                },
                player: {
                    enumerable: false, configurable: true, writable: false,
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
                        console.debug('Creating Track Cue for', this.lang, 'track.');
                        subs
                                .map(entry => new VTTCue(entry.start / 1000, entry.end / 1000, entry.text))
                                .forEach(entry => tt.addCue(entry));
                    }
                }
            });
        }


        load(src){

            if (this.loaded) return;
            if (this.loading === true) return;
            this.loading = true;
            console.debug('Loads', this.lang, 'subtitle track', this.src);

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
                            this.loading = false;
                            this.trigger('loaded');
                        }
                    })
                    .catch(err => {
                        console.warn(err);
                        if (gettype(src, u)) {
                            src = "https://cors-anywhere.herokuapp.com/" + this.src;
                            this.loading = false;
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
                    enumerable: false, configurable: true, writable: true,
                    value: {}
                },
                toolbar: {
                    enumerable: false, configurable: true, writable: true,
                    value: null
                },
                data: {
                    enumerable: false, configurable: true, writable: true,
                    value: null
                },
                plyr: {
                    enumerable: false, configurable: true, writable: true,
                    value: null
                },
                options: {
                    enumerable: false, configurable: true, writable: true,
                    value: Object.assign({}, options)
                },
                storage: {
                    enumerable: true, configurable: true, writable: false,
                    value: new exStore(new xStore(localStorage), 'plyr')
                },
                sources: {
                    enumerable: false, configurable: true, writable: true,
                    value: []
                },
                tracks: {
                    enumerable: false, configurable: true, writable: true,
                    value: []
                },
                types: {
                    enumerable: false, configurable: true, writable: true,
                    value: {}
                },
                isReady: {
                    enumerable: true, configurable: true, writable: true,
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
                progress(e){


                    //save position(pause will be better)



                    //check subtitles loaded
                    let track = this.currentTrack, enabled = this.plyr.captions.active;
                    if (track instanceof PlyrPlayerCaption && enabled === true) {
                        let cttcues = track.textTrack.cues;
                        if (cttcues instanceof TextTrackCueList) {
                            if (track.loaded) {
                                if (cttcues.length === 0) track.trigger('loaded');
                            } else track.load();
                        }
                    }

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
                    if (track instanceof PlyrPlayerCaption ) {
                        let file = data.get('filename') || data.get('title') || "subtitles";
                        file = sanitizeFileName(file, ' ');
                        file += '.' + track.srclang + '.srt';
                        
                        if(!track.loaded){
                            track.one('loaded', ev=>{
                                Text2File(track.srt, file);
                            });
                            track.load();
                        } else Text2File(track.srt, file);
                        
                        

                    }
                }
            };

            const deep = function(obj, prefix = ''){

                let type;
                Object.keys(obj).forEach(key => {
                    type = prefix + key;
                    if (gettype(obj[key], f)) {
                        player.on(type, obj[key]);
                    } else if (isPlainObject(obj[key])) {
                        deep(obj[key], type + '.');
                    }
                });
            };


            deep(listeners);




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

            this.toolbar = new PlyrToolbar(this);

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
            this.isReady = false;
        }


        start(root){

            if (root instanceof Element) {


                this.ready.then(player => {
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
                    } this.trigger('ready');

                });


            }

        }
        

    }


    class PlyrToolbar {

        get sprite(){
            if (!PlyrToolbar._sprite)
                PlyrToolbar._sprite = doc.querySelector('#plyr-player-sprite') || html2element('<div id="plyr-player-sprite" hidden/>');
            if (PlyrToolbar._sprite.parentElement === null) doc.body.insertBefore(PlyrToolbar._sprite, doc.body.firstElementChild);
            return PlyrToolbar._sprite;
        }


        loadSprite(){
            if (PlyrToolbar.loading !== true) {
                PlyrToolbar.loading = true;
                let
                        hit = false,
                        loaded = false,
                        key = 'toolbar.svg',
                        url = config.get('paths.images') + key,
                        elem = this.sprite,
                        etype = 'toolbar.ready';

                //if (elem.innerHTML !== "") loaded = true;


                if (cache.enabled) {
                    if (loaded === false) {
                        let xml = cache.loadItem(key);
                        if (gettype(xml, s) && xml.length > 0) {
                            elem.innerHTML = xml;
                            hit = true;
                        }
                    } else hit = true;

                }
                if (hit === false) {
                    (new Request(url))
                            .fetch()
                            .then(r => {
                                if (r.text && r.text.length > 0) {
                                    if (cache.enabled === true) cache.saveItem(key, r.text);
                                    elem.innerHTML = r.text;
                                    this.trigger(etype);
                                } else throw new Error('Invalid Response');

                            })
                            .catch(err => {
                                console.warn('Cannot get Sprite at', url, err);
                                PlyrToolbar.loading = false;
                            });

                } else this.trigger(etype);

            }



        }

        get buttons(){
            return this.elements.buttons;
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
            this.root.hidden = flag === true ? true : null;

        }

        get ready(){
            return new Promise(resolve => {

                if (!this.isReady) {
                    this.one('toolbar.ready', () => {
                        resolve(this);
                    });

                } else resolve(this);

            });
        }

        constructor(player){


            assert(player instanceof PlyrPlayer, 'Invalid argument player.');

            Object.defineProperties(this, {
                elements: {
                    enumerable: false, configurable: true, writable: true,
                    value: {
                        root: '<div class="plyr-toolbar hidden"/>',
                        title: '<span class="plyr-title"/>',
                        icon: '<svg><use xlink:href="#gm-film"></use></svg>',
                        areas: {
                            left: '<div class="plyr-toolbar-left"/>',
                            right: '<div class="plyr-toolbar-right"/>'
                        },
                        buttons: {
                            title: '<span class="plyr-toolbar-btn" data-name="title"/>'
                        }
                    }
                },
                listeners: {
                    enumerable: false, configurable: true, writable: true,
                    value: {
                        buttons: {
                            click: {},
                            contextmenu: {}
                        }
                    }
                },
                icons: {
                    enumerable: false, configurable: true, writable: true,
                    value: icons
                },
                data: {
                    enumerable: false, configurable: true, writable: true,
                    value: player.data
                },
                player: {
                    enumerable: false, configurable: true, writable: true,
                    value: player
                },
                isReady: {
                    enumerable: true, configurable: true, writable: true,
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
                    data = this.data,
                    toolbar = this;
                    

            H2EL(this.elements);

            this.elements.buttons.title.appendChild(this.elements.title);
            this.elements.buttons.title.appendChild(this.elements.icon);
            this.elements.areas.left.appendChild(this.elements.buttons.title);
            this.root.appendChild(this.elements.areas.left);
            this.root.appendChild(this.elements.areas.right);

            Events(this.root, this);



            const
                    listeners = {


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

                    },
                    internals = {
                        toolbar: {
                            ready(){
                                toolbar.isReady = true;
                                toolbar.root.classList.remove('hidden');
                            }
                        },
                        click(e){
                            let target = e.target.closest('.plyr-toolbar-btn');
                            if (target instanceof Element) {
                                e.preventDefault();
                                e.stopPropagation();
                                let name = target.dataset.name;
                                let callback = toolbar.listeners.buttons[e.type][name];
                                if (gettype(callback, f)) callback.call(player, e);
                                toolbar.trigger(name + '.click');
                            }
                        },
                        contextmenu(e){
                            let target = e.target.closest('.plyr-toolbar-btn');
                            if (target instanceof Element) {
                                e.preventDefault();
                                e.stopPropagation();
                                let name = target.dataset.name;
                                let callback = toolbar.listeners.buttons[e.type][name];
                                if (gettype(callback, f)) callback.call(player, e);
                                toolbar.trigger(name + '.context');
                            }

                        }


                    };


            const deep = function(target, obj, prefix = ''){

                let type;
                Object.keys(obj).forEach(key => {
                    type = prefix + key;
                    if (gettype(obj[key], f)) {
                        target.on(type, obj[key]);
                    } else if (isPlainObject(obj[key])) {
                        deep(target, obj[key], type + '.');
                    }
                });
            };
            deep(player, listeners);
            deep(this, internals);
            this.loadSprite();


            player.ready.then(() => {
                player.video.parentElement.appendChild(this.root);
                this.title = data.get('title');
            });


        }

        /**
         * Adds a button to the toolbar
         * @param {string} name
         * @param {string} title
         * @param {string} icon
         * @param {function} onClick
         * @param {function|undefined} [onContext]
         */
        addButton(name, title, icon, onClick, onContext){
            assert(/^\w+$/.test(name), 'Invalid Argument name.');
            assert(gettype(title, s), 'Invalid Argument title.');
            assert(Object.keys(this.icons).includes(icon), 'Invalid Argument icon (available: %s).', Object.keys(this.icons).join(', '));
            assert(gettype(onClick, f), 'Invalid Argument onClick.');

            let
                    button = html2element('<span class="plyr-toolbar-btn"/>'),
                    icon_el = html2element(sprintf('<svg><use xlink:href="%s"></use></svg>', this.icons[icon])),
                    title_el = doc.createElement('span');


            button.dataset.name = name;

            button.appendChild(title_el);
            button.appendChild(icon_el);
            this.elements.buttons[name] = button;
            this.listeners.buttons.click[name] = onClick;
            if (gettype(onContext)) this.listeners.buttons.contextmenu[name] = onContext;

            Object.defineProperty(button, 'title', {
                configurable: true, enumerable: false,
                get(){

                    return this.getAttribute('title') !== null;
                },
                set(val){
                    this.removeAttribute('title');
                    title_el.innerHTML = "";
                    if (gettype(val, s)) {
                        title_el.innerHTML = val;
                        this.setAttribute('title', val);
                    }
                }
            });

            button.title = title;
            this.elements.areas.right.insertBefore(button, this.elements.areas.right.firstChildElement);
            return button;
        }

        /**
         * Removes a button from the toolbar
         * @param {string} name
         */
        removeButton(name){
            assert(/^\w+$/.test(name), 'Invalid Argument name.');

            if (this.elements.buttons[name] instanceof Element) {
                this.elements.buttons[name].remove();
                ['click', 'contextmenu'].forEach(type => {
                    if (gettype(this.listeners.buttons[type][name], f)) delete this.listeners.buttons[type][name];
                });
                delete this.elements.buttons[name];
            }

        }


    }


    loadcss(sprintf(cfg.path, cfg.version) + '.css');
    loadcss(config.get('paths.styles') + 'player.css');
    return {PlyrPlayer, PlyrPlayerType, PlyrPlayerSource, PlyrPlayerCaption};
}));








