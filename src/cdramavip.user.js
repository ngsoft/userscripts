// ==UserScript==
// @version      1.0.1
// @name         CDRAMA Downloader
// @description  FIX Stream + download stream (FFMPEG)
// @namespace    https://github.com/ngsoft/userscripts
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.0/dist/gmutils.min.js
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @run-at      document-body
// @noframes
//
// @include     /^https?:\/\/(www\.)?(5nj\.com|zhuijukan\.com|16ys\.net)\//
// @icon        https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/altvideo.png
// ==/UserScript==


((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    //week
    //const cache = new LSCache(UUID, 604800);

    const rload = new rloader(UUID, week);

    //clear cache on upgrade
    (() => {
        let last = localStorage.getItem(UUID);
        if (last !== GMinfo.script.version) rload.clear();
        localStorage.setItem(UUID, GMinfo.script.version);
    })();
    
    //disables KodiRPC (m3u8 hangs severely)
    on.body(() => {
        Object.defineProperty(doc.body, 'KodiRPCModule', {
            value: "off", configurable: true
        });
    });


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



    class Settings {
        

        open(callback){
            if (typeof callback === f) this.one('settings.open', callback);
            this.elements.inputs.save.disabled = true;

            //doc.body.insertBefore(this.elements.root, doc.body.firstChild);
            this.player.plyr.elements.container.insertBefore(this.elements.root, this.player.plyr.elements.container.firstChild);

            this.elements.inputs.autoplay.focus();
            this.trigger('settings.open');
        }


        close(callback){
            if (typeof callback === f) this.one('settings.close', callback);
            this.trigger('settings.close');
            this.elements.root.remove();
        }

        save(){
            const self = this;
            Object.keys(self.elements.inputs).forEach(name => {
                Events(self.elements.inputs[name]).trigger("save");
            });
            this.trigger('settings.saved');
        }
        
        
        constructor(player, open, close){
            const self = this;
            this.player = player;
            this.settings = player.settings;
            this.elements = {
                root: html2element(
                        `<div class="alt-dialog no-select" oncontextmenu="return false;">
                        <form class="alt-container">
                            <fieldset class="alt-body">
                                <legend class="alt-title">
                                    ${GMinfo.script.name} Settings
                                </legend>
                                <button class="close-bt" name="close">&times;</button>
                
                                <div class="form-el">
                                    <label class="form-label" style="display: inline-block;">Autoplay Video</label>
                                    <span class="switch round">
                                        <input type="checkbox" name="autoplay" title="Autoplay Video"/>
                                        <span class="slider"></span>
                                        
                                    </span>
                                </div>
                
                                <div class="form-el">
                                    <label class="form-label">FFMPEG Params</label>
                                    <input class="form-input" type="text" name="ffmpeg" value="${self.settings.get('ffmpeg')}" placeholder="FFMPEG Params ..." required />
                                </div>


                                <div class="form-el">
                                    <label class="form-label">Translations</label>
                                    <span class="select-wrapper">
                                        <select title="Translations" name="translations" class="" data-placeholder="Select Name ..."></select>
                                    </span>
                                    <input type="text" placeholder="Translate to ..." title="Translation" name="translateto" class="form-input" disabled />
                                </div>
                
                                <div class="alt-footer">
                                        <button class="bt-black" type="reset" name="reset">Reset</button>
                                        <button class="bt-red" name="save">Save</button>
                                    </div>
                            </fieldset>
                        </form>
                    </div>`),
                inputs: {}
            };
            this.elements.form = this.elements.root.querySelector('form.alt-container');
            this.elements.body = this.elements.form.querySelector('.alt-body');
            this.elements.form.querySelectorAll('[name]').forEach(input => {
                self.elements.inputs[input.name] = input;
            });

            self.elements.inputs.autoplay.data("checked", self.settings.get("autoplay") === true);
            self.elements.inputs.autoplay.checked = self.elements.inputs.autoplay.data("checked");


            const btevents = {
                close(){
                    self.elements.body.classList.remove('fadeIn', 'bounceOut');
                    self.elements.body.classList.add('bounceOut');
                    setTimeout(() => {
                        self.close();
                    }, 750);
                },
                reset(){
                    Object.keys(self.elements.inputs).forEach(name => {
                        Events(self.elements.inputs[name]).trigger("reset");
                    });
                },
                save(){
                    self.save();
                }
            };


            const evts = {
                root: {
                    click(e){
                        //if (e.button !== 0) return;
                        let target = e.target, button, name;
                        if ((button = target.closest('button')) !== null) {
                            name = button.name;
                            if (typeof btevents[name] === f) {
                                btevents[name].call(this, e);
                                //e.preventDefault();
                                //e.stopPropagation();
                                //return;
                            }
                        }
                        else if (target.closest('.alt-body') !== null) return;

                        e.preventDefault();
                        e.stopPropagation();
                        //self.elements.inputs.host.focus();
                        //btevents.close();
                    }
                },
                form: {
                    submit(e){
                        e.preventDefault();
                        e.stopPropagation();
                    },
                    change(e){
                        evts.form.submit.call(this, e);
                        self.elements.inputs.save.disabled = null;
                    },
                    reset(e){
                        evts.form.submit.call(this, e);
                    },
                    keydown(e){

                        switch (e.keyCode) {
                            //tab
                            case 9:
                            //enter
                            case 13:
                                if (e.target === self.elements.inputs.ffmpeg) {
                                    self.elements.inputs.translations.focus();
                                } else if (e.target === self.elements.inputs.translateto) {
                                    self.elements.inputs.autoplay.focus();
                                } else if (e.target === self.elements.inputs.autoplay) {
                                    self.elements.inputs.ffmpeg.focus();
                                }
                                e.preventDefault();
                                e.stopPropagation();

                                break;
                                //escape
                            case 27:
                                btevents.close();
                                e.preventDefault();
                                e.stopPropagation();
                                break;

                            default:
                                break;
                        }
                    }
                },
                inputs: {
                    save: {
                        reset(){
                            this.disabled = true;
                        }
                    },
                    ffmpeg: {
                        save(){
                            if (this.value.length > 0) {
                                self.settings.set("ffmpeg", this.value);
                            }
                        }
                    },
                    translations: {
                        ready(e){

                            const select = this;
                            self.translations = self.settings.get('translations');
                            Object.keys(self.translations).forEach(k => {
                                select.appendChild(html2element(`<option value="${k}">${k}</option>`));
                            });

                        },
                        change(e){
                            e.preventDefault();
                            e.stopPropagation();
                            this.classList.remove("placeholder");
                            const input = self.elements.inputs.translateto;
                            input.disabled = null;
                            input.data('key', this.value);
                            input.value = self.translations[this.value];
                            input.focus();
                        },
                        init(e){
                            let p = this.data("placeholder") || "";
                            if (p.length > 0) {
                                this.querySelectorAll('option').forEach(x => x.remove());
                                this.classList.add("placeholder");
                                let o = html2element(`<option value="" disabled hidden selected/>`);
                                this.insertBefore(o, this.firstChild);
                                o.innerHTML = p;
                                this.selectedIndex = 0;
                            }
                            Events(this).trigger('ready');
                        },
                        reset(e){
                            this.selectedIndex = 0;
                            Events(this).trigger("init");
                        },
                        save(){
                            self.settings.set('translations', self.translations);
                        }
                    },
                    translateto: {
                        reset(){
                            this.value = "";
                            this.disabled = true;
                        },
                        change(e){
                            let key = this.data("key");
                            self.translations[key] = this.value;
                        }
                    },
                    autoplay: {
                        reset(){
                            this.checked = this.data("checked");
                        },
                        save(){
                            self.settings.set("autoplay", this.checked === true);
                        }
                    }
                }
            };

            new Events(self.elements.form, self);
            if (typeof open === f) self.one('settings.open', open);
            if (typeof close === f) self.one('settings.close', close);

            Object.keys(evts.root).forEach(evt => {
                self.elements.root.addEventListener(evt, evts.root[evt]);
            });
            Object.keys(evts.form).forEach(evt => {
                self.elements.form.addEventListener(evt, evts.form[evt]);
            });

            Object.keys(evts.inputs).forEach(input => {
                Object.keys(evts.inputs[input]).forEach(evt => {
                    self.elements.inputs[input].addEventListener(evt, evts.inputs[input][evt]);
                });
            });

            self.on('settings.saved', () => {
                btevents.close();
            });

            self.open(() => {
                Object.keys(self.elements.inputs).forEach(name => {
                    Events(self.elements.inputs[name]).trigger("init");
                });
            });
        }

    }




    class ToolBar {

        get src() {
            return this.player.src;
        }

        get title() {
            return this.player.videotitle + ".mp4";
        }

        get jdlink() {
            let url = new URL(this.src);
            url.searchParams.set('jdtitle', this.title);
            return url.href;
        }

        get ffmpeg() {
            let cmd = "echo " + this.title + "\n";
            cmd += `ffmpeg ${this.player.settings.get('ffmpeg')} "${this.src}" -c copy "${this.title}"`;
            cmd += "\n";
            return cmd;
        }


        constructor(videoplayer) {
            const self = this;
            Object.assign(this, {
                player: videoplayer,
                video: videoplayer.video,
                target: videoplayer.video.parentElement,
                elements: {
                    toolbar: html2element('<div class="altvideo-toolbar no-select" />'),
                    buttons: {
                        settings: html2element(`<a href="" class="settings-bt left"><span class="settings-icn"><svg class= "square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" ><path fill="currentColor" d="M30.662 5.003c-4.488-0.645-9.448-1.003-14.662-1.003s-10.174 0.358-14.662 1.003c-0.86 3.366-1.338 7.086-1.338 10.997s0.477 7.63 1.338 10.997c4.489 0.645 9.448 1.003 14.662 1.003s10.174-0.358 14.662-1.003c0.86-3.366 1.338-7.086 1.338-10.997s-0.477-7.63-1.338-10.997zM12 22v-12l10 6-10 6z"></path></svg></span><span class="bt-desc">Settings</span></a>`),
                        clip: html2element(`<a href="#" class="clipboard-bt right" title="Copy to Clipboard"><span class="bt-desc">Copy to Clipboard</span><span class="clipboard-icn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M433.941 193.941l-51.882-51.882A48 48 0 0 0 348.118 128H320V80c0-26.51-21.49-48-48-48h-61.414C201.582 13.098 182.294 0 160 0s-41.582 13.098-50.586 32H48C21.49 32 0 53.49 0 80v288c0 26.51 21.49 48 48 48h80v48c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48V227.882a48 48 0 0 0-14.059-33.941zm-84.066-16.184l48.368 48.368a6 6 0 0 1 1.757 4.243V240h-64v-64h9.632a6 6 0 0 1 4.243 1.757zM160 38c9.941 0 18 8.059 18 18s-8.059 18-18 18-18-8.059-18-18 8.059-18 18-18zm-32 138v192H54a6 6 0 0 1-6-6V86a6 6 0 0 1 6-6h55.414c9.004 18.902 28.292 32 50.586 32s41.582-13.098 50.586-32H266a6 6 0 0 1 6 6v42h-96c-26.51 0-48 21.49-48 48zm266 288H182a6 6 0 0 1-6-6V182a6 6 0 0 1 6-6h106v88c0 13.255 10.745 24 24 24h88v170a6 6 0 0 1-6 6z"></path></svg></span></a>`),
                        code: html2element(`<a href="" class="code-bt right" title="Get FFMPEG Command"><span class="bt-desc">Get FFMPEG command.</span><span class="code-icn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M234.8 511.7L196 500.4c-4.2-1.2-6.7-5.7-5.5-9.9L331.3 5.8c1.2-4.2 5.7-6.7 9.9-5.5L380 11.6c4.2 1.2 6.7 5.7 5.5 9.9L244.7 506.2c-1.2 4.3-5.6 6.7-9.9 5.5zm-83.2-121.1l27.2-29c3.1-3.3 2.8-8.5-.5-11.5L72.2 256l106.1-94.1c3.4-3 3.6-8.2.5-11.5l-27.2-29c-3-3.2-8.1-3.4-11.3-.4L2.5 250.2c-3.4 3.2-3.4 8.5 0 11.7L140.3 391c3.2 3 8.2 2.8 11.3-.4zm284.1.4l137.7-129.1c3.4-3.2 3.4-8.5 0-11.7L435.7 121c-3.2-3-8.3-2.9-11.3.4l-27.2 29c-3.1 3.3-2.8 8.5.5 11.5L503.8 256l-106.1 94.1c-3.4 3-3.6 8.2-.5 11.5l27.2 29c3.1 3.2 8.1 3.4 11.3.4z"></path></svg></span></a>`),
                        title: html2element(`<a href="" class="title-bt center" target="_blank" title="Play"></a>`)
                    }
                }
            });


            const evts = {
                settings(e) {
                    new Settings(videoplayer, () => {
                        self.video.pause();
                    }, () => {
                        self.trigger("update");
                    });
                },
                clip(e) {
                    if (copyToClipboard(self.jdlink)) {
                        videoplayer.notify("Link copied to clipboard");
                    }
                },
                code(e) {
                    if (copyToClipboard(self.ffmpeg)) {
                        videoplayer.notify("Command copied to clipboard");
                    }
                },
                title(e) {
                    self.video.play();
                }
            };

            new Events(self.elements.toolbar, self);
            self.target.insertBefore(self.elements.toolbar, self.target.firstChild);
            self.elements.toolbar.appendChild(self.elements.buttons.settings);
            self.elements.toolbar.appendChild(self.elements.buttons.title);
            self.elements.toolbar.appendChild(self.elements.buttons.code);
            self.elements.toolbar.appendChild(self.elements.buttons.clip);



            videoplayer.on("play pause", (e) => {
                if (e.type === "play") self.elements.toolbar.classList.add("hidden");
                else self.elements.toolbar.classList.remove("hidden");
                self.trigger("update");
            });

            self.on('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                let target = e.target.closest('a[class*="-bt"]');
                if (target instanceof HTMLElement) {
                    Object.keys(self.elements.buttons).forEach((btn) => {
                        if (target === self.elements.buttons[btn] && typeof evts[btn] === f) evts[btn].call(self, e);

                    });
                }
            }).on("update", () => {
                self.elements.buttons.title.innerHTML = self.title;
            }).trigger("update");


        }

    }


    class AltVideoPlayer {

        get videotitle() {
            let num = this.number,
                    title = this.translation || this.title;
            if (typeof title === s) {
                title = sanitizeFileName(title);
                if (typeof num === n && num > 0) {
                    title += ".E";
                    if (num < 10) title += 0;
                    title += num;
                }
                return title;
            }

        }

        get title(){
            return this.__title__;
        }

        set title(title) {
            if (typeof title === s) {
                this.__title__ = title;

                if (!this.translation) {
                    const self = this;
                    MyDramaList.search(title, list => {
                        if (list.length > 0) self.translation = list[0].title;
                        else self.translation = title;
                    });
                } else this.start();
            }
            
        }

        set translation(title){
            if (typeof title === s && this.title) {
                let translations = this.settings.get('translations');
                if (typeof translations[this.title] === u) {
                    translations[this.title] = title;
                    this.settings.set('translations', translations);
                }
                this.start();
            }
        }

        get translation(){
            if (this.title) {
                let translations = this.settings.get('translations');
                if (typeof translations[this.title] === s) {
                    return translations[this.title];
                }
            }
        }


        get src(){
            return this.__src__;
        }

        set src(src) {
            if (isValidUrl(src)) {
                const self = this;
                let uri = getURL(src),
                    url = new URL(uri),
                    regex = /#EXT-X-STREAM-INF.*\n([^#].*)/,
                    matches;
                url.protocol = location.protocol;
                if (/\.m3u8/.test(url.pathname)) {
                    fetch(url.href, {
                        cache: "no-store",
                        redirect: "follow"
                    }).then(r => {
                        if (r.status === 200) return r.text();
                        console.warn(r);
                        throw new Error("Cannot fetch resource " + url.href);
                    }).then(text => {
                        if ((matches = regex.exec(text))) {
                            let uri = matches[1].trim();
                            if (/^\//.test(uri)) {
                                url.pathname = uri;
                            } else url.pathname = url.pathname.replace(/([\w\.\-]+)$/, uri);
                        }
                        self.__src__ = url.href;
                        self.start();

                    }).catch(ex => {
                        console.warn(ex);
                        self.__src__ = url.href;
                        self.start();
                    });
                } else {
                    self.__src__ = url.href;
                    self.start();
                }
            }
        }

        get number() {
            return this.__number__;
        }

        set number(num) {
            if (typeof num === n) this.__number__ = num;
            this.start();
        }

        onReady(callback) {
            if (typeof callback !== f) return;
            const self = this;
            if (self.__started__ !== true) {
                self.one("altvideoplayer.ready", (e) => {
                    callback.call(self, self);
                });

            } else callback.call(self, self);
        }

        playpause() {
            if (this.video.paused === true) return this.video.play();
            this.video.pause();
        }

        notify(message, timeout) {
            timeout = typeof timeout === n ? timeout : 2000;
            if (typeof message === s) {
                let notification = doc.createElement('div');
                message = html2element(`<span class="altvideo-notifier-message">${message}</span>`);
                notification.appendChild(message);
                notification.hidden = true;
                notification.classList.add('fadeInRight');
                this.elements.notifier.insertBefore(notification, this.elements.notifier.firstChild);
                notification.hidden = null;

                setTimeout(() => {
                    this.elements.notifier.removeChild(notification);
                }, timeout);

            }
        }

        resize() {
            this.video.style.height = this.plyr.elements.container.clientHeight + "px";
        }


        start() {
            if (!this.__started__) {
                if (this.title !== undef && this.src !== undef && this.number !== undef && this.translation !== undef) {
                    const self = this;
                    AltVideoPlayer.loadDeps(x => {
                        self.elements.root.appendChild(self.video);

                        self.target.insertBefore(self.elements.root, self.target.firstChild);
                        self.video.data("src", self.src);

                        self.plyr = new Plyr(self.video, self.plyropts);

                        self.plyr.on('ready', e => {

                            self.plyr.elements.container.insertBefore(self.elements.bigplay, self.plyr.elements.container.firstChild);
                            self.plyr.elements.container.insertBefore(self.elements.notifier, self.plyr.elements.container.firstChild);
                            Events(self.elements.bigplay).on('click', e => self.video.play());
                            self.one('play', e => self.elements.bigplay.hidden = true);
                            self.on('click', e => self.playpause());

                            let hls = self.hls = new Hls();
                            hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
                                self.resize();
                                if (self.settings.get('autoplay') === true) self.video.play();
                            });
                            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                                hls.loadSource(self.src);
                            });
                            addEventListener("resize", () => {
                                self.resize();
                            });
                            self.on("play", () => {
                                self.resize();
                            });

                            hls.attachMedia(self.video);


                            self.__started__ = true;
                            self.trigger("altvideoplayer.ready");
                            console.debug(scriptname, " Started.");
                        });

                    });
                }
            }
        }

        constructor(target) {
            if ((!(target instanceof HTMLElement))) throw new Error("Not an Element");
            const self = this;
            Object.assign(this, {

                elements: {
                    root: html2element('<div class="altvideo-container" id="altvideo" />'),
                    notifier: html2element(`<div class="altvideo-notifier" />`),
                    bigplay: html2element(`<span class="bigplay-button no-focus" tabindex="-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="bigplay-icn"><path fill="currentColor" d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg></span>`)
                },
                video: html2element('<video preload="none" controls tabindex="-1" src="" class="altvideo" data-src="" />'),
                target: target,
                hls: null,
                plyr: null,
                plyropts: {
                    captions: {
                        active: true,
                        language: 'auto',
                        update: true
                    },
                    settings: ['captions', 'quality'],
                    keyboard: {
                        focused: true,
                        global: true
                    }
                },
                settings: new UserSettings({
                    autoplay: false,
                    translations: {},
                    ffmpeg: "-v quiet -stats -y -i"
                })
            });
            new Events(this.video, this);
            self.on("altvideoplayer.ready", () => {
                new ToolBar(self);
            });

        }

        static loadDeps(onload) {
            const self = this;
            if (self.loaded !== true) {
                [
                    "https://cdn.jsdelivr.net/npm/plyr@latest/dist/plyr.css",
                    "https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/altvideo.css",
                    "https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js",
                    "https://cdn.jsdelivr.net/npm/plyr@latest/dist/plyr.min.js"
                ].forEach(params => {
                    rload.require(params);
                });

                new Timer((timer) => {
                    if (typeof Hls === f && typeof Plyr === f) {
                        timer.stop();
                        self.loaded = true;
                        if (typeof onload === f) {
                            onload();
                        }
                    }
                });
            } else if (typeof onload === f) {
                onload();
            }
        }
    }


    let app;
    if (/zhuijukan/.test(location.host) && /^\/vplay\//.test(location.pathname)) {


        return find('#cms_player iframe[src*="m3u8"].embed-responsive-item:not([id])', (frame) => {
            let url = new URL(frame.src),
                sp = new URLSearchParams(url.search),
                    src = sp.get("url");
            if (src === null) return;
            app = new AltVideoPlayer(frame.parentElement);
            app.onReady(() => {
                frame.remove();
            });
            find('.play .container h2.text-nowrap > small', (el) => {
                let matches, num = 0;
                if ((matches = /第([0-9]+)/.exec(el.innerText))) num = parseInt(matches[1]);
                app.number = num;
                let titleElement = el.previousSibling.previousSibling;
                app.title = titleElement.innerText;
                app.src = src;
            });
        });

    } else if (/16ys/.test(location.host) && /player\-/.test(location.pathname) && typeof now === s) {

        return find('.player > iframe', (frame) => {
            app = new AltVideoPlayer(frame.parentElement);
            app.onReady(() => {
                frame.remove();
            });
            find('body > .wrap.textlink a:last-of-type', (el) => {

                app.title = el.innerText;
                let num = 0,
                    txt, matches;
                if (el.nextSibling && (txt = el.nextSibling.nodeValue)) {
                    if ((matches = /第([0-9]+)/.exec(txt))) num = parseInt(matches[1]);
                }
                app.number = num;
                app.src = now;
            });

        });
    } else if (/5nj/.test(location.host) && /m=vod-play-id.*src.*num/.test(location.search)) {

        return find('#playleft iframe[src*="/m3u8/"]', (frame) => {
            app = new AltVideoPlayer(frame.parentElement);
            app.onReady(() => {
                frame.remove();
            });
            let url = new URL(frame.src),
                sp = new URLSearchParams(url.search),
                src = sp.get('id');
            if (src === null) return;
            app.title = mac_name;
            find('.videourl li.selected a', (el) => {
                let num = 0,
                    matches;
                if ((matches = /第([0-9]+)/.exec(el.title))) num = parseInt(matches[1]);
                app.number = num;
                app.one("altvideoplayer.ready", () => {
                    app.elements.root.style = "max-height:550px;";
                });
                app.src = src;
            });
        });

    }

    //unified search module
    if (location.search.length > 0) {
        let sp = new URLSearchParams(location.search),
            q = sp.get('q');
        if (typeof q === s) {
            if (/zhuijukan/.test(location.host)) {
                find('form.ff-search', (form) => {
                    let input = form.querySelector('input[name="wd"]'),
                        btn = form.querySelector("button.search-button");
                    input.value = q;
                    btn.click();
                });


            } else if (/16ys/.test(location.host)) {
                find('#formsearch', (form) => {
                    form.target = "";
                    let input = form.querySelector("#keyword"),
                        btn = form.querySelector("#searchbutton");
                    input.value = q;
                    btn.click();
                });

            } else if (/5nj/.test(location.host)) {
                find('ul.search form', (form) => {
                    let input = form.querySelector('input[name="wd"]'),
                        btn = form.querySelector('input[type="submit"]');
                    input.value = q;
                    btn.click();
                });
            }
        }

    }

    //shoupa 2nd tab select (if exists)
    if (/zhuijukan/.test(location.host)) {
        find('.detail-source ul#detail-tab a[data-target*="tab-2"]', a => a.click());
    }




})(document);