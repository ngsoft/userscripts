// ==UserScript==
// @version      0.9.1.a
// @name         CDRAMA VIP Downloader
// @description  FIX Stream + download stream (FFMPEG)
// @namespace    https://github.com/ngsoft
// @author       daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/archives@master/src/gmutils.min.js
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @run-at      document-body
// @noframes
//
// @include     /^https?:\/\/(www\.)?(5nj\.com|zhuijukan\.com|16ys\.net)\//
// @icon        https://www.zhuijukan.com/favicon.ico
// ==/UserScript==


((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */

    const GMinfo = (GM_info ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null));
    const scriptname = `${GMinfo.script.name} version ${GMinfo.script.version}`,
        uuid = GMinfo.script.uuid;

    //week
    const cache = new LSCache(uuid, 604800);

    //clear cache on upgrade
    (() => {
        let last = localStorage.getItem(uuid);
        if (last !== GMinfo.script.version) cache.clear();
        localStorage.setItem(uuid, GMinfo.script.version);
    })();


    /**
     * Loads CSS or JS and save to cache
     * @param {string} url
     * @param {function} callback to be executed after resource is loaded
     * @returns {undefined}
     */
    function loadResource(url, callback) {
        if (typeof url === s && isValidUrl(url)) {
            let a = doc.createElement('a'),
                ext;
            a.href = url;
            let parsed = new URL(a.href);
            if (/\.js$/i.test(parsed.pathname)) ext = "js";
            else if (/\.css$/i.test(parsed.pathname)) ext = "css";
            else return;
            let item = cache.getItem(url);
            if (!item.isHit()) {
                fetch(a.href, {
                    cache: "default",
                    redirect: 'follow'
                }).then(r => {
                    r.text().then(text => {
                        item.set(text);
                        cache.save(item);
                        switch (ext) {
                            case "css":
                                addstyle(item.get());
                                break;
                            default:
                                addscript(item.get());
                        }
                        if (typeof callback === f) callback();
                    });
                }).catch(console.warn);
                return;
            }
            switch (ext) {
                case "css":
                    addstyle(item.get());
                    break;
                default:
                    addscript(item.get());
            }
            if (typeof callback === f) callback();
        }
    }


    class ToolBar {

        get src() {
            return this.player.src;
        }

        get title() {
            return this.player.videotitle + ".mp4";
        }

        get jdlink() {
            let url = new URL(this.src);
            url.searchParams.set('jdtitle', this.title);
            return url.href;
        }

        get ffmpeg() {
            let cmd = "echo " + this.title + "\n";
            cmd += `ffmpeg ${this.player.settings.get('ffmpeg')} "${this.src}" -c copy "${this.title}"`;
            cmd += "\n";
            return cmd;
        }


        constructor(videoplayer) {
            const self = this;
            Object.assign(this, {
                player: videoplayer,
                video: videoplayer.video,
                target: videoplayer.video.parentElement,
                elements: {
                    toolbar: html2element('<div class="altvideo-toolbar" />'),
                    buttons: {
                        settings: html2element(`<a href="" class="settings-bt left"><span class="settings-icn"><svg class= "square" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" ><path fill="currentColor" d="M30.662 5.003c-4.488-0.645-9.448-1.003-14.662-1.003s-10.174 0.358-14.662 1.003c-0.86 3.366-1.338 7.086-1.338 10.997s0.477 7.63 1.338 10.997c4.489 0.645 9.448 1.003 14.662 1.003s10.174-0.358 14.662-1.003c0.86-3.366 1.338-7.086 1.338-10.997s-0.477-7.63-1.338-10.997zM12 22v-12l10 6-10 6z"></path></svg></span><span class="bt-desc">Settings</span></a>`),
                        clip: html2element(`<a href="#" class="clipboard-bt right" title="Copy to Clipboard"><span class="bt-desc">Copy to Clipboard</span><span class="clipboard-icn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M433.941 193.941l-51.882-51.882A48 48 0 0 0 348.118 128H320V80c0-26.51-21.49-48-48-48h-61.414C201.582 13.098 182.294 0 160 0s-41.582 13.098-50.586 32H48C21.49 32 0 53.49 0 80v288c0 26.51 21.49 48 48 48h80v48c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48V227.882a48 48 0 0 0-14.059-33.941zm-84.066-16.184l48.368 48.368a6 6 0 0 1 1.757 4.243V240h-64v-64h9.632a6 6 0 0 1 4.243 1.757zM160 38c9.941 0 18 8.059 18 18s-8.059 18-18 18-18-8.059-18-18 8.059-18 18-18zm-32 138v192H54a6 6 0 0 1-6-6V86a6 6 0 0 1 6-6h55.414c9.004 18.902 28.292 32 50.586 32s41.582-13.098 50.586-32H266a6 6 0 0 1 6 6v42h-96c-26.51 0-48 21.49-48 48zm266 288H182a6 6 0 0 1-6-6V182a6 6 0 0 1 6-6h106v88c0 13.255 10.745 24 24 24h88v170a6 6 0 0 1-6 6z"></path></svg></span></a>`),
                        code: html2element(`<a href="" class="code-bt right" title="Get FFMPEG Command"><span class="bt-desc">Get FFMPEG command.</span><span class="code-icn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M234.8 511.7L196 500.4c-4.2-1.2-6.7-5.7-5.5-9.9L331.3 5.8c1.2-4.2 5.7-6.7 9.9-5.5L380 11.6c4.2 1.2 6.7 5.7 5.5 9.9L244.7 506.2c-1.2 4.3-5.6 6.7-9.9 5.5zm-83.2-121.1l27.2-29c3.1-3.3 2.8-8.5-.5-11.5L72.2 256l106.1-94.1c3.4-3 3.6-8.2.5-11.5l-27.2-29c-3-3.2-8.1-3.4-11.3-.4L2.5 250.2c-3.4 3.2-3.4 8.5 0 11.7L140.3 391c3.2 3 8.2 2.8 11.3-.4zm284.1.4l137.7-129.1c3.4-3.2 3.4-8.5 0-11.7L435.7 121c-3.2-3-8.3-2.9-11.3.4l-27.2 29c-3.1 3.3-2.8 8.5.5 11.5L503.8 256l-106.1 94.1c-3.4 3-3.6 8.2-.5 11.5l27.2 29c3.1 3.2 8.1 3.4 11.3.4z"></path></svg></span></a>`),
                        title: html2element(`<a href="" class="title-bt center" target="_blank" title="Play"></a>`)
                    }
                }
            });


            const evts = {
                settings(e) {
                    alert("To be continued...");
                },
                clip(e) {
                    if (copyToClipboard(self.jdlink)) {
                        videoplayer.notify("Link copied to clipboard");
                    }
                },
                code(e) {
                    if (copyToClipboard(self.ffmpeg)) {
                        videoplayer.notify("Command copied to clipboard");
                    }
                },
                title(e) {
                    self.video.play();
                }
            };

            new Events(self.elements.toolbar, self);
            self.target.insertBefore(self.elements.toolbar, self.target.firstChild);
            self.elements.toolbar.appendChild(self.elements.buttons.settings);
            self.elements.toolbar.appendChild(self.elements.buttons.title);
            self.elements.toolbar.appendChild(self.elements.buttons.code);
            self.elements.toolbar.appendChild(self.elements.buttons.clip);

            self.elements.buttons.title.appendChild(document.createTextNode(self.title));

            videoplayer.on("play pause", (e) => {
                if (e.type === "play") self.elements.toolbar.classList.add("hidden");
                else self.elements.toolbar.classList.remove("hidden");
            });

            self.on('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                let target = e.target.closest('a[class*="-bt"]');
                if (target instanceof HTMLElement) {
                    Object.keys(self.elements.buttons).forEach((btn) => {
                        if (target === self.elements.buttons[btn] && typeof evts[btn] === f) evts[btn].call(self, e);

                    });
                }
            });


        }

    }


    class AltVideoPlayer {

        get videotitle() {
            let num = this.number,
                title = this.title;
            if (typeof title === s) {
                if (typeof num === n && num > 0) title += ".E" + num;
                return title;
            }

        }

        get title() {
            return this.__title__;
        }

        set title(title) {
            if (typeof title === s) this.__title__ = title;
            this.start();
        }

        get isHls() {
            let src = this.src || "";
            return /\.m3u8/.test(src);
        }


        get src() {
            return this.__src__;
        }

        set src(src) {
            if (isValidUrl(src)) {
                const self = this;
                let uri = getURL(src), url = new URL(uri), regex = /#EXT-X-STREAM-INF.*\n([^#].*)/, matches;
                url.protocol = location.protocol;
                if(/\.m3u8/.test(url.pathname)){
                    let cors = "https://cors-anywhere.herokuapp.com/" + url.href;
                    fetch(cors, {cache: "default", redirect: 'follow'})
                            .then(r => {
                                r.text().then(text => {
                                    if ((matches = regex.exec(text))) {
                                        let uri = matches[1].trim();
                                        if (/^\//.test(uri)) {
                                            url.pathname = uri;
                                        } else url.pathname = url.pathname.replace(/([\w\.\-]+)$/, uri);
                                    }
                                    self.__src__ = url.href;
                                    self.start();

                                });
                            })
                            .catch(ex => {
                                console.error(ex);
                                self.__src__ = url.href;
                                self.start();
                            });
                } else {
                    self.__src__ = url.href;
                    self.start();
                }


            }
        }

        get number() {
            return this.__number__;
        }

        set number(num) {
            if (typeof num === n) this.__number__ = num;
            this.start();
        }

        onReady(callback) {
            if (typeof callback !== f) return;
            const self = this;
            if (self.__started__ !== true) {
                self.one("altvideoplayer.ready", (e) => {
                    callback.call(self, self);
                });

            } else callback.call(self, self);
        }

        playpause() {
            if (this.video.paused === true) return this.video.play();
            this.video.pause();
        }

        notify(message, timeout) {
            timeout = typeof timeout === n ? timeout : 2000;
            if (typeof message === s) {
                let notification = doc.createElement('div');
                message = html2element(`<span class="altvideo-notifier-message">${message}</span>`);
                notification.appendChild(message);
                notification.hidden = true;
                notification.classList.add('fadeInRight');
                this.elements.notifier.insertBefore(notification, this.elements.notifier.firstChild);
                notification.hidden = null;

                setTimeout(() => {
                    this.elements.notifier.removeChild(notification);
                }, timeout);

            }
        }

        resize() {
            this.video.style.height = this.plyr.elements.container.clientHeight + "px";
        }


        start() {
            if (!this.__started__) {
                if (this.title !== null && this.src !== null && this.number !== null) {
                    const self = this;
                    AltVideoPlayer.loadDeps(x => {
                        self.elements.root.appendChild(self.video);

                        self.target.insertBefore(self.elements.root, self.target.firstChild);
                        self.video.data("src", self.src);

                        self.plyr = new Plyr(self.video, self.plyropts);

                        self.plyr.on('ready', e => {

                            self.plyr.elements.container.insertBefore(self.elements.bigplay, self.plyr.elements.container.firstChild);
                            self.plyr.elements.container.insertBefore(self.elements.notifier, self.plyr.elements.container.firstChild);
                            Events(self.elements.bigplay).on('click', e => self.video.play());
                            self.one('play', e => self.elements.bigplay.hidden = true);
                            self.on('click', e => self.playpause());

                            let hls = self.hls = new Hls();
                            hls.on(Hls.Events.MANIFEST_PARSED, (e, data) => {
                                self.resize();
                                if (self.settings.get('autoplay') === true) self.video.play();
                            });
                            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                                hls.loadSource(self.src);
                            });
                            addEventListener("resize", () => {
                                self.resize();
                            });
                            self.on("play", () => {
                                self.resize();
                            });

                            hls.attachMedia(self.video);
                            new ToolBar(self);
                            self.__started__ = true;
                            self.trigger("altvideoplayer.ready");
                            console.debug(scriptname, " Started.");
                        });

                    });
                }
            }
        }

        constructor(target) {
            if ((!(target instanceof HTMLElement))) throw new Error("Not an Element");
            const self = this;
            Object.assign(this, {
                __started__: false,
                __title__: null,
                __number__: null,
                __src__: null,
                elements: {
                    root: html2element('<div class="altvideo-container" id="altvideo" />'),
                    notifier: html2element(`<div class="altvideo-notifier" />`),
                    bigplay: html2element(`<span class="bigplay-button no-focus" tabindex="-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="bigplay-icn"><path fill="currentColor" d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"></path></svg></span>`)
                },
                video: html2element('<video preload="none" controls tabindex="-1" src="" class="altvideo" data-src="" />'),
                target: target,
                hls: null,
                plyr: null,
                plyropts: {
                    captions: {active: true, language: 'auto', update: true},
                    settings: ['captions', 'quality'],
                    keyboard: {focused: true, global: true}
                },
                settings: new UserSettings({
                    autoplay: false,
                    translations: {},
                    ffmpeg: "-v quiet -stats -y -i"
                })
            });
            new Events(this.video, this);


        }




        static loadDeps(onload) {
            const self = this;
            if (self.loaded !== true) {

                loadResource("https://cdn.jsdelivr.net/npm/plyr@latest/dist/plyr.css", () => {
                    self.loadStyles();
                });
                [
                    "https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js",
                    "https://cdn.jsdelivr.net/npm/plyr@latest/dist/plyr.min.js"
                ].forEach(loadResource);
                let t = new Timer((timer) => {
                    if (typeof Hls === f && typeof Plyr === f) {
                        timer.stop();
                        self.loaded = true;
                        if (typeof onload === f) {
                            onload();
                        }
                    }
                });
            } else if (typeof onload === f) {
                onload();
            }
        }

        static loadStyles() {
            if (this.styles !== true) {
                this.styles = true;

                let css = `
                    .altvideo-container{height:100%;width: 100%;position: relative; overflow: hidden;}
                    .altvideo{width: 100%; height:100%; object-fit: fill; display: block;}
                    .plyr{height: 100%;width:100%;position: absolute;}
                    .plyr > .plyr__control--overlaid{display: none !important;}
                    [class*="-icn"] svg{width:87.5%;height:100%;}
                    [class*="-icn"] svg.square{width:87.5%;height:87.5%;}
                    [class*="-icn"] img {width:100%;height:100%;}
                    .altvideo-container [class*="-button"]{
                        background-color: transparent;border: none; display: inline-block;color:#fff;
                        width:32px;z-index: 10; cursor: pointer;border-radius: 3px;flex-shrink: 0;padding: 7px;transition: all .3s ease;
                    }
                    .altvideo-container [class*="-button"] svg{pointer-events: none;}
                    .altvideo-container [class*="-button"]:not(.no-focus):focus, .altplayer-container [class*="-button"]:not(.no-focus):hover{
                        box-shadow: 0 0 0 5px rgba(26,175,255,.5);background: #1aafff;outline: 0;
                    }
                    .altvideo-container .bigplay-button{
                        position: absolute; top: 50%; left:50%; transform: translate(-50%, -50%);width: 128px;
                        color: rgba(255,255,255,0.8);
                    }
                    .altvideo-container .bigplay-button:focus, .altplayer:hover span.bigplay-button{
                        color: rgba(255,255,255,1);
                    }
                `;

                css += `
                    .altvideo-toolbar {position: absolute; top: 0 ; left: 0 ; right: 0; text-align: center; padding: 16px 8px;z-index: 9999; text-align: center;}
                    .altvideo-toolbar [class*="-icn"]{vertical-align: middle; display: inline-block; width: 24px; height: 24px; margin:0 8px; line-height:0;}
                    .altvideo-toolbar .left{float:left;}
                    .altvideo-toolbar .right{float: right;}
                    .altvideo-toolbar .center{position: absolute;left: 50%;top: 16px;transform: translate(-50%);}
                    .altvideo-toolbar, .altvideo-toolbar a, .altvideo-notifier {font-family: Arial,Helvetica,sans-serif; font-size: 16px; color:#FFF;line-height: 1.5;}
                    .altvideo-toolbar {background-color: rgba(0, 0, 0, 0.45);}
                    .altvideo-toolbar a {text-decoration: none; padding: 0 8px;}
                    .altvideo-toolbar a:hover {filter: drop-shadow(4px 4px 4px #fff);}
                    [disabled], .disabled, .altvideo-toolbar svg{pointer-events: none;}
                `;
                css += `
                    .altvideo-notifier {position: absolute; right: 32px; top: 40%; text-align: right;z-index: 9999;}
                    .altvideo-notifier > div{
                        display: block; text-align:center;padding:16px; border-radius: 4px; margin: 8px 0;
                        min-width:256px;max-width:512px;
                        color:rgb(0,0,0);background-color: rgba(255, 255, 255, .8);font-weight: bold;position: relative;
                    }
                    @keyframes fadeInRight {
                        0% {opacity: 0;-webkit-transform: translate3d(100%, 0, 0);transform: translate3d(100%, 0, 0);}
                        100% {opacity: 1;-webkit-transform: none;transform: none;}
                    }
                    .fadeInRight {animation-name: fadeInRight;animation-duration: .5s;animation-fill-mode: both;}
                `;


                css += `#cms_player .altvideo-container{
                       height: 675px;
                }`;

                css += `
                        .hidden, .hidden *, [id*="jm_"],
                        .altvideo-toolbar [class*="-bt"]:not(:hover) .bt-desc
                        {
                            position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
                            height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
                            display: inline !important;z-index: -1 !important;
                        }
                `;

                addstyle(css);
            }
        }



    }


    let app;
    if (/zhuijukan/.test(location.host) && /^\/vplay\//.test(location.pathname)) {


        find('#cms_player iframe.embed-responsive-item:not([id])', (el, obs) => {
            let url = new URL(el.src), sp = new URLSearchParams(url.search), src = sp.get("url"), frame = el;
            if(src === null) return ;
            if (!(app instanceof AltVideoPlayer)) app = new AltVideoPlayer(el.parentElement);
            app.onReady(() => {
                el.remove();
            });
            //
            find('.play .container h2.text-nowrap > small', (el) => {
                let matches, num = 0;
                if ((matches = /第([0-9]+)/.exec(el.innerText))) num = parseInt(matches[1]);
                app.number = num;
                app.title = el.previousSibling.previousSibling.innerText;
                if ((/\.m3u8/.test(src))) app.src = src;
                else {
                    url.searchParams.set("jdtitle", app.videotitle + ".mp4");
                    frame.src = url.href;
                }
            });
        });

    } else if (/16ys/.test(location.host) && /player\-/.test(location.pathname) && typeof now === s) {

        find('.player > iframe', (frame)=>{
            if (!(app instanceof AltVideoPlayer)) app = new AltVideoPlayer(frame.parentElement);
            app.onReady(() => {
                frame.remove();
            });
             find('body > .wrap.textlink a:last-of-type', (el) => {

                app.title = el.innerText;
                let num = 0, txt, matches;
                if (el.nextSibling && (txt = el.nextSibling.nodeValue)) {
                    if ((matches = /第([0-9]+)/.exec(txt))) num = parseInt(matches[1]);
                }
                app.number = num;
                if ((/\.m3u8/.test(now))) app.src = now;
            });

        });
    } else if (/5nj/.test(location.host) && /m=vod-play-id.*src.*num/.test(location.search)) {

        find('#playleft iframe[src*="/m3u8/"]', (frame) => {
            if (!(app instanceof AltVideoPlayer)) app = new AltVideoPlayer(frame.parentElement);
            app.onReady(() => {
                frame.remove();
            });
            let url = new URL(frame.src), sp = new URLSearchParams(url.search), src = sp.get('id');
            if(src === null) return;
            app.title = mac_name;
            find('.videourl li.selected a', (el) => {
                let num = 0, matches;
                if ((matches = /第([0-9]+)/.exec(el.title))) num = parseInt(matches[1]);
                app.number = num;
                app.src = src;
            });
        });

    }

    //unified search module
    if (location.search.length > 0) {
        let sp = new URLSearchParams(location.search), q = sp.get('q');
        if (typeof q === s) {
            if (/zhuijukan/.test(location.host)) {
                find('form.ff-search', (form) => {
                    let input = form.querySelector('input[name="wd"]'), btn = form.querySelector("button.search-button");
                    input.value = q;
                    btn.click();
                });


            } else if (/16ys/.test(location.host)) {
                find('#formsearch', (form) => {
                    form.target = "";
                    let input = form.querySelector("#keyword"), btn = form.querySelector("#searchbutton");
                    input.value = q;
                    btn.click();
                });

            } else if (/5nj/.test(location.host)) {
                find('ul.search form', (form) => {
                    let input = form.querySelector('input[name="wd"]'), btn = form.querySelector('input[type="submit"]');
                    input.value = q;
                    btn.click();
                });
            }
        }

    }




})(document);