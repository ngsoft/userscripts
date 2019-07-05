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

    const rload = new rloader(UUID, week);

    //clear cache on upgrade
    (() => {
        let last = localStorage.getItem(UUID);
        if (last !== GMinfo.script.version) rload.clear();
        localStorage.setItem(UUID, GMinfo.script.version);
    })();



    class Settings {
        static get store(){
            if (typeof this.__store__ === u) this.__store__ = new LocalSettings({
                    locale: "",
                    convert: false,
                    filters: []
                });
            return this.__store__;
        }

        static get locale(){
            return this.store.get("locale");
        }

        static set locale(locale){
            if (typeof locale === s) this.store.set("locale", locale);
        }

        static get convert(){
            return this.store.get("convert") === true;
        }

        static set convert(flag){
            if (typeof flag === b) this.store.set("convert", flag);
        }

        static get filters(){
            return this.store.get("filters") || [];
        }
        static set filters(arr){
            if (isArray(arr)) this.store.set("filters", arr);

        }

    }





            console.debug([Settings.locale, Settings.convert, Settings.filters], localStorage);



    const resources = [
        "https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/altvideo.css",
        "https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js",

    ];













})(document);