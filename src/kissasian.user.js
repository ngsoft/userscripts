// ==UserScript==
// @name         Kissasian 2.0
// @namespace    https://github.com/ngsoft
// @version      1.3.1
// @description  Kissasian, Kissanime, Kissmanga Integration
// @author       daedelus
// @require      https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @noframes
// @grant        none
// @run-at       document-body
// @icon         https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/assets/img/kissasian.ico
// @include      /^https?:\/\/(\w+\.)?kiss(asian|anime|manga|tvshow)(\w+)?\.\w+\//
// @defaulticon  data:image/x-icon;base64,AAABAAIAEBAAAAAAIABoBAAAJgAAACAgAAAAACAAqBAAAI4EAAAoAAAAEAAAACAAAAABACAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAAAA////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AY9En72mZ7UH////Af///wH///8B////Af///wH///8Bc5bSQ0+V4flCnej/RKfr/0aw7f9Iuu//TcHv/3G241WBLpX/hDaex6hqsw////8B////Af///wH///8BdpHPPUuM3/tBlOb/Qp3o/0Sn6/9GsO3/Srju/3Sx4Hf///8BgS6V/3kmlv+CNKLRp2qzF////wH///8Bfo/LN0uF3Pc/iuP/QZTm/0Kd6P9Ep+v/R6/t/3Ks34H///8B////AYEulf95Jpb/eCac/38zpdmlZ7UfwqqxIUp92fU+guH/P4rj/0GU5v9Cnej/Rabq/3Gl3o3///8B////Af///wGBLpX/eSaW/3gmnP92JqH/fTKp47CBs0VNftnnPoLh/z+K4/9BlOb/Qp3o/26f3Zv///8B////Af///wH///8BgS6V/3kmlv94Jpz/diah/3Qmpv97Mq3rnHe7UVKH2tk/iuP/QZTm/2uZ3KX///8B////Af///wH///8B////AY1AmsV5Jpb/eCac/3Ymof90Jqb/cyar/3kxsvOZa7pLaZDWw3GT2aX///8B////Af///wH///8B////Af///wF6hc1rjUKeu3gmnP92JqH/dCam/3Mmq/9wJrD/djC3+YxNvj////8B////Af///wH///8B////Af///wH///8BSHrc/2qL14eSSqKvdiah/3Qmpv9zJqv/cCaw/28ntv90Lrv7h0jCSf///wH///8B////Af///wH///8B////AUZ63f9AiuP/apncn5VRpZ90Jqb/cyar/3AmsP9vJ7b/bSa7/3AswP2FSMZV////Af///wH///8B////Af///wFGet3/P4rj/0Kd6P9mpuGvllSoi3Qoq/9wJrD/bye2/20mu/9rJ8D/bCvG/4NHyGP///8B////Af///wH///8BRnrd/z+K4/9Cnej/RrDt/2yw5LmWVatzcymx/28ntv9tJrv/ayfA/2koxv9pKsr/g0nLc////wH///8B////AUZ63f8/iuP/Qp3o/0aw7f9is+n9////AZJTsF1zLLb/bSa7/2snwP9pKMb/ZyfK/2co0P+CSs6H////Af///wFGet3/P4rj/0Kd6P9GsO3/YrPp/f///wH///8BlFW1TX48vPt4NsH/djfH/3Q2yv9zNs//cjfU/5Ndz4f///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8oAAAAIAAAAEAAAAABACAAAAAAAIAQAAAAAAAAAAAAAAAAAAAAAAAA////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AZtVo+mkZLkR////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BzcagDXeY1OdGluX/Qpvo/0Of6f9EpOr/Rars/0au7f9Gs+7/SLjv/0m87/9KwfD/S8bx/2O86f3///8BhzeZ/41AofmmZ7Ub////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Abq9qQltk9bzQZLm/0KX5v9Cm+j/Q5/p/0Sk6v9Fquz/Rq7t/0az7v9IuO//Sbzv/0rB8P9Xv+3/nafRVf///wGHN5n/eyWS/4k9ofunabMp////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wHJwqEFc5LT70CN4/9Bkub/Qpfm/0Kb6P9Dn+n/RKTq/0Wq7P9Gru3/RrPu/0i47/9JvO//Vrrt/5uo0Wf///8B////AYc3mf97JZL/eiaV/4Y5ov2oarM3////Af///wH///8B////Af///wH///8B////Af///wH///8B+NeMA3SQ0es/iOP/QI3j/0GS5v9Cl+b/Qpvo/0Of6f9EpOr/Rars/0au7f9Gs+7/SLjv/1K37f+XpdNz////Af///wH///8BhzeZ/3slkv96JpX/eSaY/4M2o/+oa7NJ////Af///wH///8B////Af///wH///8B////Af///wF6kM/jPoTh/z+I4/9AjeP/QZLm/0KX5v9Cm+j/Q5/p/0Sk6v9Fquz/Rq7t/0az7v9Ote3/maXRe////wH///8B////Af///wGHN5n/eyWS/3omlf95Jpj/eCab/4EzpP+narNZ////Af///wH///8B////Af///wH///8Bfo/L3T6A4f8+hOH/P4jj/0CN4/9Bkub/Qpfm/0Kb6P9Dn+n/RKTq/0Wq7P9Gru3/TLDt/5Wk0o3///8B////Af///wH///8B////AYc3mf97JZL/eiaV/3kmmP94Jpv/eCad/30wpf+narNr////Af///wH///8B////AYCOydU8e9//PoDh/z6E4f8/iOP/QI3j/0GS5v9Cl+b/Qpvo/0Of6f9EpOr/Rars/0qs7P+RodSX////Af///wH///8B////Af///wH///8BhzeZ/3slkv96JpX/eSaY/3gmm/94Jp3/diag/3stpv+lZ7V9////Af///wHCqrGDO3be/zx73/8+gOH/PoTh/z+I4/9AjeP/QZLm/0KX5v9Cm+j/Q5/p/0Sk6v9Iqev/kqDTof///wH///8B////Af///wH///8B////Af///wGHN5n/eyWS/3omlf95Jpj/eCab/3gmnf92JqD/diai/3krp/+jZraP////AcWsr3U9dt7/PHvf/z6A4f8+hOH/P4jj/0CN4/9Bkub/Qpfm/0Kb6P9Dn+n/RqPq/42f1LH///8B////Af///wH///8B////Af///wH///8B////AYc3mf97JZL/eiaV/3kmmP94Jpv/eCad/3YmoP92JqL/dSal/3Ypqf+hY7ah////AZeYwKNCe97/PoDh/z6E4f8/iOP/QI3j/0GS5v9Cl+b/Qpvo/0Sf6f+Km9S7////Af///wH///8B////Af///wH///8B////Af///wH///8BhzeZ/3slkv96JpX/eSaY/3gmm/94Jp3/diag/3Ymov91JqX/dCan/3Qoqv+fYbix////AZ6evoVIgd//PoTh/z+I4/9AjeP/QZLm/0KX5v9Cm+j/iZnUxf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wGHN5n/eyWS/3omlf95Jpj/eCab/3gmnf92JqD/diai/3Umpf90Jqf/cyap/3Qorf+bXbnB////AaekumlOhd7/P4jj/0CN4/9Bkub/Qpfm/4OX1tH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AZZNn/t7JZL/eiaV/3kmmP94Jpv/eCad/3YmoP92JqL/dSal/3Qmp/9zJqn/cyet/3Emr/+YWrrP////AamouE1Vid7/QI3j/0GS5v+AlNbZ////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B0J+YIZBFnvl6JpX/eSaY/3gmm/94Jp3/diag/3Ymov91JqX/dCan/3Mmqf9zJ63/cSav/3Amsv+UVrvd////Acq2qiuelsnlpJXLvf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wHJpLUp06KRF5RMofd5Jpj/eCab/3gmnf92JqD/diai/3Umpf90Jqf/cyap/3Mnrf9xJq//cCay/28ntP+QUb3nomjNBf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AV181/2PjMxt1aaOC5lUpO94Jpv/eCad/3YmoP92JqL/dSal/3Qmp/9zJqn/cyet/3Emr/9wJrL/bye0/28nuP+MTL7vnGHMCf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BUHja/0Z93/+Nj8+D+NeMA55cpuV4Jp3/diag/3Ymov91JqX/dCan/3Mmqf9zJ63/cSav/3Amsv9vJ7T/bye4/24muv+ISMDznmTJEf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wFQeNr/PX3g/0SG4f+KktGb////AaRkptl2JqD/diai/3Umpf90Jqf/cyap/3Mnrf9xJq//cCay/28ntP9vJ7j/bia6/20nvP+DQ8L3pGzGGf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AVB42v89feD/P4bi/0KO5P+Hl9Oz////Aahrp8l3J6L/dSal/3Qmp/9zJqn/cyet/3Emr/9wJrL/bye0/28nuP9uJrr/bSe8/2wnv/9/P8P7pW3GJf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8BUHja/z194P8/huL/QI7k/0OZ5/+Dm9fH////Aa1yqLV2KKb/dCan/3Mmqf9zJ63/cSav/3Amsv9vJ7T/bye4/24muv9tJ7z/bCe//2snwf97PMb9pW7GMf///wH///8B////Af///wH///8B////Af///wH///8B////Af///wFQeNr/PX3g/z+G4v9AjuT/Qpnn/0Oi6v99oNrZ////AbF3qJ93Kqn/cyap/3Mnrf9xJq//cCay/28ntP9vJ7j/bia6/20nvP9sJ7//ayfB/2ooxf93OMj9omvGP////wH///8B////Af///wH///8B////Af///wH///8B////AVB42v89feD/P4bi/0CO5P9Cmef/Q6Lq/0Wr7P93p97nmY7bBbN7qIt4Laz/cyet/3Emr/9wJrL/bye0/28nuP9uJrr/bSe8/2wnv/9rJ8H/aijF/2kox/9zNMr/omzGT////wH///8B////Af///wH///8B////Af///wH///8BUHja/z194P8/huL/QI7k/0KZ5/9Dour/Ravs/0i17v9yruLxn43aC7V/p3N7MbD/cSav/3Amsv9vJ7T/bye4/24muv9tJ7z/bCe//2snwf9qKMX/aSjH/2gnyf9wMsz/oWvHX////wH///8B////Af///wH///8B////Af///wFQeNr/PX3g/z+G4v9AjuT/Qpnn/0Oi6v9Fq+z/SLXu/0m+8P+Kp9vr////AbuGp1t8NLL/cCay/28ntP9vJ7j/bia6/20nvP9sJ7//ayfB/2ooxf9pKMf/aCfJ/2cozP9tL8//n2nIcf///wH///8B////Af///wH///8B////AVB42v89feD/P4bi/0CO5P9Cmef/Q6Lq/0Wr7P9Ite7/Sb7w/3yo4/3///8B////Ab6LpkV+OLX/bye0/28nuP9uJrr/bSe8/2wnv/9rJ8H/aijF/2kox/9oJ8n/ZyjM/2coz/9pLNL/nWjJhf///wH///8B////Af///wH///8BUHja/z194P8/huL/QI7k/0KZ5/9Dour/Ravs/0i17v9JvvD/fKjj/f///wH///8B////AcKRpTOCP7f9bye4/24muv9tJ7z/bCe//2snwf9qKMX/aSjH/2gnyf9nKMz/ZyjP/2Un0v9nK9T/m2bLl////wH///8B////Af///wFQeNr/PX3g/z+G4v9AjuT/Qpnn/0Oi6v9Fq+z/SLXu/0m+8P98qOP9////Af///wH///8B////AceYoyWHRbr7bia6/20nvP9sJ7//ayfB/2ooxf9pKMf/aCfJ/2cozP9nKM//ZSfS/2Qo1P9lKtf/mGPNqf///wH///8B////AVB42v89feD/P4bi/0CO5P9Cmef/Q6Lq/0Wr7P9Ite7/Sb7w/3yo4/3///8B////Af///wH///8B////AdarnhebYLrxhkbB/4VGw/+ERcT/hEbH/4NGyf+CRcr/gkbM/4JGzv+ARdD/gEbR/39G1P9/SNb9toXFef///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
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