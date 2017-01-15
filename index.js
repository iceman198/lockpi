var request = require('request');
var rgpio = require('rpi-gpio');
var rc522 = require("rc522");
var logger = require('./logger.js');

var accessKey = '098f6bcd4621d373cade4e832627b4f6'; // Access key given to you by the web app (http://locks.duttonbiz.com/)
var lockId = '1'; // Lock id to identify the lock for your setup
var codeArray = [];
var sleepTime = 30000;
var lockOpenTime = 5000;

var relayPin = 16;
rgpio.setup(relayPin,  rgpio.DIR_OUT);

var buzzerPin = 13;
rgpio.setup(buzzerPin, rgpio.DIR_OUT);

var buttonWatchInterval;
var buttonTimeoutRunning = false;
var buttonTimeout = 10000;
var buttonIntTime = 200;

var button1pin = 7;
var button1value = true;
rgpio.setup(button1pin, rgpio.DIR_IN);
var button2pin = 29;
var button2value = true;
rgpio.setup(button2pin, rgpio.DIR_IN);
var button3pin = 31;
var button3value = true;
rgpio.setup(button3pin, rgpio.DIR_IN);
var button4pin = 5;
var button4value = true;
rgpio.setup(button4pin, rgpio.DIR_IN);

var buttonCombo = '';

/*
rgpio.on('change', function(channel, value) {
    console.log('Channel ' + channel + ' value is now ' + value);
});
rgpio.setup(button3pin, rgpio.DIR_IN, rgpio.EDGE_BOTH);
*/

function startButtonWatch() {
    buttonWatchInterval = setInterval(function () {
        rgpio.read(button1pin, function (err, value) {
            if (err) throw err;
            if (value !== button1value) {
                button1value = value;
                buttonChangeCall(1, value);
            }
            //logger.log('debug', 'index.js', 'The value of button1 is ' + value);
        });
        rgpio.read(button2pin, function (err, value) {
            if (err) throw err;
            if (value !== button2value) {
                button2value = value;
                buttonChangeCall(2, value);
            }
            //logger.log('debug', 'index.js', 'The value of button2 is ' + value);
        });
        rgpio.read(button3pin, function (err, value) {
            if (err) throw err;
            if (value !== button3value) {
                button3value = value;
                buttonChangeCall(3, value);
            }
            //logger.log('debug', 'index.js', 'The value of button3 is ' + value);
        });
        rgpio.read(button4pin, function (err, value) {
            if (err) throw err;
            if (value !== button4value) {
                button4value = value;
                buttonChangeCall(4, value);
            }
            //logger.log('debug', 'index.js', 'The value of button4 is ' + value);
        });
    }, buttonIntTime);
}

getCodeList();
setInterval(function () {
    //doHeartbeat();
    getCodeList();
}, sleepTime);

rc522(function (rfidNum) { // This is called everytime the reader sees a tag
    checkCode(rfidNum);
});

logger.log('info', 'index.js', 'Ready and waiting...');
startButtonWatch();
setTimeout(function() {
    unlockDoor();
    //buzz(1000);
}, 1000);

function buzz(time) {
    for (i = 0; i < 100; i++) {
        setTimeout(function() {
            setPin(buzzerPin, 1);
        }, i*10);
        setTimeout(function() {
            setPin(buzzerPin, 0);
        }, i*20);
    }
    /*
    setPin(buzzerPin, 1);
    setTimeout(function () {
        setPin(buzzerPin, 0);
        logger.log('debug', 'index.js', 'Buzzing for ' + time + ' miliseconds');
    }, time); // lock the door again after the set amount of time
    */
}

function startButtonTimeout() {
    if (buttonTimeoutRunning == false) {
        buttonTimeoutRunning = true;
        setTimeout(function() {
            if (buttonTimeoutRunning) {
                logger.log('debug', 'index.js', 'Resetting buttonCombo');
                buttonCombo = '';
                buttonTimeoutRunning = false;
            }
        }, buttonTimeout);
    }
}

function buttonChangeCall(button, value) {
    if (value == false) {
        buttonCombo = buttonCombo + '' + button;
        logger.log('debug', 'index.js', 'Button combo set to ' + buttonCombo);
        startButtonTimeout();
    }
    if (buttonCombo.length > 3) {
        logger.log('debug', 'index.js', 'Button combo has reached 4 characters...resetting');
        checkCode(buttonCombo);
        buttonCombo = '';
        buttonTimeoutRunning = false;
    }

}

function checkCode(code) {
    if (codeArray.indexOf(code) > -1) {
        logger.log('debug', 'index.js', 'RECOGNIZED code of ' + code + ' so Im letting them in');
        unlockDoor();
        sendUnlockStatus('ALLOWED');
    } else {
        logger.log('debug', 'index.js', 'UNKNOWN code of ' + code + ' // blocking access');
        // some code to signal access denied
        sendUnlockStatus('BLOCKED');
    }
}

function unlockDoor() {
    buzz(lockOpenTime);
    setPin(relayPin, 0); // set the pin to low to trigger the relay
    setTimeout(function () {
        setPin(relayPin, 1);
        logger.log('debug', 'index.js', 'Locking the door again');
    }, lockOpenTime); // lock the door again after the set amount of time
}

function setPin(pin, stat) {
    var value = false;
    if (stat == 1) { value = true; }
        rgpio.write(pin,  value,  function (err)  {
                if  (err)  throw  err;
        logger.log('debug', 'index.js', 'Set pin ' + pin + ' to ' + value);
        });
}

function getCodeList() {
    var command = 'GETLIST';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey + '&lockid=' + lockId;

    option = { method: 'GET', uri: url }
    request(option, function (err, res, body) {
        if (err != null) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if (body != null) {
            logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body);
            var json = JSON.parse(body);
            codeArray = json.codeArr;
        }
    });
}

function sendUnlockStatus(status) {
    var command = 'UNLOCK';
    var code = '';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey + '&lockid=' + lockId + '&code=' + code + '&status=' + status;
    option = { method: 'GET', uri: url }
    request(option, function (err, res, body) {
        if (err != null) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if (body != null) { logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body); }
    });
}

function doHeartbeat() {
    var command = 'HEARTBEAT';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey + '&lockid=' + lockId;
    option = { method: 'GET', uri: url }
    request(option, function (err, res, body) {
        if (err != null) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if (body != null) { logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body); }
    });
}

