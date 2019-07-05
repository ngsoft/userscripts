// ==UserScript==
// @version      0.2.a
// @name         CDRAMA VIP Downloader
// @description  FIX Stream + download stream (FFMPEG)
// @namespace    https://github.com/ngsoft/userscripts
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/gmutils.min.js
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @run-at      document-body
// @noframes
//
// @include     /^https?:\/\/(www\.)?(5nj\.com|zhuijukan\.com|16ys\.net)\//
// @icon        https://www.zhuijukan.com/favicon.ico
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
            return "/search?adv=titles&so=date";
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
                year: 0
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
            }
        }
    }








    class Settings {
        
        static styles(){
            if(this.loaded !== true){
                this.loaded = true;
                
                let css = `
                    .alt-dialog, .alt-dialog * {font-family: Arial,Helvetica,sans-serif;line-height: 1.5;font-weight: 700;color:#333;font-size: 16px;}
                    .alt-dialog{position: fixed; top:0;left:0; right:0; bottom:0; z-index: 2147483647; background-color: rgba(0, 0, 0, 0.45);}
                    .alt-dialog .alt-container{position: relative;width: 80%; max-width: 960px; height: 100%; margin: 0 auto; overflow: hidden;}
                    .alt-dialog .alt-body{
                        position: relative; margin: 50px 0 0 0; min-height:128px;padding: 48px 24px 64px 24px;
                        background-color: #FFF; border-radius: 6px;border: none;
                    }
                    .alt-dialog .alt-title{
                        position: absolute; display: block; top:0;right: 0;left: 0;
                        padding: 14px 16px 16px 56px;width: 100%;overflow: hidden;
                        background-color: rgba(0,0,0,.03);border-bottom: 1px solid rgba(0,0,0,.125);
                    }
                    .alt-dialog .alt-title:before{
                        content: "";display: inline-block;
                        background: url('${GMinfo.script.icon}') no-repeat;background-size: cover;padding: 16px;
                        position: absolute;top:10px;left:12px;
                    }
                    .alt-dialog .form-el{
                        text-align: left; padding: 16px;margin: 16px 0;
                    }
                    .alt-dialog .form-el + .form-el{
                        border-top: 1px solid rgba(0,0,0,.125);margin-top:0;
                    }
                    .alt-dialog .form-el .form-label{
                        display: block;margin: 0 0 4px 0;
                    }
                    .alt-dialog .form-el .form-input{
                        width: 100%;padding: 12px 20px;margin: 8px 0;box-sizing: border-box;
                        border-radius: 4px; background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);
                        -moz-appearance: textfield;-webkit-appearance: none;-o-appearance: none;text-align: center;
                    }
                    .alt-dialog .form-el .form-label + .form-input{
                        margin-top:0;
                    }
                    .alt-dialog .form-el .form-input:focus{
                        border: 1px solid rgb(0, 153, 204);
                    }
                    .alt-dialog .alt-footer{
                        display: block; margin:24px -24px 0 -24px; padding: 8px 24px 12px 24px; text-align: right;
                        position: absolute; bottom: 0; left:0; right:0;
                        background-color: rgba(0,0,0,.03);border-top: 1px solid rgba(0,0,0,.125);
                    }
                    .alt-dialog button{
                        padding: 8px 24px;box-sizing: border-box;border-radius: 4px; border: 0;cursor: pointer;
                        background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);
                    }
                    .alt-dialog .alt-footer button{
                        margin-right: 16px;background-color: rgba(0,0,0,.125);
                    }
                    .alt-dialog button:hover{
                        background-color: rgba(0,0,0,.125); border-color: rgba(0,0,0,.03);
                    }
                    .alt-dialog .close-bt{padding: 3px 16px;position: absolute;top: 10px;right: 12px;}
                    .alt-dialog .bt-red{
                        color: rgb(219, 40, 40);
                    }
                    .alt-dialog .bt-red:hover, .alt-dialog .bt-red:active{
                        background-color: rgb(219, 40, 40); color: rgb(255, 255, 255);
                    }
                    .alt-dialog  .bt-blue{
                        color: rgb(30, 130, 205);
                    }
                    .alt-dialog .bt-blue:hover, .alt-dialog .bt-blue:active{
                        background-color: rgb(30, 130, 205);color: rgb(255, 255, 255);
                    }
                    .alt-dialog  .bt-black{
                        color: rgb(28, 29, 30);
                    }
                    .alt-dialog .bt-black:hover, .alt-dialog .bt-black:active{
                        background-color: rgb(28, 29, 30);color: rgb(255, 255, 255);
                    }
                    .alt-dialog .color-success{
                        color: rgb(40, 167, 69);
                    }
                    .alt-dialog .color-error{
                        color: rgb(220, 53, 69);
                    }
                    .alt-dialog [disabled]{
                        pointer-events: none;color: gray;
                    }
                    @media (max-height: 480px) {
                        .alt-dialog .alt-container{width: 100%; padding: 4px;}
                        .alt-dialog .alt-body{height: 100%; margin: 0;}
                    }
                    @keyframes bounceOut {
                        20% {-webkit-transform: scale3d(.9, .9, .9);transform: scale3d(.9, .9, .9);}
                        50%, 55% {opacity: 1;-webkit-transform: scale3d(1.1, 1.1, 1.1);transform: scale3d(1.1, 1.1, 1.1);}
                        100% {opacity: 0;-webkit-transform: scale3d(.3, .3, .3);transform: scale3d(.3, .3, .3);}
                    }
                    @keyframes fadeIn {from {opacity: 0;}to {opacity: 1;}}
                    .bounceOut {animation-name: bounceOut;animation-duration: .75s;animation-fill-mode: both;}
                    .fadeIn {animation-name: fadeIn;animation-duration: .75s;animation-fill-mode: both;}
                    .no-select, .kodirpc-settings *:not(input){-webkit-touch-callout: none;-webkit-user-select: none;-moz-user-select: none;user-select: none;}
                `;
                //switch
                css += `
                    /* switch */
                    .switch,.switch .slider {position: relative;display: inline-block;}
                    .switch [type="checkbox"] {opacity: 0;z-index: 2;}
                    .switch [type="checkbox"],.switch .slider:after {position: absolute;top: 0;right: 0;left: 0;bottom: 0;min-width: 100%;min-height: 100%;cursor: pointer;}
                    .switch .slider:after,.switch .slider:before {-webkit-transition: 0.25s;transition: 0.25s;content: "";position: absolute;}
                    .switch .slider {width: 4rem;height: 2rem;vertical-align: middle;}
                    .switch .slider:before {z-index:1;height: 1.5rem;width: 1.5rem;left: .25rem;bottom: .25rem;}
                    .switch [type="checkbox"]:checked + .slider:before {-webkit-transform: translateX(2rem);-ms-transform: translateX(2rem);transform: translateX(2rem);}
                    .switch.round .slider:after{border-radius: 2rem;}
                    .switch.round .slider:before {border-radius: 50%;}
                    /** colors **/
                    .switch [type="checkbox"]:checked + .slider:after {background-color: rgba(0, 123, 255, 1);}
                    .switch [type="checkbox"]:focus + .slider:after {box-shadow: 0 0 1px rgba(0, 123, 255, 1);}
                    .switch .slider:before {background-color: rgba(255, 255, 255, 1);}
                    .switch .slider:after {background-color: rgba(108, 117, 125, 1);}
                    /** sizes **/
                    .switch .slider{transform: scale(.75,.75);}
                    .switch-sm .slider{transform: scale(.55,.55);}
                    .switch-md .slider{transform: scale(.9,.9);}
                    .switch-lg .slider{transform: scale(1.1,1.1);}
                `;
                addstyle(css);
            }
        }
        
        
        open(callback){
            if (typeof callback === f) this.one('settings.open', callback);
            this.elements.inputs.save.disabled = true;
            doc.body.insertBefore(this.elements.root, doc.body.firstChild);
            this.elements.inputs.ffmpeg.focus();
            this.trigger('settings.open');
        }


        close(callback){
            if (typeof callback === f) this.one('settings.close', callback);
            this.trigger('settings.close');
            doc.body.removeChild(this.elements.root);
        }

        
        
        
        
        constructor(player, open, close){
            Settings.styles();
            const self = this;
            this.settings = player.settings;
            this.elements = {
                root: html2element(
                    `<div class="alt-dialog">
                        <form class="alt-container">
                            <fieldset class="alt-body">
                                <legend class="alt-title">
                                    ${GMinfo.script.name} Settings
                                </legend>
                                <button class="close-bt" name="close">&times;</button>
                
                                
                                <div class="form-el">
                                    <label class="form-label">FFMPEG Params</label>
                                    <input class="form-input" type="text" name="ffmpeg" value="${self.settings.get('ffmpeg')}" placeholder="FFMPEG Params ..." required />
                                </div>

                                <div class="form-el">
                                    <span class="switch round">
                                        <input type="checkbox" name="autoplay" title="Autoplay Video"/>
                                        <span class="slider"></span>
                                        <label class="form-label" style="display: inline-block;">Autoplay Video</label>
                                    </span>
                                </div>
                
                                <div class="alt-footer">
                                        <button class="bt-black" type="reset" name="reset">Reset</button>
                                        <button class="bt-blue" name="translate" disabled>Translations</button>
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
                close(e){
                    self.elements.body.classList.remove('fadeIn', 'bounceOut');
                    self.elements.body.classList.add('bounceOut');
                    setTimeout(() => {
                        self.close();
                    }, 750);
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
                                    self.elements.inputs.autoplay.focus();
                                } else {
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

            self.open();
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
                    toolbar: html2element('<div class="altvideo-toolbar" />'),
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
                    new Settings(videoplayer);
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

            self.elements.buttons.title.appendChild(document.createTextNode(self.title));

            videoplayer.on("play pause", (e) => {
                if (e.type === "play") self.elements.toolbar.classList.add("hidden");
                else self.elements.toolbar.classList.remove("hidden");
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
            });


        }

    }


    class AltVideoPlayer {

        get videotitle() {
            let num = this.number,
                    title = this.translation || this.title;
            if (typeof title === s) {
                title = sanitizeFileName(title);
                if (typeof num === n && num > 0) title += ".E" + num;
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
                            cache: "default",
                            redirect: 'follow'
                    }).then(r => {
                        if (r.status === 200) return r.text();
                        console.warn(r);
                        throw new Error("Cannot fetch resource " + url.href);
                    }).then(text => {
                        console.debug(text);
                        if ((matches = regex.exec(text))) {
                            let uri = matches[1].trim();
                            if (/^\//.test(uri)) {
                                url.pathname = uri;
                            } else url.pathname = url.pathname.replace(/([\w\.\-]+)$/, uri);
                        }
                        self.__src__ = url.href;
                        self.start();
                        console.debug(self);

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
                            new ToolBar(self);
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


        }

        static loadDeps(onload) {
            const self = this;
            if (self.loaded !== true) {
                [
                    {
                        url: "https://cdn.jsdelivr.net/npm/plyr@latest/dist/plyr.css",
                        onload(){
                            self.loadStyles();
                        }
                    },
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

        static loadStyles() {
            if (this.styles !== true) {
                this.styles = true;

                let css = `
                    .altvideo-container{height:100%;width: 100%;position: relative; overflow: hidden;}
                    .altvideo{width: 100%; height:100%; object-fit: fill; display: block;}
                    .plyr{height: 100%;width:100%;}
                    .plyr > .plyr__control--overlaid{display: none !important;}
                    [class*="-icn"] svg{width:87.5%;height:100%;}
                    [class*="-icn"] svg.square{width:87.5%;height:87.5%;}
                    [class*="-icn"] img {width:100%;height:100%;}
                    .altvideo-container [class*="-button"]{
                        background-color: transparent;border: none; display: inline-block;color:#fff;
                        width:32px;z-index: 10; cursor: pointer;border-radius: 3px;flex-shrink: 0;padding: 7px;transition: all .3s ease;
                    }
                    .altvideo-container [class*="-button"] svg{pointer-events: none;}
                    .altvideo-container [class*="-button"]:not(.no-focus):focus, .altplayer-container [class*="-button"]:not(.no-focus):hover{
                        box-shadow: 0 0 0 5px rgba(26,175,255,.5);background: #1aafff;outline: 0;
                    }
                    .altvideo-container .bigplay-button{
                        position: absolute; top: 50%; left:50%; transform: translate(-50%, -50%);width: 128px;
                        color: rgba(255,255,255,0.8);
                    }
                    .altvideo-container .bigplay-button:focus, .altplayer:hover span.bigplay-button{
                        color: rgba(255,255,255,1);
                    }

                    .altvideo-toolbar {
                        position: absolute; top: 0 ; left: 0 ; right: 0; z-index: 9999; text-align: center;
                        text-align: center; padding: 16px 8px;
                    }
                    .altvideo-toolbar [class*="-icn"]{vertical-align: middle; display: inline-block; width: 24px; height: 24px; margin:0 8px; line-height:0;}
                    .altvideo-toolbar .left{float:left;}
                    .altvideo-toolbar .right{float: right;}
                    .altvideo-toolbar .center{position: absolute;left: 50%;top: 16px;transform: translate(-50%);}
                    .altvideo-toolbar, .altvideo-toolbar a, .altvideo-notifier {
                        font-family: Arial,Helvetica,sans-serif; line-height: 1.5;
                        font-size: 16px; color:#FFF;
                    }
                    .altvideo-toolbar {background-color: rgba(0, 0, 0, 0.45);}
                    .altvideo-toolbar a {text-decoration: none; padding: 0 8px;}
                    .altvideo-toolbar a:hover {filter: drop-shadow(4px 4px 4px #fff);}
                    [disabled], .disabled, .altvideo-toolbar svg{pointer-events: none;}

                    .altvideo-notifier {position: absolute; right: 32px; top: 40%; text-align: right;z-index: 9999;}
                    .altvideo-notifier > div{
                        display: block; text-align:center;padding:16px; border-radius: 4px; margin: 8px 0;
                        min-width:256px;max-width:512px;
                        color:rgb(0,0,0);background-color: rgba(255, 255, 255, .8);font-weight: bold;position: relative;
                    }
                    @keyframes fadeInRight {
                        0% {opacity: 0;-webkit-transform: translate3d(100%, 0, 0);transform: translate3d(100%, 0, 0);}
                        100% {opacity: 1;-webkit-transform: none;transform: none;}
                    }
                    .fadeInRight {animation-name: fadeInRight;animation-duration: .5s;animation-fill-mode: both;}
                `;
                css += `#cms_player .altvideo-container{height: 675px;position: absolute;}`;

                css += `
                    .hidden, .hidden *, [id*="jm_"],
                    .altvideo-toolbar [class*="-bt"]:not(:hover) .bt-desc
                    {
                        position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                        height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                        display: inline !important;z-index: -1 !important;
                    }
                `;

                addstyle(css);
            }
        }

    }


    let app;
    if (/zhuijukan/.test(location.host) && /^\/vplay\//.test(location.pathname)) {


        return find('#cms_player iframe.embed-responsive-item:not([id])', (frame) => {
            let url = new URL(frame.src),
                sp = new URLSearchParams(url.search),
                    src = sp.get("url");

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
                //tells streamgrabber to do some work
                if (src === null || !(/\.m3u8/.test(src))) {
                    url.searchParams.set("jdtitle", app.videotitle + ".mp4");
                    let clone = frame.cloneNode(true);
                    clone.src = url.href;
                    frame.parentElement.insertBefore(clone, frame);
                    frame.remove();
                } else app.src = src;
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
                if ((/\.m3u8/.test(now))) app.src = now;
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