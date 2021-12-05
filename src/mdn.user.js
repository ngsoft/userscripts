// ==UserScript==
// @version      2.5
// @name         MDN + PHP Web Docs
// @description  Use MDN Web Docs and PHP UI to store locale and auto redirect to the choosen on every pages
// @namespace    https://github.com/ngsoft/userscripts
// @author       daedelus
// @run-at       document-end
// @grant        none
// @noframes
// @include      *://developer.mozilla.org/*
// @include      *://*php.net/manual/*
// @icon         https://developer.mozilla.org/favicon.ico
// @defaulticon  data:image/x-icon;base64,AAABAAMAEBAAAAEAIADvAAAANgAAACAgAAABACAAYwEAACUBAAAwMAAAAQAgAPkBAACIAgAAiVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAtklEQVR4AZWRJViGYRAEcXd3OmYNdzLS6SToSC9U3HtBG4n+EKl8CXeXdxb53Wwunu9GRSl4RFYQrejABSkaYoEtxhmhhVjvghzN86Y/ELKoxaMgUysYuXPEKEXYC2I0hoW8MNojg/+CaJWzZt6QFycUYF+RTJc5dO741DVvemaWeNeR+UyYc2zpKarpp5NkzzebuEaSTqnErw6pmuEO6ZhsAigZpwEO2DEpwbxIUSUxEZsVPH4ACU0+59cLKjAAAAAASUVORK5CYIKJUE5HDQoaCgAAAA1JSERSAAAAIAAAACAIBAAAANlzsn8AAAEqSURBVHgB7dQhbMJAFMZxEoKpQCBQFSh0HQofFBJVN1k1iZeYeiQKUzmDQmHq8FgSBApBuP93I9lCch23HltwfE82+fXda981Gvaf9QKeBkRKmPDGiJ5aehCIlLLiKKy1Z+1YMmNOzoAgINaCs+ydbIlVC/S0wnpy0YQaINYH9pdsSenKC3RVYGtyVqmpSWj+BDpaYAOz17upAE2bmVKldoHIhna1g/a1+qwCgS0ducDtELpWfUrdAWKlpGQm5Bg5nv8g0ozLnRZkTzrp68lBS/o+YMyaDQdVpz41QwZMyJkzxNmOageRYpUOgM3MQ8s04iT3/X0eAjKD75OFAR3lzj6uiUIAdxKZ2d+IglYY4NaA4nsWC/54J0YaU3BUXg/4q6WEhCffyi/gEzZg+zU7qF7TAAAAAElFTkSuQmCCiVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAABwElEQVR4Ae3XIZDaQAAFUG7WRKxCIU5ExmHwKBzyRP2cwtR1pg53FovA4U7Voc6gEKgqDIapO4OJ2Pz/t71mpsM1yTVJti7/+30i4S8ZDPx/bg/0QL32gJFVzIQxre5CA0M+YIMDLnzVhXuusjlGtLK654hGnQCrRxzh5N/F6cQ9DzjzxA0StgYSPhcOL+YFQ7YCJjzC10iqGVoAE36nr5knN1BDYIwjfO28aoEhGwAJD/CN4nTElyyhUQ0g5p6+TXTh2s1g9SFwzx18h6TaYYxKYMRv8J2zhVEpYLTAnnnPbA/sGZUDdz6SVfSr+VvUNgfYInDbmC/wHXIsAuEecz4e0UfAFE8u79pd2QZYZrW2yGrtIN84J8asAVitsn8fD6W63dsLt5ihxhZFWmap3FsrkQtX2QOmmGOBLU58O3wMo1pjZzXF7HefUXX8FLe/oBFjRmp8ow2rZk9fsyB38hypfEmunDAAYLSBL82ZozDA2nlVj0GxLZ7BpvTa38F0B/JaLbMri4M8CAHkNfqE01/EKgv81zHh9t37tAwJ5I00x+4P8jk0kNdqji1+0OsRoYBCjRIuMGH/AdKkPdADPwH8iDUX1erRUwAAAABJRU5ErkJggg==
// ==/UserScript==
(function(undef){


    /* globals 	unsafeWindow, GM_info, GM, EventTarget   */
    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */
    /* jshint sub:true */


    const
            // Scallar types
            string = "string",
            f = "function",
            global = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window),
            doc = global.document,
            // GMInfo
            GMinfo = (typeof GM_info !== 'undefined' ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
            scriptname = GMinfo ? `${GMinfo.script.name}@${GMinfo.script.version}` : "",
            UUID = GMinfo ? GMinfo.script.uuid : "",
            lang = new (class {

                get key(){
                    return UUID + ":locale";
                }

                get current(){
                    return localStorage.getItem(this.key) || "";
                }

                set current(language){
                    if (this.isValid(language)) localStorage.setItem(this.key, language);
                    else if (language === null) localStorage.removeItem(this.key);
                }

                is(language){
                    return this.isValid(language) && language === this.current;
                }

                isValid(language){
                    return typeof language === string && /^[a-z]{2,3}(?:[-_][a-z]{2,3})?$/i.test(language);
                }

                constructor(){
                    // erase settings on version change
                    let key = UUID + ":version";
                    if (localStorage.getItem(key) !== GMinfo.script.version) {
                        localStorage.setItem(key, GMinfo.script.version);
                        this.current = null;
                    }
                }

            })(),
            tools = {

                _getTarget: function _getTarget(el){
                    if (typeof el === string) return doc.querySelectorAll(el);
                    if (el instanceof Element || el instanceof NodeList) return el;
                    return null;
                },

                on: function on(el, type, callback, capture){
                    if (typeof callback !== f || typeof type !== string) return;
                    el = this._getTarget(el);
                    if (el instanceof EventTarget) type.split(/\s+/).forEach(t => el.addEventListener(t, callback, capture === true));
                    else if (el instanceof NodeList) el.forEach(x => this.on(x, type, callback, capture));
                },
                off: function off(el, type, callback, capture){
                    if (typeof callback !== f || typeof type !== string) return;
                    el = this._getTarget(el);
                    if (el instanceof EventTarget) type.split(/\s+/).forEach(t => el.removeEventListener(t, callback, capture === true));
                    else if (el instanceof NodeList) el.forEach(x => this.off(x, type, callback, capture));
                },
                trigger: function trigger(el, type, bubbles, cancelable){
                    if (typeof type !== string) return;
                    el = this._getTarget(el);
                    if (el instanceof EventTarget) {
                        let event;
                        type.split(/\s+/).forEach(t => {
                            if (el.parentElement === null) event = new Event(t);
                            else event = new Event(t, {bubbles: bubbles !== false, cancelable: cancelable !== false});
                            el.dispatchEvent(event);
                        });
                    } else if (el instanceof NodeList) el.forEach(x => this.trigger(x, type, bubbles, cancelable));
                }
            };



    /**
     * Find translation link (works for both)
     * @param {string} locale
     * @returns {string|undefined}
     */
    function getPageLink(locale){
        if (typeof locale !== string) return;
        let locales = [locale, locale.split(/[\_\-]/).shift()], current, elem, href;
        for (let i = 0; i < locales.length; i++) {
            current = locales[i];
            elem = doc.documentElement.querySelector(`link[rel="alternate"][hreflang="${current}"]`);
            if (elem instanceof Element && typeof (href = elem.getAttribute('href')) === string) {
                return (new URL(href)).pathname;
            }
        }
    }


    /**
     * Check if current page is with the right locale
     * @param {string} locale
     * @returns {Boolean}
     */
    function isCurrentLocale(locale){
        if (typeof locale !== string) return false;
        return getPageLink(locale) === location.pathname;
    }


    /**
     * Works for both
     */

    let
            currentLocale = lang.current,
            localePathname = getPageLink(currentLocale);


    if (currentLocale.length > 0 && typeof localePathname === string && !isCurrentLocale(currentLocale)) {
        location.replace(localePathname);

    }



    /**
     * developer.mozilla.org
     * just override an event
     */

    if (/mozilla.org/i.test(location.hostname)) {

        tools.on('#root', 'submit', e => {
            let form = e.target.closest('form.language-menu'), locale, pathname;
            if (form instanceof EventTarget) {
                e.stopPropagation();
                e.preventDefault();
                locale = form.elements.language.value;
                if (lang.isValid(locale) && lang.current !== locale) {
                    lang.current = locale;
                    if ((pathname = getPageLink(locale)) && !isCurrentLocale(locale)) {
                        location.replace(pathname);
                    }
                }

            }
        }, true);
    }




    /**
     * php.net
     * override an event
     */
    if (/php.net/i.test(location.hostname)) {


        //replace the event
        tools.on('form#changelang', 'change', e => {
            let select = e.target.closest('select#changelang-langs');
            if (select instanceof Element) {
                e.preventDefault();
                let locale = select.value.split('/').shift();

                if (lang.isValid(locale)) lang.current = locale;
                //restore default event
                select.form.submit();
            }
        });
    }


    console.debug(scriptname, 'started');


})();