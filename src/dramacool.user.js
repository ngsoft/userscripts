// ==UserScript==
// @name         DramaCool
// @namespace    https://github.com/ngsoft/userscripts
// @version      3.2
// @description  Dramacool site remaster
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @noframes
// @grant none
// @run-at       document-body
//
// @icon         https://watchasian.to/favicon.png
// @include     /^https?:\/\/(\w+\.)?(dramacool|watchasian)(\w+)?\.\w+\//
// ==/UserScript==


((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    if (/watchasian/.test(location.host)) {
        let url = new URL(location.href);
        url.host = "dramacool.so";
        location.replace(url.href);
    }


    class Dramacool extends xStore {


        constructor(){
            super(sessionStorage);
            if (this.username !== null) {
                doc.querySelectorAll('.details .info .follow, .bookmark .trash').forEach(x => {
                    Events(x).on('click', () => {
                        this.remove(this.username + "_bookmarks");
                    });
                });
            }
        }
        get username(){
            let username = null;
            if (doc.querySelector('.user .account .avatar') !== null) {
                username = doc.querySelector('.user .account .avatar').getAttribute('alt');
            }
            return username;
        }

        getPage(pathname){
            return new Promise((resolve, reject) => {
                if (typeof pathname !== s || !(/^\//.test(pathname))) return reject();
                fetch(pathname, {cache: "no-store", redirect: 'follow', credentials: 'same-origin'})
                        .then(r => {
                            if (r.status === 200) return r.text();
                            throw new Error("Cannot Fetch /user/bookmark");
                        })
                        .then(text => {
                            resolve(html2doc(text));
                        })
                        .catch(() => {
                            reject();
                        });
            });
        }


        bookmarks(){
            return new Promise(resolve => {

                if (this.username === null) return;

                let key = this.username + "_bookmarks", data = this.get(key);
                if (data === undef) {
                    data = [];
                    this
                            .getPage('/user/bookmark')
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
                                this.set(key, data);
                                resolve(data);
                            })
                            .catch(x => x);
                } else resolve(data);
            });
        }
        getDrama(episode){
            return new Promise((resolve, reject) => {
                let data = this.get('dramas') || {}, link = data[episode];
                if (typeof link === s) {
                    resolve(link);

                } else {
                    this
                            .getPage(episode)
                            .then(page => page.querySelector('.watch-drama .category a'))
                            .then(a => {
                                data[episode] = a.href;
                                this.set('dramas', data);
                                resolve(a.href);
                            })
                            .catch(() => {
                                reject();
                            });
                }
            });


        }


    }

    const dc = new Dramacool();


    on.load().then(() => {

        /**
         * detects bookmarked dramas
         */
        if (doc.querySelector('.list-episode-item') !== null && dc.username !== null) {
            dc.bookmarks().then(data => {
                doc.querySelectorAll('.list-episode-item li').forEach(li => {
                    let a = li.querySelector('a.img'), title = a.querySelector('.title').innerText;
                    data.forEach(entry => {
                        if (entry.title === title) li.classList.add('bked');
                    });
                });
            });
        }


        /**
         * Redirect to drama, not last episode
         */
        NodeFinder.find('[class*="list-episode-item"]:not(.all-episode) li a', node => {

            Events(node)
                    .one('touchstart mouseenter', e => {
                        let target = e.target;
                        if (!(/drama\-detail/.test(target.href))) {
                            if (target.data('ready') !== undef) return;
                            target.data({
                                src: target.href,
                                ready: false
                            });
                            let url = new URL(target.href), addr = url.pathname;
                            target.querySelectorAll('h3').forEach(h3 => {
                                h3.onclick = function(){ };
                            });
                            dc
                                    .getDrama(addr)
                                    .then(uri => {
                                        target.href = uri;
                                        target.data('ready', true);
                                    })
                                    .catch(x => x);
                        } else target.data('ready', true);

                    })
                    .on('mousedown', e => {
                        let target = e.target.closest('[class*="list-episode-item"] li a');
                        if (target !== null) {
                            if (e.button === 0) {
                                if (target.data('timer') !== true) {
                                    target.data('timer', true);
                                    new Timer(timer => {
                                        if (target.data('ready') === true) {
                                            timer.stop();
                                            location.href = target.href;
                                        }
                                    });

                                }
                            }
                        }

                    })
                    .on('click', e => {
                        e.preventDefault();
                    });
        });


        /**
         * Ongoing right tab
         */
        doc.querySelectorAll('.content-right .tab [data-tab="right-tab-3"]').forEach(x => x.click());
        /**
         * Set jdtitle for other plugins
         */
        if (/episode\-[0-9]+/.test(location.pathname)) {
            let title = doc.querySelector('.watch-drama .category a').innerText;
            title += ".E";
            let ep = parseInt(/episode\-([0-9]+)/.exec(doc.location.pathname)[1]);
            if (ep < 10) ep = "0" + ep;
            title += ep;
            title += ".mp4";
            doc.querySelectorAll('.anime_muti_link li[data-video]').forEach(x => {
                try {
                    let uri = x.data('video');
                    if (!(/^http/.test(uri))) uri = location.protocol + uri;
                    const url = new URL(uri);
                    url.searchParams.set('jdtitle', title);
                    x.data('video', url.href);
                } catch (e) {
                }
            });
        }

        /**
         * Reverse Episode List
         */
        NodeFinder.find('body ul.all-episode', ul => {

            const list = Array.from(ul.querySelectorAll('li')).map((li) => {
                li.remove();
                return li;
            }).reverse();
            list.forEach((li) => {
                ul.appendChild(li);
            });
        });

        /**
         * Creates a button with iframe link on the streaming page
         */

        NodeFinder.findOne('.watch-drama .block-tab .report2', r => {
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
        NodeFinder.findOne('.details .info', div => {
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
        .all-episode li a:visited h3 {color: #FDB813;}
        .hidden, .hidden *,
        [class*="ads"]:not(.ads-evt), [class*="ads"]:not(.ads-evt) *,
        [id*="ScriptRoot"], [id*="ScriptRoot"] *,
        .content-right .tab .right-tab-1, .content-right [data-tab="right-tab-1"],
        iframe[style*="z-index: 21474"], [style*="position:fixed"], .float-ck, .float-ck *, [style*="width:100%;max-height:250px;"],
        [id*="_ads_"], [id*="_ads_"] *
        {
            position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
            height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
            display: inline !important;z-index: -1 !important;
        }
    `);



})(document);