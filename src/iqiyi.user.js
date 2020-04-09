// ==UserScript==
// @version     1.0
// @name        iQiyi Video Player
// @description Video Player modificatons
// @namespace   https://github.com/ngsoft/userscripts
// @author      daedelus
//
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.0.1/dist/gmutils.min.js
// @grant       none
// @noframes
//
// @include     /^https?:\/\/(www\.)?iqiyi.com\/intl\/play\//
// @icon        https://www.iqiyipic.com/common/images/logo.ico
// ==/UserScript==

((doc, undef) => {

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */
    
    
    class QiyiCustomPlayer{
        
        static setVideoSize(video){

            if (video === undef) video = doc.querySelector('video');

            if (video instanceof Element) {
                let width = video.offsetWidth, player = video.closest('.iqp-player');
                player.classList.remove('video-m', 'video-l', 'video-xl');
                if (width > 1900) player.classList.add('video-xl');
                else if (width > 1100) player.classList.add('video-l');
                else if (width > 615) player.classList.add('video-m');

            }
        }

        static applyStyle(){
            if (this.ready !== true) {

                addstyle(this.style);
                this.ready = true;
            }
        }

        static get style(){
            return `
                video{object-fit: cover;}
                .iqp-logo-box{display: none;}
                .iqp-subtitle{
                    bottom: 10% !important; text-shadow: 5px 5px 5px #000 !important;
                    min-width: 60% !important; background: rgba(0,0,0,.55) !important;
                    padding: 2% 0 !important;text-align: center !important;font-size: 16px !important;
                }
                .video-m .iqp-subtitle{font-size: 24px !important;}
                .video-l .iqp-subtitle{font-size: 28px !important;}
                .video-xl .iqp-subtitle{font-size: 40px !important;}
            `;
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
                        video_fullscreen(){
                            Events().trigger('click');
                            doc.querySelector('.iqp-btn-fullscreen').click();
                            
                            //console.debug(self.root);
                        },
                        video_playpause(){
                            if (self.video.paused === true) self.video.play();
                            else self.video.pause();
                        }
                    }
                }
                
            });
            addEventListener('resize', () => {
                QiyiCustomPlayer.setVideoSize(self.video);
            });

            Events(doc).on('keydown', (e) => {

                switch (e.keyCode) {
                    case 70:
                        self.trigger('video_fullscreen');
                        console.debug("fullscreen key");
                        break;
                    case 32:
                        self.trigger('video_playpause');
                        break;
                }


                console.debug(e);
            });

            new Events(self.root, self);

            Object.keys(self.events).forEach((key) => {
                Object.keys(self.events[key]).forEach((evt) => {
                    Events(self[key]).on(evt, self.events[key][evt]);
                });
            });


            QiyiCustomPlayer.applyStyle();
            QiyiCustomPlayer.setVideoSize(self.video);
            console.debug(scriptname, "started.");
            
        }
    }
    


    find('video', (video, obs) => {
        obs.stop();
        new QiyiCustomPlayer(video);

    });


})(document);