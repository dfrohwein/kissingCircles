console.log("^^");

var g2a = {
    w : 400,
    h : 400
};

//needs global var takt mille seconds

var startOutSoundEb = function (game) {
    var soundEb = {};
    soundEb.game = game;
    soundEb.takt = 10 * 8; //622 chained to the rythm (1/4 = takt? so actually takt * 4 = takt)
    soundEb.chord1 = {};
    soundEb.bgm = {};
    soundEb.knockClick = {};
    soundEb.click = {};
    soundEb.chord2 = {};
    //rythmic calls tythm 1 = 1/4 note, the numbers are the delay after the last note (time between the last note and them(not theyre own length, but the length of the note before)
    //if u ignore the 0 at the first spot this is the notes length with no pauses
    //soundEb.rythm = [0, 2, 1, 1, 2]; type ["mute8"] for a pause of the duration (play nothing at the 8 point, but still wait this long)
    soundEb.rythm = [0, 1.5, 1.5];
    //if the rythm is still running (needed if its longer than one takt
    soundEb.rythmStillRunning = false;
    //sounds to play on takt array
    soundEb.toPlay = [];
    //functions being called one after another on takt
    soundEb.toC = [];
    //functions being called all at once next takt
    soundEb.toCNextTakt = [];
    //functions being called one after another on a delay from takt start
    soundEb.toCRythmic = [];
    //volume
    soundEb.volBase = 5;
    //rythm loop event
    soundEb.looper = null;
    //rythm timer
    soundEb.taktTimer = null;
    //odd even
    soundEb.oddEven = false;
    //countQuart
    soundEb.quarts = 1;
    //count to 32
    soundEb.to32 = 1;
    soundEb.randomShift = Math.floor(Math.random() * 100);
    soundEb.beatObjects = [];
    //gimmick textbox
    soundEb.textBox = null;
    soundEb.textBoxTween1 = null;
    soundEb.textBoxTween2 = null;
    soundEb.textPrio = 0;
//press a takt
    soundEb.pressTimes = [];
    soundEb.pressDist = 0;
    soundEb.pressTimesRythm = [];
    soundEb.rythmTimes = [];
    soundEb.newTaktFromPressEvent = null;

    /**
     * init
     * @returns {undefined}
     */
    soundEb.addAndStartTaktTimer = function () {
        //extra timer to keep rythm
        soundEb.taktTimer = soundEb.game.time.create(false);
        soundEb.taktTimer.start();
        soundEb.startTaktLoop();
    };

    /**
     * Creates a new beat object and adds it to the beat object array
     * @param {type} rythm [0,1,1] would be 1,1,1,pause, [0,1.5,1.5] would be pointed 1/4, pointed 1/4, 1/4 
     * (its first beat at 0, then distance to next beat
     * @param {type} args argument chain given to the function [] needs to be array
     * @param {type} funct the function to call
     * @returns {soundEb.beatObject}
     */
    soundEb.newBeatObject = function (rythm, args, funct) {
        var nb = new soundEb.beatObject(rythm, args, funct);
        soundEb.beatObjects.push(nb);
        return nb;
    };
    /**
     * Beat object, factory "newBeatObject" should be used to create it
     * @param {type} rythm
     * @param {type} args
     * @param {type} funct
     * @returns {soundEb.beatObject}
     */
    soundEb.beatObject = function (rythm, args, funct) {
        this.rythm = rythm;
        this.args = args;
        this.funct = funct;
    };
    soundEb.removeAllBeatObjects = function () {
        soundEb.beatObjects.splice(0, soundEb.beatObjects.length);
        for (var i = 0, max = soundEb.taktTimer.events.length; i < max; i++) {
            if(soundEb.taktTimer.events[i].ident == "fromObj") {
                soundEb.taktTimer.remove(soundEb.taktTimer.events[i]);
            }
        }
        //console.log(soundEb.beatObjects);
    };

    soundEb.addSounds = function () {
        soundEb.chord1 = soundEb.game.add.audio('chord1');
        soundEb.chord2 = soundEb.game.add.audio('chord2');
        soundEb.knockClick = soundEb.game.add.audio('knockClick');
        soundEb.click = soundEb.game.add.audio('click');
        soundEb.bgm = soundEb.game.add.audio('bgm');
        var startBg = function () {
            soundEb.bgm.play(null, 0, soundEb.volBase, true);
            soundEb.addTaktTimer();
        };
        soundEb.game.sound.setDecodedCallback([soundEb.chord1, soundEb.bgm], startBg, this);
    };
    soundEb.startTaktLoop = function () {
        //avoid double
        if (soundEb.looper != null) {
            soundEb.taktTimer.events.remove(soundEb.looper);
        }
        if (true) {
            soundEb.looper = soundEb.taktTimer.loop(soundEb.takt, soundEb.playSoundOrFunctAtTakt, this);
        }

        //hot to slow and speed up
        //soundEb.looper.delay+=1000;
    };
    /**
     * Starts delayed events on every new takt that follow a rythm
     * @returns {undefined}
     */
    soundEb.rythmicCalls = function () {
        if (!soundEb.rythmStillRunning) {
            let countTrough = 0;
            for (var i = 0; i < soundEb.rythm.length; i++) {
                countTrough += soundEb.rythm[i];
                soundEb.taktTimer.add(countTrough * soundEb.takt, soundEb.rythmicFunctionCallsFromLoop, this);
            }
            soundEb.rythmStillRunning = true;
            var a = function () {
                soundEb.rythmStillRunning = false;
            };
            soundEb.taktTimer.add(countTrough * soundEb.takt * 1.01, a, this);
        }
    };
    /**
     * Calll function at takt x
     * @param {type} takt
     * @param {type} funct
     * @returns {undefined}
     */
    soundEb.addEventAtTakt = function (takt, funct) {
        soundEb.taktTimer.add(soundEb.takt * takt, funct, this);
    };

    /**
     * Starts delayed events on every new takt that follow a rythm
     * @returns {undefined}
     */
    soundEb.rythmicCallsFromBeatObjects = function (beatObj) {
        var args = beatObj.args;
        var rythm = beatObj.rythm;
        var funct = beatObj.funct;
        //to be able to give over arguments workaround
        var functParam = function () {
            funct.apply(this, args);
        }
        //if the beat isnt still active, repeat it
        if (!beatObj.stillRunning) {
            //counts the all together duration of the beat to avoid multiples
            let countTrough = 0;
            //add all the beat repetions within the take at start
            for (var i = 0; i < rythm.length; i++) {
                //if beat is a number, treat is a delay until u add the next event
                if (typeof rythm[i] == "number") {
                    //add to all over duration
                    countTrough += rythm[i];
                    //add event at time point -> milisekonds of a 1/4 note * beat array number
                    var eventTemp = soundEb.taktTimer.add(countTrough * soundEb.takt, functParam, this);
                    eventTemp.ident = "fromObj";
                } else {
                    //if its not a number treat it as a pause
                    var numb = rythm[i].match(/\d/g);
                    numb = numb.join("");
                    //just add it to over all duration without adding an event
                    countTrough += numb;
                }
            }
            //wait till beat is done
            beatObj.stillRunning = true;
            var a = function () {
                beatObj.stillRunning = false;
            };
            //wait till beat is done before enabling repeat
            var eventTemp = soundEb.taktTimer.add(countTrough * soundEb.takt * 0.95, a, this);
            eventTemp.ident = "fromObj";
        }
    };
    /**
     * Stars the rythmic functions and maintains their array
     * @returns {undefined}
     */
    soundEb.rythmicFunctionCallsFromLoop = function () {
        if (soundEb.toCRythmic.length > 0) {
            var args = soundEb.toCRythmic[0].args;
            if (args != null) {
                soundEb.toCRythmic[0].fCall(args[0], args[1], args[2], args[3], args[4], args[5]);
            } else {
                soundEb.toCRythmic[0].fCall();
            }
            soundEb.toCRythmic.shift();
        }
    };
    soundEb.playSoundRythm = function (sndName) {
        if (soundEb.toC.length < 4) {
            soundEb.toPlay.shift();
        }
        soundEb.toPlay.push(sndName);
    };
    /**
     * Call functions onea after another to a rythmic beat
     * @param {type} funct
     * @param {type} args1
     * @returns {undefined}
     */
    soundEb.callFunctRythmic = function (funct, args1) {
        var tempObj = {};
        tempObj.fCall = funct;
        tempObj.args = args1;
        if (soundEb.toCRythmic.length > 32) {
            soundEb.toCRythmic.shift();
        }
        soundEb.toCRythmic.push(tempObj);
    };
    /**
     * Functions are called one after another on takt
     * @param {type} funct
     * @param {type} waitForQuart
     * @param {type} args1
     * @returns {undefined}
     */
    soundEb.callFunctBeat = function (funct, waitForQuart, args1) {
        var tempObj = {};
        tempObj.fCall = funct;
        tempObj.args = args1;
        tempObj.waitForQuart = waitForQuart;
        if (soundEb.toC.length > 32) {
            soundEb.toC.shift();
        }
        soundEb.toC.push(tempObj);
    };
    /**
     * All functions are called on the next takt
     * @param {type} funct
     * @param {type} args1
     * @returns {undefined}
     */
    soundEb.callFunctNextTakt = function (funct, args1) {
        var tempObj = {};
        tempObj.fCall = funct;
        tempObj.args = args1;
        if (soundEb.toCNextTakt.length > 32) {
            soundEb.toCNextTakt.shift();
        }
        soundEb.toCNextTakt.push(tempObj);
    };
    /**
     * Looping function called
     * @returns {undefined}
     */
    soundEb.playSoundOrFunctAtTakt = function () {

        if (soundEb.quarts == 1) {
            for (var i = 0, max = soundEb.beatObjects.length; i < max; i++) {
                soundEb.rythmicCallsFromBeatObjects(soundEb.beatObjects[i]);
            }
            soundEb.rythmicCalls();
        }

        //sounds
        if (soundEb.toPlay.length > 0) {
            switch (soundEb.toPlay[0]) {
                case "chord1":
                    soundEb.chord1.play(null, 0, soundEb.volBase * 5);
                    break;
                case "chord2":
                    soundEb.chord2.play(null, 0, soundEb.volBase * 5);
                    break;
                case "knock":
                    break;
                case "knockClick":
                    soundEb.knockClick.play(null, 0, 2);
                    break;
                case "rifl1":
                    soundEb.rifl1.play(null, 0, 2);
                    break;
                case "rifl2":
                    break;
            }
            soundEb.toPlay.shift();
        }

        //functions on takt
        soundEb.oddEven = !soundEb.oddEven;
        if (soundEb.toC.length > 0) {
            var args = soundEb.toC[0].args;
            if (soundEb.toC[0].waitForQuart == soundEb.quarts || !soundEb.toC[0].waitForQuart) {
                if (args != null) {
                    soundEb.toC[0].fCall(args[0], args[1], args[2], args[3], args[4], args[5]);
                } else {
                    soundEb.toC[0].fCall();
                }
                soundEb.toC.shift();
            }
        }

        //functions next takt
        if (soundEb.toCNextTakt.length > 0) {
            for (var iz = 0; iz < soundEb.toCNextTakt.length; iz++) {
                var args = soundEb.toCNextTakt[iz].args;
                if (args != null) {
                    soundEb.toCNextTakt[iz].fCall(args[0], args[1], args[2], args[3], args[4], args[5]);
                } else {
                    soundEb.toCNextTakt[iz].fCall();
                }
            }
            soundEb.toCNextTakt = [];
        }

        //count 4 takts
        soundEb.quarts++;
        if (soundEb.quarts == 5) {
            soundEb.quarts = 1;
        }
        soundEb.to32++;
        if (soundEb.to32 == 33) {
            soundEb.to32 = 1;
        }
    };
    soundEb.pushRandomSnd = function () {
        var retn;
        switch (Math.floor(Math.random() * 2.99)) {
            case 0:
                retn = "chord1";
                break;
            case 1:
                retn = "chord2";
                break;
        }
        soundEb.playSoundRythm(retn);
    };
    soundEb.playRandomChord = function () {
        switch (Math.floor(Math.random() * 1.99)) {
            case 0:
                soundEb.chord1.play(null, 0, soundEb.volBase * 5);
                break;
            case 1:
                soundEb.chord2.play(null, 0, soundEb.volBase * 5);
                break;
        }
    };
    soundEb.playRandomRandom = function () {
        if (Math.random() > 0.3) {
            var randVol = 0.7 + Math.random() * 2;
            switch (Math.floor(Math.random() * 2.99)) {
                case 0:
                    soundEb.chord1.play(null, 0, randVol);
                    break;
                case 1:
                    soundEb.chord2.play(null, 0, randVol);
                    break;
                case 2:
                    soundEb.knockClick.play(null, 0, randVol);
                    break;
            }
        }
    };
    soundEb.clearTaktArrays = function () {
        soundEb.toPlay.splice(0, soundEb.toPlay.length);
        soundEb.toC.splice(0, soundEb.toC.length);
    };
    soundEb.getTimeToNextTick = function () {
        return soundEb.taktTimer.duration;
    };
    soundEb.getTimeToNextTickDir = function () {
        return soundEb.taktTimer.duration + (soundEb.quarts - 1) * soundEb.takt;
    };
    soundEb.enterTaktPress = function () {
        if (soundEb.pressTimes.length < 12) {
            soundEb.pressTimes.push(soundEb.taktTimer.seconds);
            var temp = [];
            var average = 0;
            for (var i = 0; i < soundEb.pressTimes.length - 1; i++) {
                temp.push(soundEb.pressTimes[i + 1] - soundEb.pressTimes[i]);
            }

            for (var i = 0; i < temp.length; i++) {
                average += temp[i];
            }

            if (soundEb.pressTimes.length < 5) {
                soundEb.textDisplay("-" + soundEb.pressTimes.length + "-", 0.1, 1);
            }

            soundEb.average = average / temp.length * 1000;
            if (!soundEb.newTaktFromPressEvent) {
                soundEb.newTaktFromPressEvent = soundEb.taktTimer.add(3000, soundEb.setTakt);
            } else {
                soundEb.newTaktFromPressEvent.delay += 700;
            }
        }
    };
    soundEb.setTakt = function () {
        var ms = soundEb.average;
        if (soundEb.average) {
            while (ms < 400) {
                ms *= 2;
            }
            while (ms > 1200) {
                ms /= 2;
            }
            //console.log("new Takt " + ms);
            soundEb.textDisplay("New beat", 1, 3);
            soundEb.takt = ms;
            soundEb.looper.delay = ms;
            console.log(ms);
        } else {
            console.log("newtaktfailed");
        }
        soundEb.newTaktFromPressEvent = null;
        soundEb.pressTimes = [];
    };

    soundEb.textInit = function () {
        var startText = "";
        var style = {align: "center", font: "3vmin monospace", fill: "#FFFFFF", wordWrap: true, wordWrapWidth: soundEb.game.width * 0.62};
        soundEb.textBox = soundEb.game.add.text(soundEb.game.width / 2, soundEb.game.height * 0.13, startText, style);
        soundEb.textBox.setShadow(7, 7, 'rgba(0,0,0,0.5)', 1);
        soundEb.textBox.anchor.setTo(0.5, 0.5);
        soundEb.textBox.alpha = 0;
    };
    soundEb.textDisplay = function (text, speed, prio) {
        if (soundEb.textPrio > prio) {
            return;
        }
        if (soundEb.textBoxTween1 != null) {
            soundEb.textBoxTween1.stop();
        }
        if (soundEb.textBoxTween2 != null) {
            soundEb.textBoxTween2.stop();
        }
        var tweenfunct = function () {
            soundEb.textBoxTween2 = soundEb.game.add.tween(soundEb.textBox).to(
                    {alpha: 0},
                    soundEb.takt * 3 * speed,
                    Phaser.Easing.Sinusoidal.InOut, true,
                    soundEb.getTimeToNextTick() + soundEb.takt * speed);
            var ret = function () {
                soundEb.textPrio = 0;
            };
            soundEb.textBoxTween2.onComplete.add(ret, this);
        };
        soundEb.textPrio = prio;
        soundEb.textBoxTween1 = soundEb.game.add.tween(soundEb.textBox).to(
                {alpha: 1},
                soundEb.takt * flyers.speed1 * 0.25 * speed,
                Phaser.Easing.Sinusoidal.InOut, true);
        soundEb.textBoxTween1.onComplete.add(tweenfunct, this);
        soundEb.textBox.text = text;
    };


    soundEb.enterRythmPress = function () {
        if (soundEb.pressTimesRythm.length < 8) {
            /*soundEb.pressTimes.push(soundEb.taktTimer.seconds);
             var temp = [];
             var average = 0;
             console.log((soundEb.taktTimer.seconds*1000)%(soundEb.takt*4));*/
            soundEb.pressTimesRythm.push(soundEb.taktTimer.seconds);
            soundEb.rythmTimes = [];
            var average = 0;
            for (var i = 0; i < soundEb.pressTimesRythm.length - 1; i++) {
                soundEb.rythmTimes.push(soundEb.pressTimesRythm[i + 1] - soundEb.pressTimesRythm[i]);
            }
        } else {
            for (var i = 0; i < soundEb.rythmTimes.length; i++) {
                var b = ((soundEb.rythmTimes[i] * 1000) / 600);
                console.log(b);
            }
        }
    };

    return soundEb;
};

function roundToMultipleOfNum(x, num) {
    return Math.round(x / num) * num;
}

//daniel@frohwein.de

g2a.startBeat = function () {

    var drawModulated = false;


    var getRandomCol = function() {
        colrs = ["#1D222B","#1A241F","#291F21","#29271D"];
        rd = Math.floor(Math.random()*colrs.length*0.999);
        return colrs[rd];
    }

    var switchColorSprite = function (col, sprite) {
        var sprite;
        switch (col) {
            case "green":
                sprite = globalSpritesAndBmds.spritegreen;
                break;
            case "blue":
                sprite = globalSpritesAndBmds.spriteblue;
                break;
            case "yellow":
                sprite = globalSpritesAndBmds.spriteyellow;
                break;
            case "red":
                sprite = globalSpritesAndBmds.spritered;
                break;
            case "gray":
                sprite = globalSpritesAndBmds.spritegray;
                break;
            case "gold":
                sprite = globalSpritesAndBmds.spritegold;
                break;
            case "pink":
                sprite = globalSpritesAndBmds.spritepink;
                break;
            case "contrast":
                sprite = globalSpritesAndBmds.spritecontrast;
                break;
            case "orange":
                sprite = globalSpritesAndBmds.spriteorange;
                break;
            case "brown":
                sprite = globalSpritesAndBmds.spritebrown;
                break;
            case "black":
                sprite = globalSpritesAndBmds.spriteblack;
                break;
            case "white":
                sprite = globalSpritesAndBmds.spritewhite;
                break;
            default:
                sprite = globalSpritesAndBmds.spritegreen;
        }
        return sprite;
    }

    var randomCol = function () {
        var rd = Math.floor(Math.random() * 4.999);
        switch (rd) {
            case 0:
                return "green";
                break;
            case 1:
                return "blue";
                break;
            case 2:
                return "color";
                break;
            case 3:
                return "red";
                break;
            case 4:
                return "yellow";
                break;
        }
    }

    var randomColPlus = function () {
        var rd = Math.floor(Math.random() * 9.999);
        switch (rd) {
            case 0:
                return "green";
                break;
            case 1:
                return "blue";
                break;
            case 2:
                return "color";
                break;
            case 3:
                return "red";
                break;
            case 4:
                return "yellow";
                break;
            case 5:
                return "pink";
                break;
            case 6:
                return "orange";
                break;
            case 7:
                return "gold";
                break;
            case 8:
                return "contrast";
                break;
            case 9:
                return "gray";
                break;
        }
    }


    var getAllPositionsArray = function () {
        var arrayPs = [];
        for (let x = 0; x < g2a.game.width; x++) {
            for (let y = 0; y < g2a.game.height; y++) {
                arrayPs.push({
                    x: x,
                    y: y
                });
            }
        }
        return arrayPs;
    };

    var positionsAll = getAllPositionsArray();

    var getPositionUnique = function () {
        var rtn = Math.floor(Math.random() * positionsAll.length);
        var rt = positionsAll[rtn];
        positionsAll.splice(rtn, 1);
        return rt;
    };

    var circles = [];

    var kissingCirclesRandom = function () {

        var goW = g2a.game.width;
        var goH = g2a.game.height;

        var bmd = globalSpritesAndBmds.bmd1;
        var a = Math.random() * 0.13 * goW;
        var b = Math.random() * 0.13 * goH;

        var getClosePosition = function () {

            distx = goW / 2;
            disty = goH / 2;
            var rx = distx + (Math.random() - 0.5) * circles.length * 0.15 * goW;
            var ry = disty + (Math.random() - 0.5) * circles.length * 0.15 * goW;
            rx = Math.min(rx, goW);
            ry = Math.min(ry, goH);
            rx = Math.max(rx, 0);
            ry = Math.max(ry, 0);

            return {
                x: rx,
                y: ry
            };
        }

        if (circles.length == 0) {
            var x = goW / 2;
            var y = goH / 2;
            bmd.circle(x, y, a, "rgba(10,10,10,1)");
            circles.push([x, y, a]);
        } else {

            //var getxy = getClosePosition();
            getxy = getPositionUnique();
            var x = getxy.x;
            var y = getxy.y;
        }

        var rad = 1000;
        var dra = function (xa, ya) {
            for (let index = 0; index < circles.length; index++) {
                let element = circles[index];
                /*var dist = Math.hypot(x - element[0], y - element[1]);
                if (dist > element[2] + a) {
                    bmd.circle(x, y, a, "rgba(10,10,10,1)");
                    circles.push([x, y, a]);
                }*/
                var dist = Math.hypot(xa - element[0], ya - element[1]);
                var radx = dist - (element[2]);
                rad = Math.min(rad, radx);
            }

            if (circles.length > 0) {

                if (rad > 10 && rad < 100) {
                    bmd.circle(xa, ya, rad, "rgba(10,10,10,1)");
                    circles.push([xa, ya, rad]);
                } else {
                    rad = 1000;
                    var getxy = getPositionUnique();
                    dra(getxy.x, getxy.y);
                }

            }

        }

        dra(x, y);

        g2a.game.time.events.add(Phaser.Timer.SECOND * 0.1, nextRun, this);
    }

    var kissingCircles3Cross = function () {

        var goW = g2a.game.width;
        var goH = g2a.game.height;

        var bmd = globalSpritesAndBmds.bmd1;
        var a = Math.random() * 0.01 * goW + 0.02 * goW;
        var b = Math.random() * 0.13 * goH;

        var getClosePositionOneTouchWithRad = function () {
            let element = circles[circles.length - 1];

            var x = element[0];
            var y = element[1];
            var rd = element[2] * 0.62;
            //var dist = Math.hypot(x - element[0], y - element[1]);

            var getPointAtDistance = function (x, y, dist) {
                var rd = Math.PI + Math.random() * Math.PI * 0.05;
                var ax = Math.sin(rd) * dist + x;
                var ay = Math.cos(rd) * dist + y;
                return {
                    x: ax,
                    y: ay,
                    disty: dist
                };
            }

            var ptr = getPointAtDistance(x, y, rd + (element[2]));

            return {
                x: ptr.x,
                y: ptr.y,
                rad: rd
            }
        }

        var getClosePositionTwoTouchWithRad = function (further) {
            /*let element = circles[0];
            let element2 = circles[circles.length - 1];
            if (further) {
                var pos = Math.floor((circles.length)/8);
                pos = pos;
                element = circles[circles.length-(pos*5)];
                element2 = circles[circles.length-((pos*5)-1)];
            }
            var rd = element[2] * 0.62 * (Math.random()+0.5);

            var inters = calculateCirclesIntersectionPoints(element[0], element[1], element[2] + rd, element2[0], element2[1], element2[2] + rd);
            if(inters.intersects == false) {
                element = circles[circles.length-7];
                element2 = circles[circles.length-2];
                inters = calculateCirclesIntersectionPoints(element[0], element[1], element[2] + rd, element2[0], element2[1], element2[2] + rd);
            }*/



            var circ1 = circles[circles.length - 1];
            var circ2 = circles[circles.length - 2];

            var side = circles.length % 2;
            var lr = 1;
            var mx = g2a.game.input.mousePointer.worldX;
            var my = g2a.game.input.mousePointer.worldY;
            //var mp = new Phaser.Point(mx,my);
            var mp = new Phaser.Point(mx, my);
            var distMouse = Phaser.Point.distance(mp, new Phaser.Point(circ1[0], circ1[1]));
            if (distMouse < 20) {
                return false;
            }
            //var circp = new Phaser.Point((circ1[0]+circ2[0])/2,(circ1[1]+circ2[1])/2);
            //lr = Phaser.Point.angle(mp, circp)/Math.PI - Math.PI*0.2;

            if (Phaser.Point.distance(mp, new Phaser.Point(circ1[0], circ1[1])) < Phaser.Point.distance(mp, new Phaser.Point(circ2[0], circ2[1]))) {
                lr = 2;
            }

            var rd = circles[0][2] * ((0.62 * lr * (Math.random()*0.35 + 0.1))+0.3);

            /*for (let index = 0; index < circles.length; index++) {
                var el = circles[index];
                if(circ1 == null & (el[3].length<1)) {
                    circ1 = el;
                }
            }

            for (let index = 0; index < circles.length; index++) {
                var el = circles[index];
                 if(el != circ1 & (el[3].length<2)) {
                    circ2 = el;
                }
            }*/

            circ2[3].push(circ1);
            circ1[3].push(circ2);

            var toReturn = {};

            var inters = calculateCirclesIntersectionPoints(circ1[0], circ1[1], circ1[2] + rd, circ2[0], circ2[1], circ2[2] + rd);

            toReturn = {
                x: inters.x2,
                y: inters.y2,
                rad: rd
            }

            if (circles.length >= 3) {
                var el = circles[circles.length - 3];
                var dist1 = Math.hypot(inters.x1 - el[0], inters.y1 - el[1]);
                var dist2 = Math.hypot(inters.x2 - el[0], inters.y2 - el[1]);
                if (dist1 < dist2) {
                    toReturn = {
                        x: inters.x2,
                        y: inters.y2,
                        rad: rd
                    }
                } else {
                    toReturn = {
                        x: inters.x1,
                        y: inters.y1,
                        rad: rd
                    }
                }
            }


            /*for (let index = 0; index < circles.length; index++) {
                var el = circles[index];
                var dist1 = Math.hypot(inters.x1 - el[0], inters.y1 - el[1]);
                var dist2 = Math.hypot(inters.x2 - el[0], inters.y2 - el[1]);
                if (dist1 - el[2] < 0) {
                    toReturn = {
                        x: inters.x2,
                        y: inters.y2,
                        rad: rd
                    }
                } else {
                    toReturn = {
                        x: inters.x1,
                        y: inters.y1,
                        rad: rd
                    }
                }
            }*/



            /*var getPointsAtDistance = function (x, y, dist) {
                var ary = [];
                for (let i = 0; i < Math.PI * 2; i += Math.PI / 360) {
                    var rd = i;
                    var ax = Math.sin(rd) * dist + x;
                    var ay = Math.cos(rd) * dist + y;
                    var xr = {
                        x: Math.floor(ax),
                        y: Math.floor(ay)
                    };
                    ary.push(xr);
                }
                return ary;
            }

            var points1 = getPointsAtDistance(x, y, dist);
            var points2 = getPointsAtDistance(x, y, dist);*/

            return toReturn;
        }

        if (circles.length == 0) {
            var x = 10;
            var y = goH - 10;
            bmd.circle(x, y, a, "rgba(10,10,10,1)");
            circles.push([x, y, a, []]);
        } else if (circles.length == 1) {
            var getxy = getClosePositionOneTouchWithRad();
            var x = getxy.x;
            var y = getxy.y;
            var a = getxy.rad;
            bmd.circle(x, y, a, "rgba(10,10,10,1)");
            circles.push([x, y, a, []]);
        } else {
            var getxy = getClosePositionTwoTouchWithRad(true);
            if (getxy) {
                var x = getxy.x;
                var y = getxy.y;
                var a = getxy.rad;
                if (drawModulated) {
                    var xp = getxy.x % goW;
                    var yp = getxy.y % goH;
                    var ap = getxy.rad;
                    if (xp < 0) {
                        xp += goW
                    }
                    if (yp < 0) {
                        yp += goH
                    }
                } else {
                    var xp = getxy.x;
                    var yp = getxy.y;
                }
                bmd.circle(xp, yp, a, getRandomCol()); //"rgba(10,10,10,1)");
                circles.push([x, y, a, []]);
                bmd.rect(0, 0, goW, goH, "rgba(255,255,255,0.02)");
            } else {
                bmd.rect(0, 0, goW, goH, "rgba(255,255,255,0.02)");
            }
        }

        g2a.game.time.events.add(Phaser.Timer.SECOND * 0.03, nextRun, this);

    };

    var run = function () {
        kissingCircles3Cross();
    };

    var nextRun = function () {
        if (runsArrayPosition >= runsArray.length) {
            runsArrayPosition = 0;
            //finishBr();
            //return;
        }
        var funct = runsArray[runsArrayPosition][0];
        var args = runsArray[runsArrayPosition][1];
        funct.apply(this, args);
        runsArrayPosition += 1;
    };

    var p = {};
    p.x = g2a.game.width / 2;
    p.y = g2a.game.height / 2;
    var runsArray = [
        [run, []]
    ];
    var runsArrayPosition = 0;

    nextRun();

    var randomSquared = function (nm) {
        var array = [];
        var number = nm;
        var average = 0;
        for (let index = 0; index < number; index++) {
            /*if(Math.random()>0.38) {
                array.push(Math.random()*Math.random());
            } else {
                array.push(Math.random());
            }*/
            var numberLength = Math.random();
            var rand = Math.random() * 1000;
            rand = rand - Math.floor(rand);
            array.push(rand);
        }
        var all = 0;
        for (let index = 0; index < array.length; index++) {
            all += array[index];
        }
        var average = all / number;
    };

    //randomSquared(1000);

};



//Definition of a circle object
function circle(a, b, r) {
    this.a = a;
    this.b = b;
    this.r = r;
}


function calculateCirclesIntersectionPoints(x1, y1, dist1, x2, y2, dist2) {
    // Calling function
    var circle1 = new circle(x1, y1, dist1);
    var circle2 = new circle(x2, y2, dist2);
    return twoCirclesIntersection(circle1, circle2);
}

function twoCirclesIntersection(c1, c2) {
    //**************************************************************
    //Calculating intersection coordinates (x1, y1) and (x2, y2) of
    //two circles of the form (x - c1.a)^2 + (y - c1.b)^2 = c1.r^2
    //                        (x - c2.a)^2 + (y - c2.b)^2 = c2.r^2
    //
    // Return value:   true if the two circles intersects
    //                 false if the two circles do not intersects
    //**************************************************************
    var val1, val2, test;
    // so their values can be used without return their values
    var x1, y1, x2, y2;
    // Calculating distance between circles centers
    var D = Math.sqrt((c1.a - c2.a) * (c1.a - c2.a) + (c1.b - c2.b) * (c1.b - c2.b));
    if (((c1.r + c2.r) >= D) && (D >= Math.abs(c1.r - c2.r))) {
        // Two circles intersects or tangent
        // Area according to Heron's formula
        //----------------------------------
        var a1 = D + c1.r + c2.r;
        var a2 = D + c1.r - c2.r;
        var a3 = D - c1.r + c2.r;
        var a4 = -D + c1.r + c2.r;
        var area = Math.sqrt(a1 * a2 * a3 * a4) / 4;
        // Calculating x axis intersection values
        //---------------------------------------
        val1 = (c1.a + c2.a) / 2 + (c2.a - c1.a) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
        val2 = 2 * (c1.b - c2.b) * area / (D * D);
        x1 = val1 + val2;
        x2 = val1 - val2;
        // Calculating y axis intersection values
        //---------------------------------------
        val1 = (c1.b + c2.b) / 2 + (c2.b - c1.b) * (c1.r * c1.r - c2.r * c2.r) / (2 * D * D);
        val2 = 2 * (c1.a - c2.a) * area / (D * D);
        y1 = val1 - val2;
        y2 = val1 + val2;
        // Intersection pointsare (x1, y1) and (x2, y2)
        // Because for every x we have two values of y, and the same thing for y,
        // we have to verify that the intersection points as chose are on the
        // circle otherwise we have to swap between the points
        test = Math.abs((x1 - c1.a) * (x1 - c1.a) + (y1 - c1.b) * (y1 - c1.b) - c1.r * c1.r);
        if (test > 0.0000001) {
            // point is not on the circle, swap between y1 and y2
            // the value of 0.0000001 is arbitrary chose, smaller values are also OK
            // do not use the value 0 because of computer rounding problems
            var tmp = y1;
            y1 = y2;
            y2 = tmp;
        }
        return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            intersects: true
        };
    } else {
        // circles are not intersecting each other
        return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            intersects: false
        };
    }
}

g2a.preload = function()
{};

g2a.create = function () {

    g2a.game.stage.backgroundColor = '#FFFDDB';
    g2a.game.stage.backgroundColor = '#FFFFFF';

    var bmd = g2a.game.add.bitmapData(g2a.game.width, g2a.game.height);
    bmd.addToWorld(0, 0);
    bmd.smoothed = false;

    /*g2a.game.input.onDown.add(function() {
        bmd.rect(0,0,g2a.game.width,g2a.game.height,"rgba(255,255,255,0.5)");
    });*/

    globalSpritesAndBmds = {
        bmd1: bmd
    };

    g2a.allPaintAlpha = 1;

    var taktGlobal = startOutSoundEb(g2a.game);
    taktGlobal.addAndStartTaktTimer();
    g2a.takt = taktGlobal;

    g2a.startBeat();

    var bmdborder = g2a.game.add.bitmapData(g2a.game.width, g2a.game.height);
    bmdborder.addToWorld(0, 0);
    bmdborder.smoothed = false;
    var borderCol = "rgba(10,10,10,1)";
    var borderWidth = 0.02;
    bmdborder.rect(0, 0, g2a.game.width * borderWidth, g2a.game.height, borderCol);
    bmdborder.rect(0, 0, g2a.game.width, g2a.game.height * borderWidth, borderCol);
    bmdborder.rect(g2a.game.width - (g2a.game.width * borderWidth), 0, g2a.game.width * borderWidth, g2a.game.height, borderCol);
    bmdborder.rect(0, g2a.game.height - (g2a.game.height * borderWidth), g2a.game.width, g2a.game.height * borderWidth, borderCol);
};

g2a.render = function () {

    if (g2a.game.input.activePointer.leftButton.isDown) {
        globalSpritesAndBmds.bmd1.rect(0, 0, g2a.game.width, g2a.game.height, "rgba(255,255,255,0.1)");
    }
    
}

var globalSpritesAndBmds = {
    bmd1 : {},
    sprite1 : {}
};
window.onload = function() {

    g2a.game = new Phaser.Game(
        g2a.w,
        g2a.h,
        Phaser.CANVAS,
        'phaser-container',
        { preload: g2a.preload, create: g2a.create, render: g2a.render }
        );

    g2a.update = function ()
    {
    }
}