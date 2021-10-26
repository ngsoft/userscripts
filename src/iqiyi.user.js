// ==UserScript==
// @version     1.3
// @name        iQiyi
// @description Video Player modificatons
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @require     https://cdn.jsdelivr.net/npm/subtitle@latest/dist/subtitle.bundle.min.js
// @grant       none
// @noframes
//
// @include     /^https?:\/\/(www\.)?iq.com\/play\//
// @icon        https://www.iqiyipic.com/common/images/logo.ico
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */
    




    class MDLSearch {
        static applyStyle(){
            if (this.style === true) return;
            this.style = true;
            addstyle(`
                .mdl-search {
                    padding: 0px;margin: 0;display: inline-block;color: rgb(255, 255, 255);
                    border-radius: 2px;float: left;width: 32px;height: 32px;background-color: rgba(0, 0, 0, 0.3);
                    box-sizing: border-box;position: absolute;cursor:pointer;top: 12px; left: 28px;
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



        constructor(root, title){
            MDLSearch.applyStyle();
            Object.assign(this, {
                title: title,
                btn: html2element('<a class="mdl-search" title="MyDramaList Search" href="#"><img src="https://mydramalist.com/favicon.ico" /></a>')
            });
            const self = this;
            root.appendChild(self.btn);

            Events(self.btn).on('click', (e) => {
                e.preventDefault();
                self.search(self.title);

            });

        }

    }



    class SubtitleDownloader {

        get video(){
            return doc.querySelector('video[src]');
        }

        get drama(){

            let el = doc.querySelector('h1.intl-play-title');
            if (el instanceof Element) {
                return sanitizeFileName(el.innerText.trim(), " ");
            }
            return null;

        }

        get episode(){
            let el = doc.querySelector('ul.intl-episodes-list li.selected > span.drama-item');
            if (el instanceof Element) {
                let num = el.innerText.trim(), matches;
                if (/^[0-9]+$/.test(num)) {
                    num = parseInt(num);
                    if (num < 10) num = "0" + num;
                    return `.E${num}`;
                }
            }
            return "";
        }

        get src(){
            let data;

            try {
                data = QiyiPlayerLoaderIbd.manager.players.flashbox.package.engine.pingback._core.movieinfo.current.subtitlesUrlMap;
            } catch (e) {
                console.error(e);
            }

            if (typeof data !== u) {
                let origin = location.protocol + data.prefix, pathname;

                data.list.forEach(item => {
                    if (/English/i.test(item._name)) pathname = item.srt;
                });

                if (typeof pathname === s) return origin + pathname;
            }
            return null;
        }

        get filename(){
            let filename = this.drama;
            if ((typeof this.drama === s) && (typeof this.episode === s)) {
                filename += this.episode;
                filename += ".en.srt";
            }
            return filename;
        }


        getsubs(src, filename){
            if ((typeof src === s) && (typeof filename === s)) {
                const self = this;
                fetch(src, {cache: "no-store", redirect: 'follow'})
                        .then(r => {
                            if (r.status === 200) return r.text();
                            throw new Error("Cannot Fetch " + src);
                        })
                        .then(text => {
                            return self.convert(text) || "";
                        })
                        .then(text => {
                            if ((typeof text === s) && (text.length > 0)) Text2File(text, filename);
                        })
                        .catch(ex => console.warn(ex));
            } else throw new Error("Cannot download subtitles");
        }



        convert(text){
            if (typeof text === s) return Subtitle.stringify(Subtitle.parse(text));
            return null;
        }


        constructor(nextelement){

            if (!(nextelement instanceof Element) || nextelement.parentElement === null) throw new Error("Invalid Control.");

            const btn = html2element(`<iqpdiv class="iqp-btn iqp-btn-srt"><iqp class="iqp-label">SRT</iqp></iqpdiv>`);

            this.btn = btn;
            
            Events(btn).on("click", (e) => {
                e.preventDefault();

                if ((this.filename !== null) && (this.src !== null)) {
                    this.getsubs(this.src, this.filename);
                }
            });


            Events(this.video).on('play pause', e => {
                btn.hidden = null;
                if (this.src === null) {
                    btn.hidden = true;
                }
            });



            
            nextelement.parentElement.insertBefore(btn, nextelement.nextElementSibling);

        }
    }





    class QiyiCustomPlayer{
        
        static setVideoSize(video){

            if (video === undef) video = doc.querySelector('video');

            if (video instanceof Element) {
                let width = video.offsetWidth, player = video.closest('.iqp-player');
                player.classList.remove('video-m', 'video-l', 'video-xl', 'video-s', 'video-xs');
                if (width > 1800) player.classList.add('video-xl');
                else if (width > 1100) player.classList.add('video-l');
                else if (width > 900) player.classList.add('video-m');
                else if (width > 750) player.classList.add('video-s');
                else player.classList.add('video-xs');
                console.debug(width, video);
            }
        }

        static applyStyle(){
            if (this.ready !== true) {
                this.ready = true;
                addstyle(`
                    video{object-fit: cover;}
                    .iqp-logo-box{display: none;}
                    .iqp-subtitle{
                        bottom: 10% !important; text-shadow: 5px 5px 5px #000 !important;
                        min-width: 60% !important; padding: 2% 0 !important;
                        text-align: center !important; line-height: 1.5 !important;font-size: 16px !important;
                    }
                    .video-xs .iqp-subtitle:not([data-player-hook="previewSubtitle"]){display: block !important;}
                    .video-s .iqp-subtitle{font-size: 20px !important;}
                    .video-m .iqp-subtitle{font-size: 24px !important;}
                    .video-l .iqp-subtitle{font-size: 28px !important;}
                    .video-xl .iqp-subtitle{font-size: 44px !important;}
                    .intl-episodes-list a:visited{color: #FDB813 !important;text-decoration-color: #FDB813 !important; }
                    [hidden]{display: none !important;}
                `);

            }
        }

        static applyEvents(self){
            if (this.events !== true) {
                Events(doc).on('keydown', (e) => {

                    if (e.target.closest('input') !== null) return;

                    let prevent = false;

                    switch (e.keyCode) {
                        case 13: //Enter
                            prevent = true;
                            self.trigger('video_fullscreen');
                            break;
                        case 78: //n
                            prevent = true;
                            self.trigger('video_next');
                            break;
                        case 80: //p
                            prevent = true;
                            self.trigger('video_prev');
                            break;
                    }
                    if (prevent === true) e.preventDefault();
                });

                this.events = true;

            }
        }

        constructor(video){
            if(!(video instanceof Element)){
                throw new Error('Video not an Element');
            }
            const self = this;
            Object.assign(this,{
                video: video,
                root: video.closest('.iqp-player'),
                events: {
                    root: {
                        video_playpause(){
                            if (self.video.paused === true) self.video.play();
                            else self.video.pause();
                        },
                        video_prev(){
                            try {
                                QiyiPlayerLoaderIbd.manager.players.flashbox.switchPreVideo();
                            } catch (e) {
                                console.error(e.message);
                            }

                        },
                        video_next(){
                            try {
                                QiyiPlayerLoaderIbd.manager.players.flashbox.switchNextVideo();
                            } catch (e) {
                                console.error(e.message);
                            }

                        },
                        video_fullscreen(){
                            let btn = doc.querySelector('.iqp-btn-fullscreen');
                            if (btn !== null) btn.dispatchEvent(new MouseEvent('click'));
                        }
                    }
                }
                
            });
            addEventListener('resize', () => {
                QiyiCustomPlayer.setVideoSize(self.video);
            });

            new Events(self.root, self);

            Object.keys(self.events).forEach((key) => {
                Object.keys(self.events[key]).forEach((evt) => {
                    Events(self[key]).on(evt, self.events[key][evt]);
                });
            });

            QiyiCustomPlayer.applyEvents(self);
            QiyiCustomPlayer.applyStyle();
            QiyiCustomPlayer.setVideoSize(self.video);
            console.debug(scriptname, "started.");
            
        }
    }
    

    NodeFinder.findOne('video[src]', video => {
        new QiyiCustomPlayer(video);
        NodeFinder(video.parentElement).findOne(`.iqp-btn-subtitle`, el => {
            new SubtitleDownloader(el);
        });
        NodeFinder.find(`h1.intl-play-title a`, t => {

            let title = t.innerText.trim();

            title = title.replace(/\ Season\ \d+$/, '');

            let container = t.closest('.pc-info');
            if (container !== null) {
                new MDLSearch(container, title);
            }



        });
    });




})(document);