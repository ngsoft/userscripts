// ==UserScript==
// @name        PHP Web Docs
// @namespace   https://github.com/ngsoft
// @version     2.4
// @description Use PHP UI to store locale and auto redirect to the choosen on every pages
// @author      daedelus
// @include     *://*php.net/manual/*
// @noframes
// @grant       none
// run-at       document-end
// @icon        https://www.php.net/favicon.ico
// ==/UserScript==


(function(doc, undef){

    if (typeof Storage === 'undefined' || !window.hasOwnProperty('localStorage') || !(window.localStorage instanceof Storage)) {
        return;
    }

    const
            GMinfo = (GM_info ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
            UUID = GMinfo.script.uuid,
            lang = (new class {

                get key(){
                    return UUID + ":" + "locale";
                }

                get current(){
                    return localStorage.getItem(this.key) || "";
                }

                set current(lang){
                    if (this.isValid(lang)) localStorage.setItem(this.key, lang);
                    else if (lang === null) localStorage.removeItem(this.key);
                }

                is(lang){
                    return this.isValid(lang) ? lang === this.current : false;
                }

                isValid(lang){
                    return typeof lang === typeof "" ? /^[a-z]{2,3}(?:[-_][a-z]{2,3})?$/i.test(lang) : false;
                }

            }),
            tools = (new class {

                _getTarget(el){
                    if (typeof el === typeof "") return doc.querySelectorAll(el);
                    if (el instanceof Element ? true : el instanceof NodeList) return el;
                    return null;
                }


                on(el, type, callback, capture){
                    if (typeof callback !== "function" || typeof type !== typeof "") return;
                    const self = this;
                    el = this._getTarget(el);
                    if (el instanceof EventTarget) type.split(/\s+/).forEach(t => el.addEventListener(t, callback, capture === true));
                    else if (el instanceof NodeList) el.forEach(x => self.on(x, type, callback, capture));

                    console.debug(el, type);

                }
                off(el, type, callback, capture){
                    if (typeof callback !== "function" || typeof type !== typeof "") return;
                    const self = this;
                    el = this._getTarget(el);
                    if (el instanceof EventTarget) type.split(/\s+/).forEach(t => el.removeEventListener(t, callback, capture === true));
                    else if (el instanceof NodeList) el.forEach(x => self.off(x, type, callback, capture));
                }
                trigger(el, type, bubbles, cancelable){
                    if (typeof type !== typeof "") return;
                    const self = this;
                    el = this._getTarget(el);
                    if (el instanceof EventTarget) {
                        type.split(/\s+/).forEach(t => {
                            el.dispatchEvent(new Event(t, {bubbles: bubbles !== false, cancelable: cancelable !== false}));
                        });
                    } else if (el instanceof NodeList) el.forEach(x => self.trigger(x, type, bubbles, cancelable));
                }
            });






    /**
     * developer.mozilla.org
     * not working anymore
     */


    /**
     * php.net
     * Add a button and override event
     */
    if (location.hostname.match(/php.net$/i) !== null) {

        //detects locales and redirects to the stored one
        doc.querySelectorAll('select#changelang-langs').forEach(x => {

            x.querySelectorAll('option').forEach(o => {
                let
                        locale = o.value.split('/').shift(),
                        uri = '/manual/' + o.value;

                if (lang.is(locale) ? location.pathname !== uri : false) location.replace(uri);
            });
            //remove default event
            x.onchange = null;

        });
        //replace the event
        tools.on('form#changelang', 'change', e => {
            let t = e.target.closest('select#changelang-langs');
            if (t !== null) {
                e.preventDefault();
                let
                        value = t.value,
                        locale = value.split('/').shift();

                if (lang.isValid(locale)) lang.current = locale;
                //restore default event
                t.form.submit();
            }
        });
    }

})(document);