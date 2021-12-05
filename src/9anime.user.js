// ==UserScript==
// @name         9Anime
// @namespace    https://github.com/ngsoft/userscripts
// @version      3.1
// @description  UI Remaster
// @author       daedelus
// @require      https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @noframes
// @grant        none
// @run-at       document-start
// @icon         https://s2.bunnycdn.ru/assets/9anime/favicons/favicon.png
// @include      /^https?:\/\/(\w+\.)?9anime\.\w+\//
// @defaulticon  data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAC/VBMVEUAAACGH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH72GH71kMEppAAAA/nRSTlMABQgNAv3+7gH51fD8A/vv6vPgBIQP+vb09QcJ98voDhTy38wKHDnr6bMG0uH4C+cTb9QSI+ItzkLI3r0qvhdSJCKA5tfYEX4YDB4V8R9P1pvc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
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