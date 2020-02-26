// ==UserScript==
// @name         DramaCool2
// @namespace    https://github.com/ngsoft
// @version      2.0
// @description  Dramacool site remaster
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.1/dist/gmutils.min.js
// @noframes
// @grant none
// run-at       document-body
//
// @icon         https://watchasian.to/favicon.png
// @include     /^https?:\/\/(\w+\.)?(dramacool|watchasian)(\w+)?\.\w+\//
// ==/UserScript==


((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */


    /**
     * auto redirect to dramacool.movie
     */
    if (/watchasian/.test(location.host)) {
        let url = new URL(location.href);
        url.host = "dramacool.movie";
        location.replace(url.href);
    }


    


    on.load(() => {
        
        /**
         * Session Store Bookmarks
         */
        const session = new xStore(sessionStorage);
        let username = null;
        
        if (doc.querySelector('.user .account .avatar') !== null) {
            username = doc.querySelector('.user .account .avatar').getAttribute('alt');
        }

        session.loadBookmarks = (callback) => {
            if (doc.querySelector('.user .account') !== null) {

                if (session.get(username) === undef) {
                    const data = [];
                    fetch('/user/bookmark', {cache: "no-store", redirect: 'follow', credentials: 'same-origin'})
                            .then(r => {
                                if (r.status === 200) return r.text();
                                throw new Error("Cannot Fetch /user/bookmark");
                            })
                            .then(text => {
                                return html2doc(text);
                            })
                            .then(page => {
                                return page.querySelectorAll('.bookmark a[href*="drama-detail"]');
                            })
                            .then(list => {
                                list.forEach((a) => {
                                    data.push({
                                        uri: a.href,
                                        title: a.innerText,
                                        slug: /\/([\w\-]+)$/.exec(a.href)[1]
                                    });
                                });
                                return data;
                            })
                            .then((x) => {
                                session.set(username, x);
                                if (typeof callback === "function") return callback;
                            })
                            .then((x) => {
                                x(data);
                            })
                            .catch(ex => console.warn(ex));
                } else if (typeof callback === "function") {
                    callback(session.get(username));
                }


            }

        };

        /**
         * Ongoing right tab
         */
        doc.querySelectorAll('.content-right .tab [data-tab="right-tab-3"]').forEach((x) => {
            x.click();
        });

        /**
         * Set jdtitle for other plugins
         */
        if (/episode\-[0-9]+/.test(doc.location.pathname)) {
            let title = doc.querySelector('.watch-drama .category a').innerText;
            title += ".E";
            let ep = parseInt(/episode\-([0-9]+)/.exec(doc.location.pathname)[1]);
            if (ep < 10) ep = "0" + ep;
            title += ep;
            title += ".mp4";

            doc.querySelectorAll('.anime_muti_link li[data-video]').forEach((x) => {
                try {
                    let uri = x.data('video');
                    if (!(/^http/.test(uri))) uri = doc.location.protocol + uri;
                    const url = new URL(uri);
                    url.searchParams.set('jdtitle', title);
                    x.data('video', url.href);
                } catch (e) {
                    console.error(e);
                }
            });

        }

        /**
         * detects bookmarked dramas
         */
        if (doc.querySelector('.list-episode-item') !== null) {
            session.loadBookmarks((b) => {
                doc.querySelectorAll('.list-episode-item li').forEach((li) => {
                    const a = li.querySelector('a.img'), title=a.querySelector('.title').innerText;
                    b.forEach((x) => {
                        if (x.title === title) li.classList.add('bked');
                    });
                });
                
            });
        }



        /**
         * Redirect to drama, not last episode
         */
        find('.list-episode-item li a', function(node) /* :EventTarget */{

            Events(node).one('touchstart mouseenter', function(e){
                let target = e.target;
                target.data({
                    src: target.href,
                    ready: false
                });
                if (!(/drama\-detail/.test(target.href))) {
                 let addr = target.href;
                    fetch(addr, {cache: "no-store", redirect: 'follow'})
                            .then(r => {
                                if (r.status === 200) return r.text();
                                throw new Error("Cannot Fetch " + addr);
                            })
                            .then(text => {
                                return html2doc(text);
                            })
                            .then(page => {
                                return page.querySelector('.watch-drama .category a');
                            })
                            .then(el => {
                                target.href = el.href;
                                target.data('ready', true);
                            })
                            .catch(ex => console.warn(ex));
                } else target.data('ready', true);

            });

        });

        Events(doc.body).on('mousedown', function(e){
            let target = e.target.closest('.list-episode-item li a');
            if (target !== null) {
                if (e.button === 0) {
                    if (target.data('timer') !== true) {
                        target.data('timer', true);
                        new Timer(function(t){
                        if(target.data('ready') === true){
                                t.stop();
                                location.href = target.href;
                            }
                    });

                    }
                }
            }

        }).on('click', function(e){
            if (e.target.closest('.list-episode-item li a') !== null) {
                e.preventDefault();
            }
        });
        
        /**
         * Clear bookmarks
         */
        doc.querySelectorAll('.details .info .follow, .bookmark .trash').forEach((x) => {
            Events(x).on('click', () => {
                session.remove(username);
            });
        });
        
    });

    /**
     * Creates a button with iframe link on the streaming page
     */

    find('.watch-drama .block-tab .report2', function(r){
        const p = r.parentElement;

        let code = `<div class="plugins2">
                        <ul>
                            <li class="direction">
                                <a href="" data-src="" target="_blank">
                                    Frame Link
                                </a>
                            </li>
                        </ul>
                    </div>`,
                node = html2element(code),
                button = node.querySelector('a');

        p.insertBefore(node, r);
        p.removeChild(r);
        console.debug(button);
        Events(button).on('click', function(e){
            e.preventDefault();
            let ifrm = doc.querySelector('#block-tab-video .watch-iframe iframe');
            if (ifrm !== null) {
                //create and click a link
                let src = getURL(ifrm.src), link = doc.createElement('a');
                link.target = "_blank";
                link.href = src;
                link.style.opacity = 0;
                doc.body.appendChild(link);
                link.click();
                doc.body.removeChild(link);
            }

        });

    });


    /**
     * Adds other site links
     */
    find('.details .info', function(div){
        const container = html2element(`<p><span>Search:</span>&nbsp;</p>`);
        div.appendChild(container);
        let title = div.querySelector('h1').innerText;
        //remove year: title (2020)
        title = title.replace(/\ \(.*$/, "");
        const plugins = {
            'MyDramaList': 'https://mydramalist.com/search',
            'ViKi': 'https://www.viki.com/search',
            'KissAsian': 'https://kissasian.sh/',
            'MediaRSS': 'http://daedelus.us.to/search.html'
        };


        Object.keys(plugins).forEach(function(ptitle){
            let uri = plugins[ptitle];
            let a = html2element(`<a target="_blank">${ptitle}</a>`), link;
            link = new URL(uri);
            link.searchParams.set('q', title);
            a.href = link.href;
            container.append(a);
            container.append(html2element(`;&nbsp;`));
        });

    });


    /**
     * Loads CSS
     * Hides ads, show bookmarked dramas, resize posters
     */
    addstyle(`
        .list-episode-item li{ padding-top: 33%;width: calc(25% - 12px); border: 1px solid #333;}
        li.bked{border: 1px solid #FDB813; }
        .list-episode-item li.bked:after{
            content:""; display:block;border: 16px solid rgba(253, 184, 19, .8);
            position: absolute;top:-4px; left:-4px;z-index: 4;
            border-right-color: transparent;border-bottom-color: transparent;
        }
        .details .info {font-size: 14px;line-height: 1.2;}
        .hidden, .hidden *,
        [class*="ads"]:not(.ads-evt), [class*="ads"]:not(.ads-evt) *,
        [id*="ScriptRoot"], [id*="ScriptRoot"] *,
        .content-right .tab .right-tab-1, .content-right [data-tab="right-tab-1"]
        {
            position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
            height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
            display: inline !important;z-index: -1 !important;
        }
    `);

    console.debug(scriptname, "started");

})(document);