var request = require('request');
var rgpio = require('rpi-gpio');
var rc522 = require("rc522");
var logger = require('./logger.js');

var accessKey = '098f6bcd4621d373cade4e832627b4f6'; // Access key given to you by the web app (http://locks.duttonbiz.com/)
var lockId = '1'; // Lock id to identify the lock for your setup
var codeArray = [];

var relayPin = 16;
rgpio.setup(relayPin, rgpio.DIR_OUT);

var sleepTime = 30000;
var lockOpenTime = 5000;

getCodeList();
setInterval(function() {
    //doHeartbeat();
    getCodeList();
}, sleepTime);

rc522(function(rfidNum) { // This is called everytime the reader sees a tag
    if (codeArray.indexOf(rfidNum) > -1) {
        logger.log('debug', 'index.js', 'RECOGNIZED rfid of ' + rfidNum + ' so Im letting them in');
        // some code to unlock the door
        setPin(relayPin, 0); // set the pin to low to trigger the relat
        setTimeout(function() {
            setPin(relayPin, 1);
            logger.log('debug', 'index.js', 'Locking the door again')
        }, lockOpenTime); // lock the door again after the set amount of time
        sendUnlockStatus('ALLOWED');
    } else {
        logger.log('debug', 'index.js', 'UNKNOWN rfid of ' + rfidNum + ' // blocking access');
        // some code to signal access denied
        sendUnlockStatus('BLOCKED');
    }
});


function setPin(pin, stat) {
    var value = false;
    if (stat == 1) { value = true; }
    rgpio.write(pin, value, function(err) {
        if (err) throw err;
        logger.log('debug', 'index.js', 'Set pin ' + pin + ' to ' + value);
    });
}

function getCodeList() {
    var command = 'GETLIST';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey + '&lockid=' + lockId;

    option = { method: 'GET', uri: url }
    request( option , function(err, res, body) {
        if( err != null ) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if(body != null) { 
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
    request( option , function(err, res, body) {
        if( err != null ) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if(body != null) { logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body); }
    });
}

function doHeartbeat() {
    var command = 'HEARTBEAT';
    var url = 'http://locks.duttonbiz.com/service.php?cmd=' + command + '&key=' + accessKey + '&lockid=' + lockId;
    option = { method: 'GET', uri: url }
    request( option , function(err, res, body) {
        if( err != null ) { logger.log('error', 'index.js', 'ERROR making call to: ' + option.uri + ' || ' + err.code); }
        if(body != null) { logger.log('info', 'index.js', 'Call to ' + option.uri + ' successful: ' + body); }
    });
}

logger.log('info', 'index.js', 'Ready and waiting...');

