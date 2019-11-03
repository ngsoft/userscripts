// ==UserScript==
// @name         DramaCool 2.0
// @namespace    https://github.com/ngsoft
// @version      1.0
// @description  Dramacool site remaster
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.1/dist/gmutils.min.js
// @noframes
// @grant none
// run-at       document-body
//
// @icon         https://watchasian.to/favicon.png
// @include     /^https?:\/\/(\w+\.)?(dramacool|watchasian)\.\w+\//
//
// ==/UserScript==


((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */


    /**
     * auto redirect to dramacool.video
     */
    if (/watchasian/.test(location.host)) {
        let url = new URL(location.href);
        url.host = "dramacool.video";
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
                                return data
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
         * Redirect do drama, not last episode
         */
        Events(doc.body).on('click', function(e){

            let target = e.target.closest('.list-episode-item li a');
            if (target !== null) {
                if (!(/drama\-detail/.test(target.href))) {
                    e.preventDefault();
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
                                location.href = el.href
                            })
                            .catch(ex => console.warn(ex));
                }
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
     * Loads CSS
     */
    let stylesheet = `
        .list-episode-item li{ padding-top: 33%;width: calc(25% - 12px); border: 1px solid #333;}
        li.bked{border: 1px solid #FDB813; }
        .list-episode-item li.bked:after{
            content:""; display:block;border: 24px solid rgba(253, 184, 19, .8);
            position: absolute;top:0; left:0;z-index: 4;
            border-right-color: transparent;border-bottom-color: transparent;
        }
        .details .info {font-size: 14px;line-height: 1.2;}
    `;

    stylesheet += `
        .hidden, .hidden *,
        [class*="ads"]:not(.ads-evt), [class*="ads"]:not(.ads-evt) *,
        .content-right .tab .right-tab-1, .content-right [data-tab="right-tab-1"]
        {
            position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
            height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
            display: inline !important;z-index: -1 !important;
        }
    `;

    addstyle(stylesheet);

    console.debug(scriptname, "started");

})(document);