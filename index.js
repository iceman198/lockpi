var request = require('request');
var rgpio = require('rpi-gpio');
var rc522 = require("rc522");
var logger = require('./logger.js');

var accessKey = '098f6bcd4621d373cade4e832627b4f6'; // Access key given to you by the web app (http://locks.duttonbiz.com/)
var lockId = '1'; // Lock id to identify the lock for your setup
var codeArray = ["1114"];
var shutdownCode = ["4321"];
var sleepTime = 30000;
var lockOpenTime = 5000;

var buzzerMelodyLocation = '/home/pi/lockpi/';

var relayPin = 12;

var buttonWatchInterval;
var buttonTimeoutRunning = false;
var buttonTimeout = 16000;
var buttonIntTime = 200;

var button1pin = 7;
var button1value = true;
var button2pin = 29;
var button2value = true;
var button3pin = 31;
var button3value = true;
var button4pin = 5;
var button4value = true;

var buttonCombo = '';

rgpio.setup(relayPin, rgpio.DIR_OUT);
rgpio.setup(button1pin, rgpio.DIR_IN);
rgpio.setup(button2pin, rgpio.DIR_IN);
rgpio.setup(button3pin, rgpio.DIR_IN);
rgpio.setup(button4pin, rgpio.DIR_IN);

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

/*setTimeout(function() { // have to delay this for some reason...something with fighting for the gpio on startup?
    unlockDoor(false);
    buzz(1000);
}, 1000);*/

function buzz(type) {
    logger.log('debug', 'index.js','Doing buzz type ' + type);
    if (type == 'UNLOCK_SUCCESS') {
        var exec  = require("child_process").exec ;
        exec ('python ' + buzzerMelodyLocation + 'unlock_success.py', function(error, stdout, stderr) {
            if (error) {
                logger.log('error','index.js','stderr from buzz type ' + type + ' is ' + stderr);
            } else {
                logger.log('debug','index.js','stdout from buzz type ' + type + ' is ' + stdout);
            }
        });
    }
    if (type == 'UNLOCK_FAIL') {
        var exec  = require("child_process").exec ;
        exec ('python ' + buzzerMelodyLocation + 'unlock_fail.py', function(error, stdout, stderr) {
            if (error) {
                logger.log('error','index.js','stderr from buzz type ' + type + ' is ' + stderr);
            } else {
                logger.log('debug','index.js','stdout from buzz type ' + type + ' is ' + stdout);
            }
        });
    }
    if (type == 'BUTTON_PRESS') {
        var exec  = require("child_process").exec ;
        exec ('python ' + buzzerMelodyLocation + 'buttonpress.py', function(error, stdout, stderr) {
            if (error) {
                logger.log('error','index.js','stderr from buzz type ' + type + ' is ' + stderr);
            } else {
                logger.log('debug','index.js','stdout from buzz type ' + type + ' is ' + stdout);
            }
        });
    }
}

function startButtonTimeout() {
    if (buttonTimeoutRunning == false) {
        buttonTimeoutRunning = true;
        setTimeout(function() {
            if (buttonTimeoutRunning) {
                logger.log('debug', 'index.js', 'Resetting buttonCombo');
                buttonCombo = '';
                buttonTimeoutRunning = false;
                buzz('UNLOCK_FAIL');
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
    if (value == false && buttonCombo.length <= 3) {
        //logger.log('debug', 'index.js', 'Button combo is ' + buttonCombo.length + ' characters');
        buzz('BUTTON_PRESS');
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
        unlockDoor(false);
        sendUnlockStatus('ALLOWED', code);
    } else if (shutdownCode.indexOf(code) > -1) {
        logger.log('info', 'index.js', 'SHUTDOWN code received, performing shutdown');
        unlockDoor(true);
        sendUnlockStatus('SHUTDOWN', code);
    } else {
        logger.log('debug', 'index.js', 'UNKNOWN code of ' + code + ' // blocking access');
        // some code to signal access denied
        buzz('UNLOCK_FAIL');
        sendUnlockStatus('BLOCKED', code);
    }
}

function unlockDoor(doshutdown) {
    buzz('UNLOCK_SUCCESS');
    setPin(relayPin, 1); // set the pin to low to trigger the relat
    setTimeout(function () {
        setPin(relayPin, 0);
        if (doshutdown == true) { 
            require('child_process').exec('shutdown now', function (msg) { console.log(msg) });
        }
        process.exit(0);
        logger.log('debug', 'index.js', 'Locking the door again');
    }, lockOpenTime); // lock the door again after the set amount of time
}

function setPin(pin, stat) {
    var value = false;
    if (stat == 1) { value = true; }
        rgpio.write(pin,  value,  function (err)  {
            if  (err)  throw  err;
            //logger.log('debug', 'index.js', 'Set pin ' + pin + ' to ' + value);
        });
}

function getCodeList() {
    var command = 'GETLIST';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey;

    option = { method: 'GET', uri: url }
    try {
	    request(option, function (err, res, body) {
		try {
			if (err != null) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
			if (body != null) {
			    logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body);
			    var json = JSON.parse(body);
			    codeArray = json.codeArr;
			}
		} catch(err) {
		    logger.log('error', 'index.js', 'error parsing web response: ' + err);
		}
	    });
    } catch(err) {
	    logger.log('error', 'index.js', 'error making web call: ' + err);
    }
}

function sendUnlockStatus(status, code) {
    var command = 'UNLOCK';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey + '&code=' + code + '&status=' + status;
    option = { method: 'GET', uri: url }
    request(option, function (err, res, body) {
        if (err != null) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if (body != null) { logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body); }
    });
}

function doHeartbeat() {
    var command = 'HEARTBEAT';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey;
    option = { method: 'GET', uri: url }
    request(option, function (err, res, body) {
        if (err != null) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if (body != null) { logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body); }
    });
}

function sleep(milliseconds) {
	var tempTime = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - tempTime) > milliseconds){
			break;
		}
	}
}
