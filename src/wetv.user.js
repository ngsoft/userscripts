// ==UserScript==
// @version      1.3.2
// @name         WETV Video Player
// @description  Video Player modificatons
// @namespace    https://github.com/ngsoft/userscripts
// @author       daedelus
// @require      https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @grant        none
// @noframes
// @include      /^https?:\/\/(www\.)?wetv.\w+\//
// @icon         https://v.qq.com/favicon.ico
// @defaulticon  data:image/x-icon;base64,AAABAAEAICAAAAEAIACoEAAAFgAAACgAAAAgAAAAQAAAAAEAIAAAAAAAgBAAAAAAAAAAAAAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////APWEAQD1hAEA9YQBAPWEAQD1hAEA9YQBAPWEAQD1gwBB9YMAxvWDAPf1gwDb9YMAkPWDACv1gwAA9YMAAPWDAAD1gwAA9YMAAPWDAAD1gwAA9YMAAPWDAAD1gwAA9YMAAPWDAAD1gwAA9YMAAPWDAAD1gwAA9YMAAPWDAAD1gwAA9YYEAPWGBAD1hgQA9YYEAPWGBAD1hgQA9YMAR/WDAPz1gwD/9YMA//WDAP/1gwD/9YMB//WDAcP1hAFS9YQBAvWEAQD1hAEA9YQBAPWEAQD1hAEA9YQBAPWEAQD1hAEA9YQBAPWEAQD1hAEA9YQBAPWEAQD1hAEA9YQBAPWEAQD2iAcA9ogHAPaIBwD2iAcA9ogHAPaIBwD1gwHV9YQB//WEAf/1hAL/9YQC//WEAv/1hQL/9YUD//WFA//1hQPb9YUEZfWGBAX1hgQA9YYEAPWGBAD1hgQA9YYEAPWGBAD1hgQA9YYEAPWGBAD1hgQA9YYEAPWGBAD1hgQA9YYEAPaKCgD2igoABXL/VAVy/7sFcv/HFXvepayUI//whgX/9YUD//WGBP/1hgT/9YYE//WGBP/1hgX/9YcF//WHBf/1hwb/9YcG3vaIBl/2iAcC9ogHAPaIBwD2iAcA9ogHAPaIBwD2iAcA9ogHAPaIBwD2iAcA9ogHAPaIBwD2iAcA9o0NAAVz/1IFc//+BXT//wV0//8Ih9P6Crph/xu2W/9opjz/xZIZ//aIBv/2iAb/9ogH//aIB//2iQf/9okI//aJCP/2iQn/9ooJ//aKCc72igpA9ooKAPaKCgD2igoA9ooKAPaKCgD2igoA9ooKAPaKCgD2igoA9ooKAPaKCgAFdf8BBXX/2AV2//8Fdv//BXb//xKWr+8KvGP/Crxj/wq8ZP8LvWT/NrRT/5qeLf/vjAz/9ooK//aLCv/2iwr/9osL//aMC//2jAz/9owM//aNDP/2jQ2p9o0NGPaNDQD2jQ0A9o0NAPaNDQD2jQ0A9o0NAPaNDQD2jQ0A9o0NAAV3/y0FeP//BXj//wV4//8Fef//HqSO7wu+Zf8Lvmb/C75m/wu/Z/8Lv2f/DL9n/x68Yf+Epjn/6JAS//aNDf/2jg7/9o4O//aODv/3jw//948P//ePEP/3kBDu95ARY/eQEQH3kBEA95ARAPeQEQD3kBEA95ARAPeQEQD3kBEABHr/bQR7//8Ee///BHv//wR8//8lrnryDMBo/wzBaf8MwWn/DMFp/wzCav8Nwmr/DcJr/w3Da/8bwGf/gqk+/+ySFf/3kBH/95ES//eREv/3kRL/95IT//eSE//3kxT/95MUv/eTFSb3kxUA95MVAPeTFQD3kxUA95MVAPeTFQAEff+cBH7//wR+//8Efv//BH///ya2bvcNw2v/DcNs/w3EbP8NxG3/DsRt/w7Fbv8OxW7/DsVv/w7Gb/8OxnD/JsJn/56nOP/1kxb/95QV//eUFv/3lBb/95UX//eVF//4lhj/+JYY9viWGHH4lxkB+JcZAPiXGQD4lxkA+JcZAASA/70Egf//BIH//wSC//8Egv//Ir5r/A7Gb/8Oxm//DsZw/zjRif8yz4b/D8hx/w/Icv8PyHL/D8lz/xDJc/8QynT/EMp0/zjCZf+3pTP/+JcZ//iXGv/4mBr/+Jga//iYG//4mRv/+Jkc//iaHKz4mh0O+JodAPiaHQD4mh0ABIT/1QSE//8Ehf//BIX//wSG//8bxW/+D8lz/xDJc/8QynT/u/DY/9T25v+r7s7/Udmb/xPMd/8RzHf/Ec13/xHNeP8RzXj/Ec55/xLOev9jvFn/554k//ibHv/4mx7/+Jse//icH//4nB//+Z0g//mdINT5nSEZ+Z0hAPmdIQAEh//hBIj//wSI//8Dif//A4n+/xHMdv8RzHf/Ecx3/xLNeP/Y+Oj/3Pjq/9346//f+Oz/vPLZ/1feof8T0Hz/EtF8/xPRff8T0X3/E9J+/xPSfv8nznf/uqw7//meIv/5niL/+Z8j//mfI//5nyT/+aAk//mgJdz5oSUg+aElAAOL//ADjP//A4z//wON//8Ekff/Es96/xLPe/8S0Hv/HtKD/+P57//l+vD/5vrx/+j68v/q+/P/7Pv0/8Hz3f9L3p7/FNWB/xTVgv8U1YL/FdaD/xXWg/8X14P/i7tT//mhJv/5oib/+aIn//miJ//5oyj/+aMo//qkKdv6pCkQA4//8AOQ//8DkP//A5H//wSV9/4T03//E9N//xTTgP8n14r/7fv0/+789f/w/Pb/8vz3//P9+P/1/fn/9v36//j++/+m8NH/KNyP/xbZh/8W2of/FtqI/xbbiP8X24n/jb9Y//qlKv/6pSv/+qUr//qmLP/6piz/+qct//qnLY8Dk//wA5P//wOU//8DlP//Bpvy8hXWg/8V14P/FdeE/y/ck//2/fr/9/36//n++//6/vz/+/79//z+/f/9//7//v/////////m+/L/NOGa/xjdjP8Y3oz/GN6N/xjfjf8j3In/+Kgv//qoLv/6qS//+qkv//qpMP/6qjD/+qox5wOX//ACl///Apj//wKY//8Fn/PyFtqH/xbaiP8X24n/Mt+X//3//v/+//7//////////////////////////////////////+f88/855J//GeGQ/xnhkf8Z4pH/GuKS/yPhjv/4rDL/+6sy//urMv/7rDP/+6wz//utNP/7rTTyApv/7gKb//8CnP//Apz//wOh+PgY3Yz/GN6M/xjejf8t4pj///////////////////////////////////////////+y9tv/Leac/xrklP8a5ZX/G+WV/xvmlv8b5pb/hMtp//uuNf/7rjb/+642//uvN//7rzf/+7A4//uwOKkCn//hAp///wKg//8CoP//A6X4/xnhkP8Z4pH/GeKR/yflmP/////////////////////////////////Z++7/W+20/xvnl/8c55j/HOiY/xzomf8c6Zn/HOma/3nScv/4sTn/+7E5//uxOf/7sTr//LI6//yyO//8szvq/LM8IAKi/94Co///AqP//wKk//8CpP//HOWV/xvllf8b5pb/HeaX//7////////////////////j/PP/d/LC/yDpnP8d6pv/Heqb/x3rnP8d653/Heyd/yfpmf+tx17//LM7//yzPP/8tDz//LQ9//y0Pf/8tT7//LU+6Py1Py/8tT8AAab/0gGn//8Bp///Aaj//wGo//8p5JT+HOma/xzpmv8d6pv/4/zy///////W++3/dfPD/yLsn/8e7J7/Hu2f/x7tn/8e7qD/Hu6g/x7vof9b34b/371L//y1Pv/8tj///LY///y2QP/8t0D//LdB//y3Qdf8uEIj/LhCAPy4QgABqv/EAar//wGr//8Bq///Aaz//zLllvse7J7/Hu2e/x7tn/9R8rX/SPGy/x7uoP8f76H/H++h/x/wov8f8KP/H/Cj/x/xo/8265r/qs1l//u3Qf/8uEH//LhC//y4Qv/9uUP//blD//25RP/9ukSv/bpFDv26RQD9ukUA/bpFAAGt/6MBrv//Aa7//wGu//8Br///O+OZ9R/wov8f8KL/H/Cj/x/xo/8f8aT/IPKk/yDypf8g8qX/IPOm/yDzpv8q8aL/jdd2//O8SP/9uUT//bpE//26Rf/9u0X//btG//27Rv/9vEb5/bxHcf28RwH9vEcA/bxHAP28RwD9vEcAAbD/cAGx//8Bsf//AbH//wGy//894aLsIPOm/yDzpv8g86f/IfSn/yH0qP8h9aj/IfWo/yH1qf8q9KX/gtx9/+zATv/9u0b//bxG//28R//9vEf//b1I//29SP/9vUn//b5Jzv2+SSz9vkkA/b5JAP2+SQD9vkkA/b5JAP2+SQABs/8sAbT//wC0//8AtP//ALX//zndsOQh9qn/Ifaq/yL2qv8i96r/Iver/yL3q/8u9ab/iNx9/+rCUf/9vUj//b5J//2+Sf/9vkr//b9K//2/Sv/9v0v//sBL9v7ATH3+wEwF/sBMAP7ATAD+wEwA/sBMAP7ATAD+wEwA/sBMAAC2/wEAtv/ZALb//wC3//8At///K9bF3iL4rP8i+a3/I/mt/yP5rv9F8Z7/otd0//LCT//9v0r//b9L//7AS//+wEz//sBM//7BTP/+wU3//sFN//7CTrj+wk4j/sJOAP7CTgD+wk4A/sJOAP7CTgD+wk4A/sJOAP7CTgD+wk4A/sVSAAC4/0IAuf/5ALn//wC5//8WzN/fI/uv/zD3qv925Yr/ys5k//7ATP/+wU3//sFN//7BTf/+wk7//sJO//7CTv/+wk///sNP//7DT9v+w1BR/sNQAP7DUAD+w1AA/sNQAP7DUAD+w1AA/sNQAP7DUAD+w1AA/sNQAP7DUAD+xlQA/sZUAAC7/zcAu/+lALv/uRXD6pm702z/+MRR//7CTv/+wk///sNP//7DT//+w1D//sNQ//7EUP/+xFH//sRR//7FUeT+xVJs/sVSBv7FUgD+xVIA/sVSAP7FUgD+xVIA/sVSAP7FUgD+xVIA/sVSAP7FUgD+xVIA/sVSAP/IVQD/yFUA/8hVAP/IVQD/yFUA/8hVAP7DUNL+xFD//sRR//7EUf/+xVH//sVS//7FUv/+xVL//sZT//7GU+H+xlNu/sZUCP7GVAD+xlQA/sZUAP7GVAD+xlQA/sZUAP7GVAD+xlQA/sZUAP7GVAD+xlQA/sZUAP7GVAD+xlQA/8hWAP/IVgD/yFYA/8hWAP/IVgD/yFYA/sVSRf7GU/v+xlP//sZT//7GVP//x1T//8dU///HVcr/x1VY/8hVBP/IVQD/yFUA/8hVAP/IVQD/yFUA/8hVAP/IVQD/yFUA/8hVAP/IVQD/yFUA/8hVAP/IVQD/yFUA/8hVAP/IVQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8dVQP/IVcb/yFX6/8hW5P/IVpP/yFYu/8hWAP/IVgD/yFYA/8hWAP/IVgD/yFYA/8hWAP/IVgD/yFYA/8hWAP/IVgD/yFYA/8hWAP/IVgD/yFYA/8hWAP/IVgD/yFYA/8hWAP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
// ==/UserScript==
((doc, undef) => {


    // https://github.com/wayneclub/Subtitle-Downloader/blob/14f24e0d1f530dc4f586fef8440941e4f0485149/services/wetv.py#L222
    // data = JSON.parse(JSON.parse(document.querySelector('#__NEXT_DATA__').innerHTML)['props']['pageProps']['data']);

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */


    class MDLSearch {
        static applyStyle(){
            if (this.style === true) return;
            this.style = true;
            addstyle(`
                .mdl-search {
                    padding: 0px;margin: 8px 8px 8px 0;display: inline-block;color: rgb(255, 255, 255);
                    border-radius: 2px;float: left;width: 32px;height: 32px;background-color: rgba(0, 0, 0, 0.3);
                    box-sizing: border-box;position: relative;cursor:pointer;
                }
                .mdl-search:hover{background: #ffb821 none repeat scroll 0% 0%;}
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



        constructor(title){
            MDLSearch.applyStyle();
            Object.assign(this, {
                title: title.innerText.trim(),
                btn: html2element('<a class="mdl-search" title="MyDramaList Search" href="#"><img src="https://mydramalist.com/favicon.ico" /></a>')
            });
            const self = this;
            title.appendChild(self.btn);

            Events(self.btn).on('click', (e) => {
                e.preventDefault();
                self.search(self.title);

            });

        }

    }


    class SubtitleDownloader {
        
        get drama(){

            let el = doc.querySelector('.title--main');
            if (el instanceof Element) {
                return sanitizeFileName(el.innerText.trim(), " ");
            }
            return null;

        }

        get episode(){
            let el = doc.querySelector('.play-video__list .play-video__item--selected');
            if (el instanceof Element) {
                let num = el.innerText.trim(), matches;
                if (matches = /(\d+)/.exec(num)) {
                    return `.E${matches[1]}`;
                }
            }
            return "";
        }

        get src(){
            let el = doc.querySelector(`video txptrack[label="English"]`);
            if (el instanceof Element) {
                return el.getAttribute('src');
            }
            return null;
        }
        
        get filename(){
            const self = this;
            let filename = self.drama;
            if ((typeof self.drama === s) && (typeof self.episode === s)) {
                filename += self.episode;
                filename += ".en.srt";
            }
            return filename;
        }


        getsubs(src, filename){
            if ((typeof src === s) && (typeof filename === s)) {
                fetch(src, {cache: "no-store", redirect: 'follow'})
                        .then(r => {
                            if (r.status === 200) return r.text();
                            throw new Error("Cannot Fetch " + src);
                        })
                        .then(text => {
                            if (text.length > 0) Text2File(text, filename);
                        })
                        .catch(ex => console.warn(ex));
            } else throw new Error("Cannot download subtitles");
        }

        
        

        constructor(nextelement){

            if (!(nextelement instanceof Element) || (nextelement.parentElement === null)) {
                throw new Error("Invalid Control");
            }
            const self = this, btn = html2element(`<txpdiv class="txp_btn txp_btn_definition userscript_dlbtn"><txpdiv class="txp_label">SRT</txpdiv></txpdiv>`);

            Events(btn).on('click', (e) => {
                e.preventDefault();
                if ((self.filename !== null) && (self.src !== null)) {
                    self.getsubs(self.src, self.filename);
                }
            });

            nextelement.parentElement.insertBefore(btn, nextelement);
            console.debug(scriptname, "started.");
        }
    }

    
    class WETVCustomPlayer {

        static get hasVideo(){
            return doc.querySelector(`.player__wrapper video[playerid]`) !== null;
        }
        
        static get player(){
            return doc.querySelector('.player__wrapper');
        }

        static applyStyles(){
            if (this.styles === true) return;
            this.styles = true;
            addstyle(`
                .player__wrapper .txp-watermark, .player__wrapper > button {display: none !important;}
            `);
        }
  
        
        
        static applyEvents(){
            if (this.events !== true) {
                this.events = true;

                const codes = {
                    //32: 'video_playpause',
                    13: 'video_fullscreen',
                    78: 'video_next',
                    80: 'video_prev'

                };
                Events(doc.body).on('keydown keyup', (e) => {
                    let prevent = true, player = WETVCustomPlayer.player;
                    if ((e.target.closest('input') !== null) || (player === null) || (WETVCustomPlayer.hasVideo === false)) return;
                    let key = e.keyCode;
                    if(typeof codes[key] === s){
                        e.preventDefault();
                        if (e.type === "keyup") trigger(player, codes[key]);
                    }
                });



            }
        }


        get EpisodeList(){
            return doc.querySelectorAll(`.play-video__list li`);
        }

        get CurrentEpisodeIndex(){
            let index = -1;
            this.EpisodeList.forEach((a, i) => {
                if (a.classList.contains('play-video__item--selected')) index = i;
            });
            return index;
        }

        constructor(txp_player){

            if (!(txp_player instanceof Element)) throw new Error('Invalid Player.');

            Object.assign(this, {
                player: txp_player,
                video: txp_player.querySelector('video[playerid]'),
                events: {
                    video_playpause(e){
                        if (self.video.paused === true) self.video.play();
                        else self.video.pause();
                    },
                    video_prev(e){
                        let ci = this.CurrentEpisodeIndex, list = this.EpisodeList, prev = ci - 1;

                        if ((prev >= 0) && (typeof list[prev] !== u)) {
                            list[prev].querySelector('a').dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
                        }

                    },
                    video_next(e){
                        let ci = this.CurrentEpisodeIndex, list = this.EpisodeList, next = ci + 1;
                        if ((next > 0) && (typeof list[next] !== u)) {
                            list[next].querySelector('a').dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}));
                        }

                    },
                    video_fullscreen(e){
                        let btn = doc.querySelector('span[data-role="wetv-player-ctrl-fullscreen"]');
                        if (btn !== null) btn.dispatchEvent(new MouseEvent('click'));
                    }
                }
            });
            const self = this;
            new Events(self.player, self);

            Object.keys(self.events).forEach((type) => {
                self.on(type, self.events[type]);
            });

            WETVCustomPlayer.applyEvents();
            WETVCustomPlayer.applyStyles();

        }

    }

    history.replaceState = (function(){
        const old = history.replaceState;
        return function(state, title, url){
            trigger(doc.body, UUID + '.replacestate', {
                state: state,
                title: title,
                url: url
            });
            return old.call(history, state, title, url);
        };
    })();

    NodeFinder.findOne(`.txp_right_controls .txp_btn[data-role*="wetv-player-subtitle-container"]`, el => {
        new SubtitleDownloader(el);
    });

    NodeFinder.findOne(`.player__wrapper video[playerid]`, el => {
        let player = el.closest('.player__wrapper');
        if (player !== null) new WETVCustomPlayer(player);
    });


    let mdl = null;
    Events(doc.body).on(UUID + '.replacestate', e => {
        if (mdl === null) return;
        if (!doc.body.contains(mdl.btn)) {
            mdl = null;
            NodeFinder.findOne(`h2.title--main, h1.title--main`, el => {
                mdl = new MDLSearch(el);
            });
        }
    });
    NodeFinder.findOne(`h2.title--main, h1.title--main`, (el, obs) => {
        mdl = new MDLSearch(el);
        obs.stop();

    });




})(document);