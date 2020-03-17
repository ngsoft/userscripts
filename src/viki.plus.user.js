// ==UserScript==
// @version     2.0
// @name        ViKi+
// @description Download Subtitles on Viki
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.1/dist/gmutils.min.js
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


    let newsession = sessionStorage.getItem(UUID + "session") === null;

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
     * Loads Stylesheet
     */
    rload.require("https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/viki.plus.min.css");


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
            return doc.querySelector('.viki-plus-container');
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
                            //this.innerHTML = doc.querySelector('.vkp-pos-container-title').innerText;
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
                        },
                        click(e){
                            let target, iso;
                            if ((target = e.target.closest('button')) !== null) {
                                e.preventDefault();
                                if (target.matches('[name="rmiso"]')) {
                                    if ((iso = target.parentElement.data("isocode"))) {
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
                this.one("converter.ready", () => {
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

                                    <span class="form-input switch-round">

                                        <input type="checkbox" name="convert" title="Convert to SRT" />
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

            let modal = html2element(
                    `<div class="viki-plus-modal" aria-hidden="true" id="viki-plus">
                        <div tabindex="-1" data-micromodal-close>
                            <div role="dialog" aria-modal="true" aria-labelledby="viki-plus-modal-title" class="viki-plus-container">



                            </div>
                        </div>
                    </div>`
                    );


            this.json = json || {};
            this.subtitles = subs || [];

            if (typeof self.json.id !== u && self.subtitles.length > 0) {
                self.elements = {
                    root: template,
                    modal: modal,
                    inputs: {}
                };

                find('#playerSettings > .vjs-menu > .vjs-menu-content', 50000, (menu) => {

                    menu.appendChild(html2element(`<li class="vkp-menu-item vjs-menu-item vkp-menu-separator"></li>`));
                    let button = html2element(
                            `<li class="vkp-menu-item vjs-menu-item">
                                <div class="vkp-menu-label">
                                    <div class="vkp-menu-title">Download</div>
                                </div>
                                <div class="vkp-submenu-label">
                                    <span class="vkp-submenu-title">Select</span>
                                    <i class="vkp-menu-arrow vkp-icon-arrow-right"></i>
                                </div>
                                <div class="vjs-menu" role="presentation">
                                    <ul class="vjs-menu-content" role="menu"></ul>
                                </div>
                            </li>`
                            );

                    menu.appendChild(button);

                    Events(button).on('click', () => {
                        modal.classList.add('open');
                    });

                });
                doc.body.appendChild(modal);

                self.elements.root.querySelectorAll('[name]').forEach(input => {
                    self.elements.inputs[input.name] = input;
                });
                ["title", "body", "fedit"].forEach(key => {
                    self.elements[key] = self.elements.root.querySelector('.form-' + key);
                });

                Object.keys(self.events).forEach(key => {
                    let elem = self.elements[key] || this.elements.inputs[key];
                    if (elem instanceof EventTarget) {
                        Object.keys(self.events[key]).forEach(evt => {
                            Events(elem).on(evt, self.events[key][evt]);
                        });
                    }
                });

                self.target.appendChild(template);
                new Events(self.elements.root, self);

                self.on('init', () => {
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

                self.trigger('init');


                Events(modal).on('click', (e) => {
                    let target = e.target;
                    if (target.closest('.viki-plus-container') === null) {
                        modal.classList.remove('open');
                    }
                });


                console.debug(scriptname, "started");
            }


        }

    }


    /**
     * API Load data
     */
    let matches;
    if ((matches = /^\/videos\/(\w+)\-/.exec(location.pathname)) !== null) {
        let id = matches[1], api = 'https://www.viki.com/api/videos/' + id;

        fetch(api, {cache: "no-store", redirect: 'follow', credentials: "same-origin"})
                .then((r) => {
                    if (r.status === 200) return r.json();
                    throw new Error("Cannot Fetch", api);
                })
                .then((json) => {
                    let subtitles = json.subtitles, video = json.video;
                    new VikiSubs(video, subtitles);
                })
                .catch((err) => {
                    console.warn(err);
                });

    }


})(document);