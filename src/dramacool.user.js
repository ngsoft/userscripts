// ==UserScript==
// @name         DramaCool
// @namespace    https://github.com/ngsoft/userscripts
// @version      3.2
// @description  Dramacool site remaster
// @author       daedelus
// @require      https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @noframes
// @grant        none
// @run-at       document-body
// @icon         https://watchasian.to/favicon.png
// @include      /^https?:\/\/(\w+\.)?(dramacool|watchasian)(\w+)?\.\w+\//
// @defaulticon  data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NUEwQzVEQjY4MzM5MTFFMzk1QUM4RjIyNTQ5MTMyMDgiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NUEwQzVEQjU4MzM5MTFFMzk1QUM4RjIyNTQ5MTMyMDgiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpGNjhFREQwMDgyN0MxMUUzOENEM0YzNTgxNzI4RDY5QyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpGNjhFREQwMTgyN0MxMUUzOENEM0YzNTgxNzI4RDY5QyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgRxrmkAAAdUSURBVHjalFZ7cBXlFT/n+769j9x7cxNjDARDhAjChIhGbEGQAA21MFQRBWbsVPuaPoYaKypOxiGtjhNnLJ2xotJiUf/Atlo7HUsxPNIgaKNJSBCKBCIUAgERCCG577u73+nZvUlICNF2Z+dmsrN7Hr/z+/2+g9c3tBKAAJKgJdgIfBFcvnDwXwvlNdS33fzptXSBQA15p/8N7P/l/2wAnXmsptNnAnQCvT0QugjhOPoVWD5K4bA0X30JJ2LajZt1EfN6IZREjyJbbTF/zqksVBHIOoVj9mLpTjGrRZTFwBOgBI4SDofUjqAREhaGGvH2ejlrH970OeRHwW+jRCKkbWG3o8Gm+Pa3iWmvyuVbxVwOwd3QCIjgMkQpjcZfxV2vyWX/xkkJ8HIE4aTkX1JgqxgGOWEP5hBgGCKFdC5EF8r1xxv0vnox71fq4WNYGKT4FR1QfxOxI2LqWln1vphhggpBfCodL6FTBdTNOPdi6BSMUYuMDecgL4Ee/sRD5rXQewu1L9P1C+1/Veq6MrOjyli7G28NUWwERLEdsnK1WnMa8nMhslh/sMKuK6f2IPVxt5m5EPixeFeLJDszUm6CgUuBIQDmUFuNtaFU741hwQ+N2t14mx+SuZchSr0nv7VKPdWLga/pQ09b67+um928XKgc0iUJg8wMZC5q2iCLAcmixB4sv994YatcGqAvXjafmUwnkw6+mSu5X9z6qFrD0Zfau982qzg6QRbXOxh9IAeKUWhCnCYOHq5xh1ySRydq7Rd5aASCtZLGYLV69Au85pt20ytWTTZFOPpQag2n79WuBPqiGEiDJ4XGE2p1pyidbTcs1bti4A9A8k1570dYNpFO/8Z63kcRcOTJumEiaPrqBAhJ9C7UTS9bz9RaL0zWnZ049nn5I37zJ/ZfsiF6Bq97Q9zN3Txs/WkcHenBMbWq6nvGuk3yuxYKHJFDXVk7+O7SjZusaqAUl/YNarnH+O0WMXeVKC/T++dSW5248wgWT6ETK3Qdi+sRVb1FVvgo+a6c122F11ivIPi+pAPUgCv1dnDEFQQIj9efzdd7uyH8d1EBEK/QbaxznvYCag7Q58dw0geiPE9f4oFlU/RdMT/JWnIEOzpEPPeoQwY9aGKMuxfMFjGNTWYCdR2FIi+kZ+r9/C2TzQOm7SADJsggxCX//dIZkAHmq/K+c1iEwNOLvi8XsEpDEDsD16UwzFJPgScLksV0hk2kiE7+2H6HG+rBbD+kq+zNBsVpeMwrZ+AD8yCWLDPWV+imPgztFHekQTE14+CNQRaXzBUwXUOOeXAg9Zi1abb+5CiOn0EHp+jDHABHGXLmOZGjllQX5L8m72Pp+SnFrmKjEo4MbQs8jCEhC54fOHgiyJm6aSY0AhgAXhqhhkw76Lg5QtpxJAd4A1jPsQDFXZdnp8VsiIUgGsGABSoJnh4IQ//phE7bjtBYw3rkKSIGTiu1UDdPp44+DKbQKXPoS+yUE6lLUu9FyMmBSBx8h3GC6/DkENs5DNQlzIlgyH0Sy5gdDYGIuP4WnFpjb1wBdW/JRYewJMYHgVsgDyCF3nm6hRMdFCU3U0cHFu0Rt33HfiuGvn+KeQ1i1gks5LYYtTBEy/Wh+/X2CboTwXAQu7GhMdNnGg3mHMt1id5lgdGJ47qgoAfD5yH3FI59yXo2DL0/ULXL9Y5H1JoAJN42nzyM47sxt0SfLIKzDCnzpxvD7TjxNI6p1B+V6XbGTQ1aK9uqDWKd/P7r4t5b6PBkOsF0jKL/U7xxud6ZT0f/IZftwynrde0sOvAeznld3rPO/KVbm3RvB9Vx1HUzsESMCOYSSBzs4AoxczeW+00Es1i975ireOx3Gxs7YWyrubIVS5cbv+bj8A1r7QK7HiCk3fDD+cOmJOiqbsrM4XM46EgGb9eHNpo1frrwB/lAM5b6IMWzma33PKC39WHgMfX4p2I66xFh5A4iMshf3a65g17MrqDWN80n2DIbReU6+VCWQxhyCaZqrJdm6wPHsfBB47kPxZ0IUTHCJPrzsO+z+3NEvtmomen8pJAuPGuv/6P5eCF1tIo5PzOeYquRDi/75ZlNl35v1szQ7f/BcQ8Ztc+pX5zHPJegCYfV7o6CTH4+J6rrn2ahX8Qwl8aOWAJdc3TbfN0UptM8uq1y8ZNqdR8EGDRz2GZn8C50DgtWq+pt4g7Gh8+fRfrD+bp5EnUyWXlPZLmcxXzei9g7vSayyllgabcE/sWzeMOL6sHNYgk7BG8bNGIvcn3CWYo2yhW/kytPQgFjxzaTQ33ZbgI+Wi5hiBME3a7tAYv2HhM3/E1U/lks7sL8oLPcaRhl8cqsdVzTGSzeLL+9RVQcx+tTjik5TMnceGDHTOFm40OcDWAvTvsEb3LtN6nIGm35HXTJAXdj3NMxzGsTU5nER7H4POSkwCv5o4kNH6P7MRsOC02B9lJKXD6V/o/temD/tV3dGS5FSaHDPEbUMvp5djVO/2+Xe9T4Bqy/f5P7rwADABRZiBwEivyAAAAAAElFTkSuQmCC
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