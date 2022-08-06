// ==UserScript==
// @version      2.6
// @name         MDN + PHP Web Docs
// @description  Use MDN Web Docs and PHP UI to store locale and auto redirect to the choosen on every pages
// @author       daedelus
// @namespace    https://github.com/ngsoft/userscripts
// @icon         https://developer.mozilla.org/favicon.ico
// @defaulticon  data:image/x-icon;base64,AAABAAMAEBAAAAEAIADvAAAANgAAACAgAAABACAAYwEAACUBAAAwMAAAAQAgAPkBAACIAgAAiVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAtklEQVR4AZWRJViGYRAEcXd3OmYNdzLS6SToSC9U3HtBG4n+EKl8CXeXdxb53Wwunu9GRSl4RFYQrejABSkaYoEtxhmhhVjvghzN86Y/ELKoxaMgUysYuXPEKEXYC2I0hoW8MNojg/+CaJWzZt6QFycUYF+RTJc5dO741DVvemaWeNeR+UyYc2zpKarpp5NkzzebuEaSTqnErw6pmuEO6ZhsAigZpwEO2DEpwbxIUSUxEZsVPH4ACU0+59cLKjAAAAAASUVORK5CYIKJUE5HDQoaCgAAAA1JSERSAAAAIAAAACAIBAAAANlzsn8AAAEqSURBVHgB7dQhbMJAFMZxEoKpQCBQFSh0HQofFBJVN1k1iZeYeiQKUzmDQmHq8FgSBApBuP93I9lCch23HltwfE82+fXda981Gvaf9QKeBkRKmPDGiJ5aehCIlLLiKKy1Z+1YMmNOzoAgINaCs+ydbIlVC/S0wnpy0YQaINYH9pdsSenKC3RVYGtyVqmpSWj+BDpaYAOz17upAE2bmVKldoHIhna1g/a1+qwCgS0ducDtELpWfUrdAWKlpGQm5Bg5nv8g0ozLnRZkTzrp68lBS/o+YMyaDQdVpz41QwZMyJkzxNmOageRYpUOgM3MQ8s04iT3/X0eAjKD75OFAR3lzj6uiUIAdxKZ2d+IglYY4NaA4nsWC/54J0YaU3BUXg/4q6WEhCffyi/gEzZg+zU7qF7TAAAAAElFTkSuQmCCiVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAABwElEQVR4Ae3XIZDaQAAFUG7WRKxCIU5ExmHwKBzyRP2cwtR1pg53FovA4U7Voc6gEKgqDIapO4OJ2Pz/t71mpsM1yTVJti7/+30i4S8ZDPx/bg/0QL32gJFVzIQxre5CA0M+YIMDLnzVhXuusjlGtLK654hGnQCrRxzh5N/F6cQ9DzjzxA0StgYSPhcOL+YFQ7YCJjzC10iqGVoAE36nr5knN1BDYIwjfO28aoEhGwAJD/CN4nTElyyhUQ0g5p6+TXTh2s1g9SFwzx18h6TaYYxKYMRv8J2zhVEpYLTAnnnPbA/sGZUDdz6SVfSr+VvUNgfYInDbmC/wHXIsAuEecz4e0UfAFE8u79pd2QZYZrW2yGrtIN84J8asAVitsn8fD6W63dsLt5ihxhZFWmap3FsrkQtX2QOmmGOBLU58O3wMo1pjZzXF7HefUXX8FLe/oBFjRmp8ow2rZk9fsyB38hypfEmunDAAYLSBL82ZozDA2nlVj0GxLZ7BpvTa38F0B/JaLbMri4M8CAHkNfqE01/EKgv81zHh9t37tAwJ5I00x+4P8jk0kNdqji1+0OsRoYBCjRIuMGH/AdKkPdADPwH8iDUX1erRUwAAAABJRU5ErkJggg==
//
// @run-at       document-end
// @noframes
// @grant        none
//
// @include      *://developer.mozilla.org/*
// @include      *://*php.net/manual/*
// ==/UserScript==
