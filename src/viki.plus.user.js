// ==UserScript==
// @version     1.0
// @name        ViKi+
// @description Download Subtitles on Viki
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@latest/dist/gmutils.min.js
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
            if (isArray(arr)) this.store.set(this.prefix + "filters", arr.filter(x => /^[\w]{2}$/.test(x)).sort());
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
                    rmisoall: {
                        click(){
                            Settings.filters = [];
                            self.elements.fedit.querySelector('ul').innerHTML = "";
                            Events(self.elements.inputs.subtitles).trigger("init");
                            Events(self.elements.inputs.isolist).trigger("reset");
                        }
                    },
                    addiso: {
                        click(){
                            let iso, list;
                            if ((iso = self.elements.inputs.isolist.value)) {
                                list = Settings.filters;
                                list.push(iso);
                                Settings.filters = list;
                                Events(self.elements.inputs.subtitles).trigger("init");
                                Events(self.elements.inputs.isolist).trigger("reset");
                                self.addIsoCode(iso);
                                this.disabled = true;
                            }

                        }
                    },
                    fedit: {
                        init(){
                            Settings.filters.forEach(iso => self.addIsoCode(iso));
                        }
                    },
                    isolist: {
                        init(){

                            //reset options
                            this.querySelectorAll('option[value]:not([value=""])').forEach(x => x.remove());
                            isoCode.data.forEach(iso => {
                                let opt = doc.createElement('option');
                                opt.innerHTML = iso.langword + ' [' + iso.codes[0] + ']';
                                opt.value = iso.codes[0];
                                this.appendChild(opt);
                            });
                        },
                        reset(){
                            this.selectedIndex = 0;
                        },
                        change(){
                            self.elements.inputs.addiso.disabled = null;
                            if (Settings.filters.includes(this.value)) self.elements.inputs.addiso.disabled = true;
                        }
                    },
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
                        init(e){
                            delete(self._tracks);
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

                            e.stopPropagation();


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
                        },
                        click(e){
                            let target, iso;
                            if ((target = e.target.closest('button')) !== null) {
                                e.preventDefault();
                                if (target.matches('[name="rmiso"]')) {
                                    if((iso = target.parentElement.data("isocode"))){
                                        Settings.filters = Settings.filters.filter(x => x !== iso);
                                        Events(self.elements.inputs.subtitles).trigger("init");
                                        target.parentElement.remove();
                                    }
                                }
                            }


                        }
                    }
                };
            }
            return this._events;
        }
        
        /**
         * Add iso code to ul list
         * @param {string} iso
         */
        addIsoCode(iso){

            if (typeof iso === s && /^[\w]{2}$/.test(iso)) {
                const ul = this.elements.fedit.querySelector('ul');
                let entry = isoCode(iso);
                let li = html2element(`<li data-isocode="${iso}"><strong class="left">${iso.toUpperCase()}</strong><span>${entry.langword}</span><button title="Remove language" name="rmiso" class="bt-square right"><i class="icon-minus"></i></button></li>`);
                ul.appendChild(li);
            }


        }





        /**
         * Convert VTT to SRT
         * @param {string} vtt
         * @param {function} callback
         */
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
                    `<form class="viki-plus form-block">
                        <fieldset class="form-body">
                            <legend class="form-title"></legend>
                            <div class="form-block">
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
                                    <span class="form-input switch round">

                                        <input type="checkbox" name="convert2" title="Convert to SRT" />
                                        <span class="slider"></span>

                                    </span>
                                </div>
                                <div class="form-el">
                                    <button class="" name="filters">Edit filters</button>
                                </div>
                            </div>
                            <div class="form-block form-fedit" hidden>
                                <div class="form-el form-block">
                                    <label class="form-label">Add a language</label>
                                    <span class="form-input caret">
                                        <select title="Select your language" name="isolist"></select>
                                    </span>
                                    <button class="bt-square right" title="Add a language" name="addiso" disabled><i class="icon-plus"></i></button>
                                </div>
                                <ul></ul>
                                <div><div><strong class="left">ALL</strong><span>Remove All</span>
                                <button title="Remove language" name="rmisoall" class="bt-square right">
                                <i class="icon-minus"></i></button></div></div>
                                

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
                            opt.value = "";
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
        .form-body, .form-body *{line-height: 1.5;font-weight: 600;color:#333;font-size: 16px;}
        .form-body, .form-el, .form-el .form-input, .form-el .caret{position: relative;}
        .form-body, .form-el { margin: 0; padding: 0;border: none;}
        .form-body .form-title{
            display: block; padding: 0 0 16px 0; width: 100%;overflow: hidden;font-family: "Open Sans Condensed", sans-serif;
            background-color: transparent;border: none;cursor: pointer;font-size: 24px;font-weight:600;
        }
        .form-body .form-title:hover{color: rgb(0, 127, 216);}
        .form-el{padding: 0 0 8px 0;display: inline-block;}
        .form-el + .form-el{margin-left:8px;}
        .form-el .form-label{display: inline-block;}
        .form-el .form-label + .form-input{display: inline-block;margin-left: 8px;}
        .form-el .caret:after{content: "▼";position: absolute;right:.35rem;top: 50%;line-height:0;transform: translate(0, -50%);pointer-events: none;}
        .form-body input:not([type="checkbox"]):not([type="radio"]):not([type="image"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
        .form-body select, .form-body textarea{
            padding: 4px 12px;margin: 0; -moz-appearance: none;-webkit-appearance: none;-o-appearance: none;
            text-align: center; text-align-last: center;width: 100%;min-width: 256px;height: 32px;
            box-sizing: border-box;border-radius: 4px;background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);
        }
        .form-body button, .form-body [class*="bt-"]{
            height: 32px;padding: 4px 12px;box-sizing: border-box;border-radius: 4px; cursor: pointer;
            background-color: rgba(0,0,0,.03);border: 1px solid rgba(0,0,0,.125);
        }
        .form-body input:focus:not([type="checkbox"]):not([type="radio"]):not([type="image"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
        .form-body input:hover:not([type="checkbox"]):not([type="radio"]):not([type="image"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]),
        .form-body select:focus, .form-body textarea:focus, .form-body select:hover, .form-body textarea:hover,
        .form-body button:focus, .form-body [class*="bt-"]:focus, .form-body button:hover, .form-body [class*="bt-"]:hover
        {border: 1px solid rgb(0, 153, 204);background-color: rgba(0,0,0,.125);color: rgb(30, 130, 205);}
        .form-body button:focus [class*="icon-"], .form-body [class*="bt-"]:focus [class*="icon-"], .form-body button:hover [class*="icon-"], .form-body [class*="bt-"]:hover [class*="icon-"]
        {color: rgb(30, 130, 205);}
        .form-body .vkp-toggle + [type="checkbox"] {z-index: 2; position: absolute;top:0;left:0;width:100%;height:100%;cursor:pointer;opacity:0;}
        .form-body .vkp-toggle:not(.vkp-toggle-on) .vkp-toggle-bar{background-color: rgba(108, 117, 125, 1);}
        .form-body .vkp-toggle{background:rgba(255,255,255,.8);}
        .form-body .bt-square{line-height:0; padding: 4px 8px;vertical-align: top;}
        .form-body .form-select .form-label + .form-input{margin:0;}
        .form-body [class*="icon-"]{font-size: 12px;}


        
        .viki-plus .form-fedit{
            max-width: 470px;padding:0 16px 16px 16px;border: 1px solid rgba(0,0,0,.125);border-radius: 4px;
        }
        .viki-plus .form-fedit ul, .viki-plus .form-fedit ul + div{
            padding: 4px;box-sizing: border-box;border-radius: 4px; border: 1px solid rgba(0,0,0,.125);
        }
        .viki-plus .form-fedit ul li, .viki-plus .form-fedit ul + div div{
           height: 40px;text-align: center;
           border: 0;padding: 4px;
        }
        .viki-plus .form-fedit ul{
            border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom:0;
        }
        .viki-plus .form-fedit ul + div{
            border-top-left-radius: 0; border-top-right-radius: 0;
            padding: 0 4px;
        }
        .viki-plus .form-fedit ul li +li, .viki-plus .form-fedit ul{
            border-top: 1px solid rgba(0,0,0,.125);
        }
        .viki-plus .form-fedit ul:empty,.viki-plus .form-fedit ul:empty + div {display:none;}

        .form-block{display: block;padding:8px 0 16px 0;}
        .form-body [disabled] {pointer-events: none;opacity: .45;}
        .form-body [hidden],.form-body .form-el.form-select .form-label{display:none;}
        div.ads, div.ad, div.ad-1, div[id*="-ad-"]{position: fixed; top:-100%;right: -100%; height:1px; width:1px; opacity: 0; z-index: -1;}
        .viki-plus{background: rgb(235, 238, 242); padding: 8px 16px;border-radius: 8px;}
        `);


        addstyle(`
        /* switch */
       .switch,.switch .slider {position: relative;display: inline-block;}
       .switch [type="checkbox"] {opacity: 0;z-index: 2;}
       .switch [type="checkbox"],
        .switch .slider:after {position: absolute;top: 0;right: 0;left: 0;bottom: 0;min-width: 100%;min-height: 100%;cursor: pointer;}
       .switch .slider:after,.switch .slider:before {transition: 0.25s;content: "";position: absolute;}
       .switch .slider {width: 64px;height: 32px;vertical-align: middle;}
       .switch .slider:before {z-index:1;height: 24px;width: 24px;left: 4px;bottom: 4px;}
       .switch [type="checkbox"]:checked + .slider:before {transform: translateX(32px);}
       .switch.round .slider:after{border-radius: 32px;}
       .switch.round .slider:before{border-radius: 50%;}
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
        `);

        new VikiSubs(video_json, parsedSubtitles);

    }



})(document);