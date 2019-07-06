// ==UserScript==
// @version     1.0
// @name        ViKi+
// @description Download Subtitles on Viki
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.1/dist/gmutils.min.js
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/isocodes.min.js
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


    const resources = [
        "https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/altvideo.css",
        "https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js"
    ], newsession = sessionStorage.getItem(UUID + "session") === null;

    sessionStorage.setItem(UUID + "session", +new Date());

    const rload = new rloader(UUID, week);

    //clear cache on upgrade
    (() => {
        let last = localStorage.getItem(UUID);
        if (last !== GMinfo.script.version) rload.clear();
        localStorage.setItem(UUID, GMinfo.script.version);
    })();



    class Settings {
        static get prefix(){
            return GMinfo.script.name.replace(/\s+/, "") + ":";
        }
        static get store(){
            if (typeof this.__store__ === u) {
                const defaults = {
                    locale: "",
                    convert: false,
                    filters: []
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
        static get convert(){
            return this.store.get(this.prefix + "convert") === true;
        }
        static set convert(flag){
            if (typeof flag === b) this.store.set(this.prefix + "convert", flag);
        }
        static get filters(){
            return this.store.get(this.prefix + "filters") || [];
        }
        static set filters(arr){
            if (isArray(arr)) this.store.set(this.prefix + "filters", arr);
        }

    }


    /**
     * Autoswitch locale
     */
    (() => {

        const locales = Array.from(doc.querySelectorAll('link[hreflang][href*="locale="]')).map(x => x.hreflang);

        function switchLocale(locale){
            if (typeof locale === s && locales.includes(locale)) {
                Settings.locale = locale;
                let url = new URL(location.href);
                url.searchParams.set("locale", locale);
                location.replace(url.pathname + url.search);
            }
        }

        Events(doc).on('click', event => {
            let target = event.target.closest('div[data-react-class="modalApp.ModalSiteLanguage"] a.pad.inline-block');
            if (target instanceof Element) {
                event.preventDefault();
                let url = new URL(getURL(target.href)), locale = url.searchParams.get("locale");
                switchLocale(locale);
            }
        });

        let locale = Settings.locale;
        if (locale.length === 0) {
            location.hash = "#modal-site-language";
        } else if (newsession === true) {
            switchLocale(locale);

        }

    })();


    class VikiSubs {

        get target(){
            return doc.querySelector('.video-meta');
        }

        get tracks(){

            if (typeof this._tracks === u) {
                const self = this, filters = Settings.filters;
                this._tracks = this.subtitles.map(obj => {
                    return {
                        iso: obj.srclang,
                        src: obj.src,
                        percent: obj.percentage,
                        lang: isoCode(obj.srclang).langword
                    };
                }).filter(obj => {
                    if (filters.length > 0) return filters.includes(obj.iso);
                    return true;
                });

            }
            return this._tracks;
        }


        get events(){
            if (typeof this._events === u) {
                const self = this;
                this._events = {
                    title: {
                        init(){
                            this.innerHTML = self.target.querySelector('.video-title a').innerText;
                        }
                    },
                    filters: {
                        click(e){
                            self.elements.fedit.hidden = self.elements.fedit.hidden === true ? null : true;
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    },
                    subtitles: {
                        init(){

                            //reset options
                            this.querySelectorAll('option[value]:not([value=""])').forEach(x => x.remove());

                            //populate options
                            const tracks = self.tracks;
                            tracks.forEach((track, id) => {
                                let opt = doc.createElement('option');
                                opt.innerHTML = track.lang + ' (' + track.percent + ' %)';
                                opt.value = id;
                                this.appendChild(opt);
                            });




                        },
                        reset(){
                            this.selectedIndex = 0;

                        },
                        change(e){
                            //this.classList.remove("placeholder");
                            let id = parseInt(this.value);
                            if (!isNaN(id) && typeof self.tracks[id] !== u) {
                                self.downloadTrack(self.tracks[id], () => {
                                    Events(this).trigger("reset");
                                });
                            }
                        }
                    },
                    convert: {
                        init(){
                            this.checked = Settings.convert === true;
                            Events(this).trigger("change");
                        },
                        change(){
                            this.previousElementSibling.classList.remove("vkp-toggle-on");
                            if (this.checked) this.previousElementSibling.classList.add("vkp-toggle-on");
                            Settings.convert = this.checked === true;
                        }
                    },
                    root: {
                        init(e){
                            Object.keys(self.events).forEach(key => {
                                if (key !== "root" && typeof self.events[key].init === f) {
                                    let el = self.elements[key] || self.elements.inputs[key];
                                    self.events[key].init.call(el, e);
                                }
                            });
                            this.previousElementSibling.hidden = true;
                        }
                    }
                };
            }
            return this._events;
        }
        
        
        
        
        convert(vtt, callback){
            if (typeof vtt === s && vtt.length > 0 && typeof callback === f) {
                this.one("converter.ready",()=>{
                    callback(Subtitle.stringify(Subtitle.parse(vtt)));
                });
                if (typeof Subtitle === u) {
                    new Timer(timer => {
                        if (typeof Subtitle !== u) {
                            timer.stop();
                            this.trigger("converter.ready");
                        }
                    });
                    rload.require("https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js");
                } else this.trigger("converter.ready");
            }
        }

        /**
         * Launches Subtitle Download
         * @param {object} track
         * @param {function} callback
         * @returns {unresolved}
         */
        downloadTrack(track, callback){
            if (isPlainObject(track)) {
                if (typeof callback === f) this.one("subtitle.downloaded", callback);
                let filename = sanitizeFileName(this.json.container.titles.en, " ").replace(/\s+/g, " "), number = this.json.number, convert = Settings.convert;
                if (this.json.type !== 'episode') {
                    filename += "." + this.json.type;
                } else {
                    filename += ".E";
                    if (number < 10) filename += 0;
                    filename += number;
                }
                filename += "." + track.iso;
                filename += convert === true ? ".srt" : ".vtt";
                /**
                 * @link https://hacks.mozilla.org/2016/03/referrer-and-cache-control-apis-for-fetch/
                 */
                fetch(track.src, {cache: "no-store", redirect: 'follow'})
                        .then(r => {
                            if (r.status === 200) return r.text();
                            throw new Error("Cannot Fetch " + track.src);
                        })
                        .then(text => {
                            if (convert === false) Text2File(text, filename);
                            else this.convert(text, srt => Text2File(srt, filename));
                            this.trigger("subtitle.downloaded");
                        })
                        .catch(ex => console.warn(ex));
            }
 
        }


        constructor(json, subs){
            const self = this;
            
            const template = html2element(
                    `<form class="viki-plus">
                        <fieldset class="form-body">
                            <legend class="form-title"></legend>
                            <div class="form-block form-fedit" hidden>
                                <div class="form-el form-block">
                                    <label class="form-label">Add a language</label>
                                    <span class="form-input caret">
                                        <select title="Select your language" name="isolist"></select>
                                    </span>
                                    <button class="bt-square"><i class="icon-plus"></i></button>
                                    
                                </div>
                                <ul class="list-none">
                                    <li data-isocode=""><span>Lang</span><button class="bt-square right"><i class="icon-minus"></i></button></li>
                                </ul>

                            </div>
                            <div class="form-el form-select">
                                <label class="form-label">Subtitles</label>
                                <span class="form-input caret">
                                    <select title="Select Subtitles" name="subtitles">
                                        <option>Select Subtitles</option>
                                    </select>
                                </span>
                                
                            </div>
                            <div class="form-el">
                                <label class="form-label">SRT</label>
                                <span class="form-input">
                                    <div class="vkp-toggle">
                                        <div class="vkp-toggle-box">
                                            <div class="vkp-toggle-bar"></div><div class="vkp-toggle-knob"></div>
                                        </div>
                                    </div>
                                    <input type="checkbox" name="convert" title="Convert to SRT" />
                                </span>
                            </div>
                            <div class="form-el">
                                <button class="" name="filters">Edit filters</button>
                            </div>
            
                        </fieldset>
                    </form>`);
            this.json = json || {};
            this.subtitles = subs || [];
            
            if(typeof this.json.id !== u && this.subtitles.length > 0){
                this.elements = {
                    root: template,
                    inputs: {}
                };

                this.elements.root.querySelectorAll('[name]').forEach(input => {
                    this.elements.inputs[input.name] = input;
                });
                ["title", "body", "fedit"].forEach(key => {
                    this.elements[key] = this.elements.root.querySelector('.form-' + key);
                });

                Object.keys(this.events).forEach(key => {
                    let elem = this.elements[key] || this.elements.inputs[key];
                    if (elem instanceof EventTarget) {
                        Object.keys(this.events[key]).forEach(evt => {
                            Events(elem).on(evt, this.events[key][evt]);
                        });
                    }
                });

                this.target.appendChild(template);
                new Events(this.elements.root, this);

                this.on('init', () => {
                    self.elements.root.querySelectorAll('.form-input select').forEach(select => {
                        //basic init  for placeholder
                        select.querySelectorAll('option:not([value]), option[value=""]').forEach(el => el.remove());
                        let placeholder = select.getAttribute("title") || "";
                        if (placeholder.length > 0) {
                            let opt = doc.createElement('option');
                            opt.innerHTML = placeholder;
                            opt.disabled = opt.hidden = opt.selected = true;
                            select.insertBefore(opt, select.firstChild);
                            //select.classList.add("placeholder");
                        }
                        select.selectedIndex = 0;
                    });
                });

                this.trigger('init');
                console.debug(scriptname, "started");
            }
            

        }

    }




    /**
     * Subtitles
     */
    if (/^\/videos\//.test(location.pathname) && typeof parsedSubtitles !== u && typeof video_json !== u) {

        addstyle(`
            .viki-plus, .viki-plus * {line-height: 1.5;font-weight: 700;color:#333;font-size: 16px;}
            .form-body, .form-body .form-el {
                position: relative; margin: 0; padding: 0;border: none;
            }
            .form-body .form-title{
                display: block; 
                padding: 0 0 16px 0; width: 100%;overflow: hidden;
                background-color: transparent;border: none;
            }
            .form-el{padding: 0 0 8px 0;position: relative;}
            .form-el .form-label{display: inline-block;}
            .form-el .form-input{position: relative;}
            .form-el .form-label + .form-input{display: inline-block;margin-left: 8px;}
            .form-body .form-input select{
                width: 100%;padding: 12px 20px;margin: 0;
                -moz-appearance: none;-webkit-appearance: none;-o-appearance: none;text-align: center;
                text-align-last: center;width: 100%;min-width: 256px;
            }
            .form-body button, .form-body .form-input select{
                padding: 4px 12px;box-sizing: border-box;border-radius: 4px; border: 0;cursor: pointer;
                background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);height: 32px;
            }
            .form-body .form-input.caret:after{
                content: "▼";position: absolute;right:.35rem;top: 50%;line-height:0;transform: translate(0, -50%);pointer-events: none;
            }
            .form-body button:hover, .form-body .form-input select:hover {
                background-color: rgba(0,0,0,.125); border-color: rgba(0,0,0,.03);
            }
            .form-body .form-input select:focus, .form-body button:focus{
                border: 1px solid rgb(0, 153, 204);
            }
            .form-body .bt-square{
                line-height:0; padding: 4px 8px;vertical-align: top;
            }
            .form-body .form-el.form-select .form-label{
                display: none;
            }
            .form-body .form-el.form-select .form-label + .form-input{
                margin:0; 
            }
            .vkp-toggle + [type="checkbox"] {
                z-index: 2; position: absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;opacity:0;
            }
            .viki-plus .vkp-toggle .vkp-toggle-bar{background-color: rgba(108, 117, 125, 1);}
            .viki-plus .form-el{display: inline-block;}
            .viki-plus .form-el + .form-el{margin-left:8px;}
            .viki-plus .form-title{cursor: pointer;font-size: 24px;font-weight:600;font-family: "Open Sans Condensed", sans-serif;}
            .viki-plus .form-title:hover{color: rgb(0, 127, 216);}
            .viki-plus ::placeholder, .viki-plus .placeholder{color: #ababab;}
            .viki-plus [class*="icon-"]{font-size: 12px;}
            .viki-plus .form-block{displey: block;}
        `);

        //Settings.filters = ["en", "fr"];


        new VikiSubs(video_json, parsedSubtitles);







    }



})(document);