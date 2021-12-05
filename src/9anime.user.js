// ==UserScript==
// @name         9Anime
// @namespace    https://github.com/ngsoft/userscripts
// @version      3.1
// @description  UI Remaster
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @noframes
// @grant none
// @run-at       document-start
//
// @icon        https://s2.bunnycdn.ru/assets/9anime/favicons/favicon.png
// @include     /^https?:\/\/(\w+\.)?9anime\.\w+\//
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    class Toast {

        static notify(message, timeout){
            return new Promise(resolve=>{
                if (typeof message === "string") {
                    (new gmStyles());
                    let
                            root = this.root,
                            notification = html2element('<div style="min-width: 392px; text-align: center;" class="fadeIn" hidden/>');
                    notification.innerHTML = message;
                    root.appendChild(notification);
                    notification.hidden = null;
                    timeout = typeof timeout === n ? timeout : 1000;
                    setTimeout(() => {
                        notification.classList.remove('fadeIn');
                        setTimeout(function(){
                            notification.classList.add('fadeOut');
                            setTimeout(() => {
                                resolve(notification);
                                root.removeChild(notification);
                                if (root.classList.contains('tmp')) root.remove();
                            }, 750);
                        }, timeout);
                    }, 750);
                }
            });

        }

        static get root(){
            let root = doc.querySelector('#toast-wrapper');
            if (root === null) {
                root = html2element('<div id="toast-wrapper" class="tmp"/>');
                doc.body.appendChild(root);
            }
            return root;
        }

    }

    class Episode {

        get number(){
            let number = 0;
            let epn = this.root.querySelector('#episodes .episodes a.active');
            if (epn !== null) {
                if (/^\d+$/.test(epn.innerText.trim())) ;
                number = parseInt(epn.innerText.trim());
            }
            return number;

        }

        get title(){
            let title = "", sel;
            if ((sel = this.root.querySelector('.navbc h2[data-jtitle]')) !== null) {
                title = sel.data('jtitle');
                if (typeof title !== s || title.length === 0) title = sel.innerText.trim();
            }
            title = title.replace(' (Dub)', '');
            return title;
        }

        get filename(){

            let filename = this.title, number = this.number;
            if(filename.length >0){
                if (number > 0) {
                    filename += ".E";
                    if (number < 10) filename += "0";
                    filename += number;
                }
                filename += ".mp4";
            }

            return filename;
        }
        get normalized_title(){
            let title = "", sel;
            if ((sel = this.root.querySelector('.navbc h2[data-jtitle]')) !== null) {
                title = sel.innerText.trim();
            }
            title = title.replace(' (Dub)', '');
            return title;
        }
        get normalized_filename(){

            let filename = this.normalized_title, number = this.number;
            if (filename.length > 0) {
                if (number > 0) {
                    filename += ".E";
                    if (number < 10) filename += "0";
                    filename += number;
                }
                filename += ".mp4";
            }

            return filename;
        }

        constructor(root){
            this.root = root || doc.body;
        }
    }



    on.load().then(() => {
        //waf-verify
        if (doc.querySelector('form[action*="/waf-verify"]') !== null) {
            return;
        }

        const
                listeners = new Events(doc.body),
                ep = new Episode();
                
        listeners.on('vidloaded', e => {
            
            let
                    url = new URL(e.data.iframe.src),
                    title = ep.filename, ntitle = ep.normalized_filename, first = true,
                    link = html2element(`<a class="report user-extlink" target="_blank" href="${url.href}"><i class="fas fa-external-link-alt"></i><span> Video Link</span></a>`),
                    clip, nclip;

            if (title.length > 0) {
                url.searchParams.set('jdtitle', title);
                clip = html2element(`<a class="report user-clipboard" href="${url.href}"><i class="far fa-clipboard"></i><span> Copy Link</span></a>`);
            }
            if (ntitle.length > 0) {
                url.searchParams.set('jdtitle', ntitle);
                nclip = html2element(`<a class="report user-clipboard" href="${url.href}"><i class="far fa-clipboard"></i><span> Copy Link (normalized)</span></a>`);
            }


            doc.querySelectorAll('#controls .report').forEach(node => {
                if (first === true) {
                    first = false;
                    node.parentElement.insertBefore(link, node);
                    if (clip instanceof Element) node.parentElement.insertBefore(clip, node);
                    if (nclip instanceof Element) node.parentElement.insertBefore(nclip, node);

                }
                node.remove();

            });
        });

        listeners.on('click', e => {
            let target;
            if ((target = e.target.closest('.user-clipboard')) instanceof Element) {
                e.preventDefault();
                if (copyToClipboard(target.href)) {
                    Toast.notify("Link Copied to Clipboard.");
                }
                return;
            }
        });
        
        let player;
        if ((player = doc.querySelector('#player')) !== null) {
            NodeFinder(player).find('iframe', iframe => {
                if (/streamtape/.test(iframe.src)) {
                    const url = new URL(iframe.src);
                    url.searchParams.set('jdtitle', ep.normalized_filename);
                    iframe.src = url.href;
                }
                Events(player).trigger('vidloaded', {iframe: iframe, player: player});
            });
        }
        


        //setting main page tab to subbed
        NodeFinder.findOne('.main .tabs > span[data-name="updated_sub"]', node => node.click());
        //remove overlays
        let overlays=[
            'div[style*="position: fixed"]',
            'div[style*="z-index: 2147483647;"]',
            'div[style*="z-index"][style*="position"]'
        ];
        NodeFinder.find(overlays.join(', '), x => {
            x.classList.add('hidden');
            x.remove();
        });
        
        addstyle(`
            .player-wrapper #controls > a { padding: 0 8px; display: inline-block; cursor: pointer;
                color: #ababab; height: 38px; line-height: 38px; -webkit-transition: all .15s;
                -moz-transition: all .15s; transition: all .15s; }
            .player-wrapper #controls > a:hover { background: #141414; color: #eee; }
            .report{float: right;}


            [hidden], [hidden] *, .hidden, .hidden *,
            section.sda, section.sda *, [style*="position: fixed;"], [style*="position: fixed;"] *,
            :not(#player) > iframe:not([title="recaptcha challenge"])

            {
                position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                display: inline !important;z-index: -1 !important;
            }
        `);

    });



})(document);