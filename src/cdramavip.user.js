// ==UserScript==
// @version      1.8.1
// @name         CDRAMA Downloader
// @description  FIX Stream + download stream (FFMPEG)
// @namespace    https://github.com/ngsoft/userscripts
// @author       daedelus
// @require      https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @require      https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js
// @require      https://cdn.jsdelivr.net/npm/hls.js@0.14.11/dist/hls.min.js
// @require      https://cdn.jsdelivr.net/npm/plyr@3.6.9/dist/plyr.min.js
// @resource     plyr_css https://cdn.jsdelivr.net/npm/plyr@3.6.9/dist/plyr.min.css
// @resource     altvideo_css https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.1.2/dist/altvideo.css
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @run-at       document-body
// @noframes
// @include      /^https?:\/\/(\w+\.)?(5nj|cechi8|zhuijukan|16ys|duboku|dboku|jhooslea|fanstui|newsinportal)\.\w+\//
// @icon         https://cdn.jsdelivr.net/gh/ngsoft/userscripts/dist/altvideo.png
// @defaulticon  data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpFOUY5MTVCMUMwMjlFMzExQTIzMENGMDZEN0ZFMENDRiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozRENEQTcwMzI5QzIxMUUzOTNGRUI5Mzg0NzgxNUVEMiIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozRENEQTcwMjI5QzIxMUUzOTNGRUI5Mzg0NzgxNUVEMiIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M2IChXaW5kb3dzKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkVERjkxNUIxQzAyOUUzMTFBMjMwQ0YwNkQ3RkUwQ0NGIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkU5RjkxNUIxQzAyOUUzMTFBMjMwQ0YwNkQ3RkUwQ0NGIi8+IDwvcmRmOkRlc2NyaXB0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
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
        if (last !== GMinfo.script.version) {
            rload.clear();
        }
        localStorage.setItem(UUID, GMinfo.script.version);
    })();

    


    /**
     * MDL Parser
     */
    class MyDramaList {

        static get cors(){
            return "http://daedelus.us.to:8050/";
        }
        static get endpoint(){
            return "/search?adv=titles&so=newest";
        }
        static get base(){
            return "https://mydramalist.com";
        }


        static get headers(){
            return {};
        }

        static handleResponseText(html){

            let  page = html2doc(html), results = [];
            page.querySelectorAll('[id*="mdl-"].box').forEach(node => {
                results.push(new MyDramaList(node));
            });
            return results;

        }
        
        
        
        static fetch(url){
            url = url instanceof URL ? url.href : url;
            return new Promise((resolve, reject)=>{
                 GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: this.headers,
                    onload(xhr){
                        if (xhr.status === 200) resolve(xhr.response);
                        else reject(new Error('Invalid status ' + xhr.status));
                    },
                    onerror(){
                        reject(new Error('Cannot fetch ' + url));
                    }
                });
            });

        }




        static search(query){

            return new Promise((resolve, reject) => {

                if (typeof query === s) {

                    let url = new URL(this.base + this.endpoint);
                    url.searchParams.set("q", query);

                    this.fetch(url.href)
                            .then(text => {

                                resolve(this.handleResponseText(text));
                            })
                            .catch(error => reject(error));
                    return;
                }
                reject(new Error('Invalid query'));
            });

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

    function setVideoSize(){
        let video = doc.querySelector('video');
        if (video instanceof Element) {
            let width = video.offsetWidth, player = doc.body;
            player.classList.remove('video-m', 'video-l', 'video-xl');
            if (width > 1900) player.classList.add('video-xl');
            else if (width > 1100) player.classList.add('video-l');
            else if (width > 615) player.classList.add('video-m');

        }
    }

    class Settings {
        

        open(callback){
            if (typeof callback === f) this.one('settings.open', callback);
            this.elements.inputs.save.disabled = true;

            //doc.body.insertBefore(this.elements.root, doc.body.firstChild);
            //this.player.plyr.elements.container.insertBefore(this.elements.root, this.player.plyr.elements.container.firstChild);

            doc.body.appendChild(this.elements.root);

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
                                    <input class="form-input" type="text" name="ffmpeg" value='${self.settings.get('ffmpeg')}' placeholder="FFMPEG Params ..." required />
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
                            }
                        }
                        else if (target.closest('.alt-body') !== null) return;

                        e.preventDefault();
                        e.stopPropagation();
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
                            let title = self.player.title, index = -1;

                            Object.keys(self.translations).forEach((k, i) => {
                                select.appendChild(html2element(`<option value="${k}">${k}</option>`));
                                if (k === title) index = i + 1;
                            });
                            if (index != -1) {
                                select.selectedIndex = index;
                                Events(select).trigger('change');
                            }
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
            return this.player.videotitle;
        }

        get file(){
            return this.title + ".mp4";
        }

        get jdlink() {
            let url = new URL(this.src);
            url.searchParams.set('jdtitle', this.file);
            return url.href;
        }

        get ffmpeg() {
            let
                    cmd = "echo " + this.title + "\n",
                    ffcmd = this.player.settings.get('ffmpeg');
            ffcmd = ffcmd.replace('%url', this.src);
            ffcmd = ffcmd.replace('%file', this.file);
            cmd += ffcmd;
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
                        title: html2element(`<a href="" class="title-bt center" target="_blank" title="Play"></a>`),
                        st: html2element(`<a href="" class="settings-bt left"><span class="st-icn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="square"><path fill="currentColor" d="M464 64H48C21.5 64 0 85.5 0 112v288c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zm-6 336H54c-3.3 0-6-2.7-6-6V118c0-3.3 2.7-6 6-6h404c3.3 0 6 2.7 6 6v276c0 3.3-2.7 6-6 6zm-211.1-85.7c1.7 2.4 1.5 5.6-.5 7.7-53.6 56.8-172.8 32.1-172.8-67.9 0-97.3 121.7-119.5 172.5-70.1 2.1 2 2.5 3.2 1 5.7l-17.5 30.5c-1.9 3.1-6.2 4-9.1 1.7-40.8-32-94.6-14.9-94.6 31.2 0 48 51 70.5 92.2 32.6 2.8-2.5 7.1-2.1 9.2.9l19.6 27.7zm190.4 0c1.7 2.4 1.5 5.6-.5 7.7-53.6 56.9-172.8 32.1-172.8-67.9 0-97.3 121.7-119.5 172.5-70.1 2.1 2 2.5 3.2 1 5.7L420 220.2c-1.9 3.1-6.2 4-9.1 1.7-40.8-32-94.6-14.9-94.6 31.2 0 48 51 70.5 92.2 32.6 2.8-2.5 7.1-2.1 9.2.9l19.6 27.7z"/></svg></span><span class="bt-desc">Load Subtitles</span></a>`)
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
                },
                st(e){
                    self.player.loadSubtitles();
                }
            };

            new Events(self.elements.toolbar, self);
            self.target.insertBefore(self.elements.toolbar, self.target.firstChild);
            self.elements.toolbar.appendChild(self.elements.buttons.settings);
            self.elements.toolbar.appendChild(self.elements.buttons.st);
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
            console.debug(scriptname, " Started.");

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

                if (!this.translation || this.translation === title) {
                    MyDramaList.search(title)
                            .then(list => {
                                console.debug(list);
                                if (list.length > 0) this.translation = list[0].title;
                                else this.translation = title;
                            })
                            .catch(error => {
                                console.error(error);
                                this.translation = title;
                            });

                } else this.start();
            }
            
        }

        set translation(title){
            if (typeof title === s && this.title) {
                let translations = this.settings.get('translations');
                if ((typeof translations[this.title] === u) && this.title !== title) {
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
                return this.title;

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

        resize(){
            this.video.style.height = this.plyr.elements.container.clientHeight + "px";
            setVideoSize();
        }

        loadSubtitles(){
            this.elements.stselect.click();
        }

        start() {
            if (!this.__started__) {
                if (this.title !== undef && this.src !== undef && this.number !== undef && this.translation !== undef) {
                    const self = this;
                    AltVideoPlayer.loadDeps(x => {
                        self.elements.root.appendChild(self.video);
                        self.elements.root.appendChild(self.elements.stselect);


                        self.target.insertBefore(self.elements.root, self.target.firstChild);
                        self.video.dataset.src = self.src;

                        self.plyr = new Plyr(self.video, self.plyropts);

                        self.plyr.on('ready', e => {
                            self.plyr.elements.container.insertBefore(self.elements.notifier, self.plyr.elements.container.firstChild);
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

                            Events(self.video).on('mousedown', (e) => {
                                if (e.button === 0) {
                                    self.plyr.togglePlay();
                                }
                            });

                            Events(self.elements.stselect).on("change", e => {
                                const list = e.target.files;
                                if (list.length > 0) {

                                    let c = list[0], r = new FileReader();

                                    Events(r).one('load', (x) => {

                                        let text = x.target.result,
                                                vtt = Subtitle.stringifyVtt(Subtitle.parse(text)),
                                                blob = new Blob([vtt], {type: "text/vtt"}),
                                                url = URL.createObjectURL(blob);

                                        let track = doc.createElement('track');
                                        Object.assign(track, {
                                            label: c.name,
                                            kind: "captions",
                                            srclang: "und",
                                            src: url
                                        });
                                        self.video.appendChild(track);
                                        setTimeout(() => {
                                            console.debug(self.plyr.captions);
                                            let n = self.video.textTracks.length - 1;
                                            self.plyr.captions.currentTrack = n;
                                            self.plyr.caption.toggled = true;
                                            doc.querySelectorAll('[id*="plyr-settings"].plyr__menu__container > div').forEach((el) => {
                                                el.style = "";
                                            });
                                        },700);
                                    });
                                    r.readAsText(c);

                                }
                            });

                            //more keyboard shortcuts

                            const codes = {
                                13: 'video_fullscreen',
                                78: 'video_next',
                                80: 'video_prev'
                            };
                            Events(doc.body).on('keydown keyup', (e) => {
                                let prevent = true;
                                if ((e.target.closest('input') !== null)) return;
                                let key = e.keyCode;
                                if (typeof codes[key] === s) {
                                    e.preventDefault();
                                    if (e.type === "keyup") trigger(self.elements.root, codes[key]);
                                }
                            });

                            Events(self.elements.root).on('video_fullscreen', e => {
                                self.elements.root.querySelector('button[data-plyr="fullscreen"]').dispatchEvent(new MouseEvent('click'));
                            });



                            self.__started__ = true;
                            self.trigger("altvideoplayer.ready");

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
                    stselect: html2element(`<input type="file" accept=".srt,.vtt" style="opacity:0; z-index:-1;position: absolute; top:-100%; left:-100%;"/>`)

                },
                video: html2element('<video preload="none" controls tabindex="-1" src="" class="altvideo" data-src=""></video>'),
                target: target,
                hls: null,
                plyr: null,
                plyropts: {
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
                    invertTime: false
                },
                settings: new UserSettings({
                    autoplay: false,
                    translations: {},
                    ffmpeg: ''
                })
            });
            new Events(this.video, this);

            let ffmpegcmd = this.settings.get('ffmpeg') || '';
            if (ffmpegcmd.indexOf('%url') === -1 || ffmpegcmd.indexOf('%file') === -1){
                this.settings.set('ffmpeg', `ffmpeg -v quiet -stats -y -i "%url" -c copy "%file"`);
            }

            this.onReady(() => {
                new ToolBar(self);
            });

        }

        static loadDeps(onload){
            if (this.loaded !== true) {

                GM_addStyle(GM_getResourceText('plyr_css'));
                GM_addStyle(GM_getResourceText('altvideo_css'));

                console.debug(Plyr, Hls);

                new Timer(timer => {
                    if (typeof Hls === f && typeof Plyr === f) {
                        timer.stop();
                        this.loaded = true;
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

            } else if (/(5nj|cechi8)/.test(location.host)) {
                find('ul.search form', (form) => {
                    let input = form.querySelector('input[name="wd"]'),
                            btn = form.querySelector('input[type="submit"]');
                    input.value = q;
                    btn.click();
                });
            } else if (/(duboku|dboku|fanstui|newsinportal|jhooslea)/.test(location.host)) {
                find('form#search', (form) => {
                    let input = form.querySelector('input[name="wd"]'),
                            btn = form.querySelector('button[type="submit"]');
                    input.value = q;
                    btn.click();
                });

            }

        }

    }

    //Application (Custom Video Player)
    let app;
    if (/zhuijukan/.test(location.host) && /^\/vplay\//.test(location.pathname)) {

        find('.detail-source ul#detail-tab a[data-target*="tab-2"]', a => a.click());


        return find('#cms_player iframe[src*="m3u8"].embed-responsive-item:not([id])', (frame, obs) => {
            obs.stop();
            let url = new URL(frame.src),
                sp = new URLSearchParams(url.search),
                    src = sp.get("url");
            if (src === null) return;
            app = new AltVideoPlayer(frame.parentElement);
            app.onReady(() => {
                frame.remove();

                Events(app.elements.root).on('video_prev video_next', (e) => {
                    let type = e.type.split('_').pop(), current, playlist, index, prev, next, url;

                    current = doc.querySelector('ul.detail-play-list .active');

                    if (current !== null) {
                        playlist = Array.from(current.closest('ul').querySelectorAll('li[data-id]')).map((li, i) => {
                            if (li.classList.contains('active')) index = i;
                            return li.querySelector('a').href;

                        });
                        if (!(typeof index === n)) return;
                        prev = index - 1;
                        next = index + 1;

                        switch (type) {
                            case 'prev':
                                url = (typeof playlist[prev] === s) ? playlist[prev] : null;
                                break;
                            default :
                                url = (typeof playlist[next] === s) ? playlist[next] : null;
                                break;

                        }

                        if (url !== null) location.replace(url);
                    }
                });
                
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

        return find('.player > iframe', (frame, obs) => {
            obs.stop();
            app = new AltVideoPlayer(frame.parentElement);
            app.onReady(() => {
                frame.remove();
                Events(app.elements.root).on('video_prev video_next', (e) => {
                    let type = e.type.split('_').pop(), current, playlist, index, prev, next, url;
                    current = doc.querySelector(`ul.dslist-group a[href="${location.pathname}"]`);
                    if (current !== null) {
                        playlist = Array.from(current.closest('ul').querySelectorAll('li')).map((li, i) => {
                            let a = li.querySelector('a');
                            if (a.getAttribute('href') === location.pathname) index = i;
                            return a.href;

                        });
                        if (!(typeof index === n)) return;
                        prev = index - 1;
                        next = index + 1;

                        switch (type) {
                            case 'prev':
                                url = (typeof playlist[prev] === s) ? playlist[prev] : null;
                                break;
                            default :
                                url = (typeof playlist[next] === s) ? playlist[next] : null;
                                break;

                        }
                        if (url !== null) location.replace(url);
                    }
                });
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
    } else if (/(5nj|cechi8)/.test(location.host) && /m=vod-play-id.*src.*num/.test(location.search)) {

        NodeFinder.find('[style*="position: fixed;"]', node => {
            node.remove();
        });

        return NodeFinder.find('#playleft iframe[src*="m3u8"][src*="id="]', (frame, obs) => {
            obs.stop();
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
                app.onReady(() => {
                    app.elements.root.style = "max-height:550px;";

                    Events(app.elements.root).on('video_prev video_next', (e) => {
                        let type = e.type.split('_').pop(), current, playlist, index, prev, next, url;

                        current = el;

                        if (current !== null) {
                            playlist = Array.from(current.closest('ul').querySelectorAll('li')).map((li, i) => {
                                let a = li.querySelector('a');
                                if (li.classList.contains('selected')) index = i;
                                return a.href;

                            });
                            if (!(typeof index === n)) return;
                            prev = index - 1;
                            next = index + 1;

                            switch (type) {
                                case 'prev':
                                    url = (typeof playlist[prev] === s) ? playlist[prev] : null;
                                    break;
                                default :
                                    url = (typeof playlist[next] === s) ? playlist[next] : null;
                                    break;

                            }
                            if (url !== null) location.replace(url);
                        }
                    });
                });
                app.src = src;
            });
        });

    } else if (/(duboku|dboku|fanstui|newsinportal|jhooslea)/.test(location.host) && /^\/vodplay\//.test(location.pathname) && typeof MacPlayer !== u && typeof MacPlayer.PlayUrl === s) {
        return NodeFinder.find('.embed-responsive .MacPlayer', (player, obs) => {
            obs.stop();
            app = new AltVideoPlayer(player.parentElement.parentElement);
            app.onReady(() => {
                doc.querySelectorAll('[src*="/ads/"]').forEach(x => x.parentElement.remove());
                player.parentElement.remove();
                app.elements.root.style = "position: absolute; top: 0; height: calc(100% - 32px);";
                app.elements.root.parentElement.style = "padding-top: 56.25%";

                Events(app.elements.root).on('video_prev video_next', (e) => {
                    let type = e.type.split('_').pop(), current, playlist, index, prev, next, url;

                    current = doc.querySelector('[id*="playlist"] ul.sort-list a.btn-warm');

                    if (current !== null) {
                        playlist = Array.from(current.closest('ul').querySelectorAll('li')).map((li, i) => {
                            let a = li.querySelector('a');
                            if (a.classList.contains('btn-warm')) index = i;
                            return a.href;

                        });
                        if (!(typeof index === n)) return;
                        prev = index - 1;
                        next = index + 1;

                        switch (type) {
                            case 'prev':
                                url = (typeof playlist[prev] === s) ? playlist[prev] : null;
                                break;
                            default :
                                url = (typeof playlist[next] === s) ? playlist[next] : null;
                                break;

                        }
                        if (url !== null) location.replace(url);
                    }
                });



            });
            let m3u8 = MacPlayer.PlayUrl;
            find('h2.title', (h2) => {
                app.title = h2.querySelector('a').innerText.trim();
                let num = 0, small = h2.querySelector('small'), matches;
                if (small instanceof Element && (matches = /第([0-9]+)/.exec(small.innerText))){
                    num = parseInt(matches[1]);
                }
                app.number = num;

            });
            app.src = MacPlayer.PlayUrl;
        });

    }

})(document);
