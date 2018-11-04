(function (funcName, baseObj) {
    // The public function name defaults to window.docReady
    // but you can pass in your own object and own function name and those will be used
    // if you want to put them in a different namespace
    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the docReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }

    function readyStateChange() {
        if (document.readyState === "complete") {
            ready();
        }
    }

    // This is the one public interface
    // docReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    baseObj[funcName] = function (callback, context) {
        if (typeof callback !== "function") {
            throw new TypeError("callback for docReady(fn) must be a function");
        }
        // if ready has already fired, then just schedule the callback
        // to fire asynchronously, but right away
        if (readyFired) {
            setTimeout(function () {
                callback(context);
            }, 1);
            return;
        } else {
            // add the function and context to the list
            readyList.push({
                fn: callback,
                ctx: context
            });
        }
        // if document already ready to go, schedule the ready function to run
        if (document.readyState === "complete") {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            // otherwise if we don't have event handlers installed, install them
            if (document.addEventListener) {
                // first choice is DOMContentLoaded event
                document.addEventListener("DOMContentLoaded", ready, false);
                // backup is window load event
                window.addEventListener("load", ready, false);
            } else {
                // must be IE
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})("docReady", window);

if (typeof LoadAQ == 'undefined') {
    var LoadAQ = {};
    LoadAQ.loadAQload = function () {

        var cssStr =
            ".loadingContainer{position:relative;width:100%;height:100%;border:3px solid #707070;background-color:#353540}.loaderAll2{position:absolute;top:50%;left:50%;margin-left:-26px;margin-top:-25px}.loadingText{position:absolute;color:#084f79;top:62px;height:38px;line-height:38px;width:100%;text-align:center;font-family:Verdana,Geneva,Tahoma,sans-serif;font-size:9px;animation:fc 3s linear infinite}.loaderV1{position:absolute;top:0;left:0;border:5px solid #084f79;border-bottom:5px solid #FFFFFF00;border-left:5px solid #944c51;border-top:5px solid #FFFFFF00;border-radius:50%;width:30px;height:30px;animation:spinStop 3s linear infinite}.loaderV2{position:absolute;top:0;left:9px;border:5px solid #084f79;border-bottom:5px solid #FFFFFF00;border-left:5px solid #944c51;border-top:5px solid #FFFFFF00;border-radius:50%;width:30px;height:30px;animation:spinRStop 3s linear infinite}.loaderV3{position:absolute;top:13px;left:17px;border:0;background-color:#944c51;border-radius:50%;width:15px;height:15px;animation:bgc 3s linear infinite}@keyframes fc{0%{color:#999}50%{color:#eee}100%{color:#999}}@keyframes bgc{0%{background-color:#944c51}50%{background-color:#084f79}100%{background-color:#944c51}}@keyframes spinStop{0%{transform:rotate(0deg)}12.5%{transform:rotate(0deg)}25%{transform:rotate(0deg)}37.5%{transform:rotate(0deg)}50%{transform:rotate(180deg)}62.5%{transform:rotate(180deg)}75%{transform:rotate(180deg)}87.5%{transform:rotate(180deg)}100%{transform:rotate(360deg)}}@keyframes spinRStop{0%{transform:rotate(0deg)}12.5%{transform:rotate(0deg)}25%{transform:rotate(-180deg)}37.5%{transform:rotate(-180deg)}50%{transform:rotate(-180deg)}62.5%{transform:rotate(-180deg)}75%{transform:rotate(-360deg)}87.5%{transform:rotate(-360deg)}100%{transform:rotate(-360deg)}}";

        var style = document.createElement("style");
        style.innerHTML = cssStr;
        document.head.appendChild(style);

        var LoadAQCue = document.getElementsByClassName("loadAQ");

        var nextLoad = function (val1, args1) {

            var rm = val1.getElementsByClassName("loadingContainer");

            for (var i = 0; i < rm.length; i++) {
                val1.style.width = "auto";
                val1.style.height = "auto";
                rm[i].parentNode.removeChild(rm[i]);
            }

            val1.className = "loaderAQReadyElement";

            if (LoadAQCue.length > 0) {
                loadIterate();
            }

        };

        var showLoading = function () {
            for (var i = 0, len = LoadAQCue.length; i < len; i++) {
                var val = LoadAQCue[i];
                val.style.width = "100px";
                val.style.height = "100px";
                var tooltip = "loading";
                var args = JSON.parse(val.getAttribute("loadAQargs"));
                if(args == "" || !args) {
                    var rm = val.getElementsByClassName("hiddenAQ");
                    args = JSON.parse(rm[0].textContent);
                }
                if (args.url) {
                    tooltip = args.url;
                }
                val.title = tooltip;
                var loadingAnim = document.createElement("div");
                loadingAnim.className = "loadingContainer";
                loadingAnim.innerHTML =
                    "<div class='loaderAll2'><div class='loaderV1'></div><div class='loaderV2'></div><div class='loaderV3'></div></div><div class='loadingText'>Loading...</div>";
                val.appendChild(loadingAnim);
            }
        };

        showLoading();

        var loadIterate = function () {

            var val = LoadAQCue[0];
            debugger;
            var args = JSON.parse(val.getAttribute("loadAQargs"));
            if(args == "" || !args) {
                var rm = val.getElementsByClassName("hiddenAQ");
                args = JSON.parse(rm[0].textContent);
            }
            if (args.containerID) {
                var apnd = document.createElement("div");
                apnd.id = args.containerID;
                apnd.width = args.width;
                apnd.height = args.height;
                val.appendChild(apnd);
            };
            if (!args.loadAsText) {
                args.loadAsText = false;
            }

            var loadN = function (type, url, loadAsText, val2, args2) {
                if (!loadAsText) {
                    var script = document.createElement(type);
                    script.onload = function () {
                        nextLoad(val2, args2);
                    };
                    script.src = url;
                    document.head.appendChild(script);
                } else {
                    var xhttp = new XMLHttpRequest();
                    xhttp.onreadystatechange = function () {
                        if (this.readyState == 4 && this.status == 200) {
                            var script = document.createElement(type);
                            script.innerHTML = this.responseText;
                            document.head.appendChild(script);
                            nextLoad(val2, args2);
                        }
                    };
                    xhttp.open("GET",
                        "https://cors-anywhere.herokuapp.com/" + url,
                        true);
                    xhttp.send();
                }
            };
            loadN(args.type, args.url, args.loadAsText, val, args);
        }

        loadIterate();

    }

    LoadAQ.loadAll = function () {
        docReady(function () {
            LoadAQ.loadAQload();
        });
    };

}