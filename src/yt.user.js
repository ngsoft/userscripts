// ==UserScript==
// @name         Youtube Embed
// @namespace    https://github.com/ngsoft/userscripts
// @version      1.2.1
// @description  Embed Video Link
// @author       daedelus
// @require      https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @grant        none
// @run-at       document-body
// @icon         https://www.youtube.com/favicon.ico
// @include      /^https?:\/\/www\.(youtube|dailymotion)\.com\/embed\//
// @defaulticon  data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAAD/EAAA/0AAAP9AAAD/cAAA/4AAAP+AAAD/gAAA/4AAAP+AAAD/QAAA/0AAAP8Q////AP///wD///8AAAD/YAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/2D///8AAAD/MAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD/MAAA/1AAAP//AAD//wAA//8AAP//AAD//wAA//8QEP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/2AAAP+AAAD//wAA//8AAP//AAD//wAA//8AAP//4OD//1BQ//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP+AAAD/gAAA//8AAP//AAD//wAA//8AAP//AAD/////////////wMD//yAg//8AAP//AAD//wAA//8AAP//AAD/gAAA/4AAAP//AAD//wAA//8AAP//AAD//wAA/////////////7Cw//8gIP//AAD//wAA//8AAP//AAD//wAA/4AAAP+AAAD//wAA//8AAP//AAD//wAA//8AAP//4OD//0BA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP+AAAD/UAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD/YAAA/zAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/zD///8AAAD/YAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA/2D///8A////AP///wAAAP8QAAD/QAAA/0AAAP+AAAD/gAAA/4AAAP+AAAD/gAAA/4AAAP9AAAD/QAAA/xD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A//8AAP//AADAAwAAgAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAEAAMADAAD//wAA//8AAA==
// ==/UserScript==
((doc, undef) => {


    class List extends Array {
        get html(){
            let ul = doc.createElement('ul');
            this.forEach(item => {
                let li = doc.createElement('li');
                if (item instanceof Element) li.appendChild(item);
                else if (typeof item === s) li.innerHTML = item;
                ul.appendChild(li);
            });
            return ul;
        }
    }


    class ToolBar {

        static style(){
            if (this.applied === true) return;

            let css = `
                .user-toolbar{position: absolute; list-style-type: none; top: 15%; left:5%;text-align: center; z-index: 2147483647;}
                .dmp_iframe .user-toolbar{left: auto; right: 5%; top: 3%;}
                .user-toolbar li{padding: 4px;}
                .user-toolbar a{color: inherit; text-decoration: none; font-size: 18px;}
                .html5-video-player .user-toolbar a{
                     -moz-transition: color .1s cubic-bezier(0.0,0.0,0.2,1);
                    -webkit-transition: color .1s cubic-bezier(0.0,0.0,0.2,1);
                    transition: color .1s cubic-bezier(0.0,0.0,0.2,1); outline: 0;
                    white-space: nowrap; word-wrap: normal; 
                    text-shadow: 0 0 2px rgba(0,0,0,.5);
                }
                
                .html5-video-player .user-toolbar a:hover {color: #f00;}
                .np_Main .user-toolbar a{
                    line-height: 1.2; max-height: 57.6px; font-weight: 500;margin: 0;color: #fff;
                }
                .np_Main .user-toolbar a:hover{
                    color: var(--npHighlightColour);
                }

                [hidden]{
                    position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                    height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                    display: inline !important;z-index: -1 !important;
                }
            `;
            addstyle(css);
            this.applied = true;

        }

        get src(){
            let src = new URL(doc.location.href);
            src.search = "";
            if (/youtube/.test(src.host)) {
                src.href = src.href.replace('embed/', 'watch?v=');

            } else if (/dailymotion/.test(src.host)) {
                src.href = src.href.replace('embed/', '');
            }
            return src.href;
        }
        get downsub_src(){
            let src = this.src, url = new URL("https://downsub.com/");
            url.searchParams.set('url', src);
            return url.href;
        }

        get elements(){
            if (typeof this._Elements === u) {
                let src = this.src, sub = this.downsub_src, list = new List;
                const
                        elements = this._Elements = {},
                        link = elements.link = html2element(`<a target="_blank" href="${src}">Video Link</a>`),
                        subs = elements.subs = html2element(`<a target="_blank" href="${sub}">Subtitles</a>`);

                list.push(link);
                if (/youtube/.test(this.src)) {
                    let url = new URL(this.src);
                    url.host = url.host.replace('youtube', 'youtube5s');
                    list.push(elements.download = html2element(`<a target="_blank" href="${url.href}">Download</a>`));
                }
                list.push(subs);
                const root = elements.list = list.html;
                this.root.appendChild(root);
                root.classList.add('user-toolbar');
            }
            return this._Elements;
        }

        constructor(container){
            if (!(container instanceof Element)) throw new Error(scriptname, 'Invalid container.');
            this.root = container;
            const list = this.elements.list, video = container.querySelector('video');
            Events(video).on('play pause', e => {
                if (e.type === 'play') list.hidden = true;
                else list.hidden = null;
            });

            ToolBar.style();
        }
    }
    
    NodeFinder.findOne('.np_Main, .html5-video-player, .photon_app', container => {
        let toolbar = new ToolBar(container), player = container.closest('#player'), video = container.querySelector('video');
        if (player instanceof Element) {
            Events(player).on('menu_did_hide menu_did_show dmp_MENU_DID_SHOW dmp_MENU_DID_HIDE', e => {
                if (player.querySelector('.np_MenuSettings') !== null) toolbar.elements.list.hidden = true;
                else if (video.paused === false) toolbar.elements.list.hidden = true;
                else toolbar.elements.list.hidden = null;
            });
        }
    });

})(document);