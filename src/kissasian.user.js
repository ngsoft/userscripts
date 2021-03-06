// ==UserScript==
// @name         Kissasian 2.0
// @namespace    https://github.com/ngsoft
// @version      1.3.1
// @description  Kissasian, Kissanime, Kissmanga Integration
// @author       daedelus
// 
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @noframes
// @grant none
// @run-at       document-body
//
// @icon        https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/assets/img/kissasian.ico
// @include     /^https?:\/\/(\w+\.)?kiss(asian|anime|manga|tvshow)(\w+)?\.\w+\//
// ==/UserScript==

((doc, undef) => {
    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    if (doc.querySelector('#cf-content, #cf-wrapper') !== null) {
        return;
    }

    /**
     * Use search engine
     */
    const url = new URL(location.href);
    let query = url.searchParams.get('q');
    if (query !== null) {
        find('#formSearch, .search_box form', (form) => {
            let input = form.querySelector('#keyword, [name="keyword"]'), btn = form.querySelector('#imgSearch, [type="submit"]');
            input.value = query;
            btn.click();
        });
    }



    /**
     * MyDramaList Search
     */
    class MDLSearch {
        static applyStyle(){
            if (this.style === true) return;
            this.style = true;
            addstyle(`
                .mdl-search {
                    padding: 0px;margin: 0 4px;display: inline-block;color: rgb(255, 255, 255);
                    border-radius: 2px;float: left;width: 32px;height: 32px;background-color: rgba(0, 0, 0, 0.3);
                    box-sizing: border-box;position: relative;cursor:pointer;
                }
                .mdl-search:hover{background: rgb(0, 0, 0) none repeat scroll 0% 0%;}
                .mdl-search img{position: absolute; top:50%;left: 50%;transform: translate(-50%,-50%);}
            `);
        }


        search(query){
            if (typeof query === s) {
                let url = new URL('https://mydramalist.com/search');
                url.searchParams.set('q', query);
                let link = doc.createElement('a');
                Object.assign(link, {
                    target: "_blank",
                    style: "opacity: 0;",
                    href: url.href
                });
                doc.body.appendChild(link);
                setTimeout(() => {
                    doc.body.removeChild(link);
                }, 10);
                link.click();
            }

        }



        constructor(title){
            MDLSearch.applyStyle();
            Object.assign(this, {
                title: title.innerText.trim(),
                btn: html2element('<a class="mdl-search" title="MyDramaList Search" href="#"><img src="https://mydramalist.com/favicon.ico" /></a>')
            });
            const self = this;
            title.appendChild(self.btn);

            Events(self.btn).on('click', (e) => {
                e.preventDefault();
                self.search(self.title);

            });

        }

    }

    /**
     * Some Alterations
     */
    NodeFinder.find('[src*="firefox.png"]', (node) => {
        node.parentElement.parentElement.classList.add('hidden');
    });

    NodeFinder.find('#divContentVideo, #my_video_1', (node) => {
        node.style.width = "854px";
        node.style.height = "552px";
    });

    NodeFinder.find('#rightside .rightBox .barTitle', (div) => {
        let title = div.innerText;
        if(/ads/.test(title) || /Like me/.test(title)){
            div.parentElement.classList.add('hidden');
        }
    });


    /**
     * Reverse Episode List
     */
    NodeFinder.find('.episodeList .listing', (node) => {
        let list = [], header = [];
        node.querySelectorAll('tr').forEach((tr) => {
            if (tr.querySelector('td') === null) header.push(tr);
            else list.push(tr);
            tr.remove();
        });
        list = list.reverse();
        header.forEach(tr => node.appendChild(tr));
        list.forEach(tr => node.appendChild(tr));
    });
    /**
     * Same for mobile
     */
    NodeFinder.find('.shifter-page .main ul.list', (ul) => {

        let list = Array.from(ul.querySelectorAll('li')).map((li) => {
            li.remove();
            return li;
        }).reverse();
        list.forEach(li => ul.appendChild(li));

    });



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

        static get server(){
            return this.store.get(this.prefix + "server") || null;
        }

        static set server(server){
            if (typeof server === s) this.store.set(this.prefix + "server", server);
        }

        static get name(){
            return this.store.get(this.prefix + "name") || "";
        }

        static set name(name){
            if (typeof name === s) this.store.set(this.prefix + "name", name);
        }
        static get enabled(){
            return this.store.get(this.prefix + "enabled") === true;
        }

        static set enabled(flag){
            if (typeof flag === b) this.store.set(this.prefix + "enabled", flag);
        }


    }



    class NavItem {

        constructor(item, events ){
            if (!(item instanceof Element)) {
                throw new Error('Item not an Element.');
            }
            const self = this;
            Object.assign(this, {
                container: doc.querySelector('#headnav #navsubbar p'),
                item:item,
                events: (isPlainObject(events)) ? events : {}
            });

            if (self.container === null) {
                return;
            }
            if (self.container.querySelectorAll('a').length > 0) {
                self.container.appendChild(doc.createTextNode("| "));
            }

            self.container.appendChild(self.item);

            new Events(self.item, self);
            
            Object.keys(self.events).forEach((evt) => {
                if (typeof self.events[evt] === f) self.on(evt, self.events[evt]);
            });

            self.trigger('init');

        }

    }


    /**
     * Hide ads and more
     */
    addstyle(`
        .hidden, .hidden *,
        .bigBarContainer + div:not(.bigBarContainer),
        [id*="ads"]:not(.bigBarContainer), [id*="ads"]:not(.bigBarContainer) *,
        [id*="Ads"], [id*="Ads"] *,[class*="Ads"], [class*="Ads"] *,
        [src*="/Ads"]:not(#my_video_1), [src*="/Ads"] *,
        .episodeList div:not(.arrow-general) div:not([id]),
        #subcontent > div:not([id]),
        [id*="mgi"], [style*="fixed"], [style*="fixed"] *,
        [style*="width: 610px"], [style*="width: 610px"] *,
        .cmpbox, body > *:not(#footer):not(#containerRoot):not(.kodirpc-ui):not(.kodirpc-settings),
        body > *:not(#footer):not(#containerRoot):not(.kodirpc-ui):not(.kodirpc-settings) *
        {
            position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
            height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
            display: inline !important;z-index: -1 !important;
        }
        [class*="clear"]{ height: 0 !important;max-height: 0 !important;}
        #centerDivVideo{ margin-top: 15px;}
        #headnav #navsubbar p a [type="checkbox"]{vertical-align: top; margin: 4px;}
        #headnav #navsubbar p label{cursor: pointer;}
        span.server-name:not(:empty):before{display: inline; content: ": ";}
        body{overflow: inherit !important;}
    `);


    /**
     * MenuItems
     */

    const menu = {
         
        server: new NavItem(html2element(`<a href="#"><label><input type="checkbox"> Auto Server <span class="server-name"></span></label></a>`), {
            click(e){
                
                let ckbox = this.item.querySelector('[type="checkbox"]');
                ckbox.checked = ckbox.checked !== true;
                this.trigger("change");
                e.preventDefault();
            },
            change(e){
                let ckb = this.item.querySelector('[type="checkbox"]'),span = this.item.querySelector('span.server-name');
                Settings.enabled = ckb.checked === true;
                span.innerHTML = "";
                if((Settings.enabled === true) && (Settings.name.length > 0)){
                    span.innerHTML = Settings.name;
                    //update all links
                    NodeFinder.find('a[href*="id="]', a => {
                        let url = new URL(a.href);
                        url.searchParams.set('s', Settings.server);
                        a.href = url.href;
                    }, 5000);

                    NodeFinder.find('select#selectEpisode option', opt => {
                        let url = new URL(getURL(opt.value));
                        url.searchParams.set('s', Settings.server);
                        let split = url.pathname.split('/'), newval = split.pop() + url.search;
                        opt.value = newval;
                    }, 5000);

                }

            },
            init(e){
                if(Settings.enabled === true){
                    let ckb = this.item.querySelector('[type="checkbox"]');
                    ckb.checked = Settings.enabled === true;
                    this.trigger('change');
                }
                const self = this;
                doc.querySelectorAll('select#selectServer').forEach(select => {
                    select.onchange = evt => {
                        evt.preventDefault();
                        let selected = select.querySelector(`option[value="${select.value}"]`), url = new URL(getURL(selected.value));
                        if (Settings.enabled === true) {
                            Settings.server = url.searchParams.get('s');
                            Settings.name = selected.innerText.trim();
                            self.trigger("change");
                        }

                        location.replace(url.href);
                    };
                });
            }
        })
     };

    //KodiRPC Compat
    NodeFinder.find('video.vjs-tech', video => {
        let parent = video.closest('div[id]');
        vjs = videojs(parent.id);
        if (vjs.tech_ && vjs.tech_.currentSource_ && vjs.tech_.currentSource_.src) video.data('src', vjs.tech_.currentSource_.src);
        //html2element('<video preload="none" controls tabindex="-1" src="" class="altvideo" data-src=""></video>')
    });


    //MDL Search

    NodeFinder.find('#leftside a.bigChar[href*="/Drama/"]', el => {
        new MDLSearch(el);
    });



    console.debug(scriptname, 'started');

})(document);