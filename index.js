var request = require('request');
var rc522 = require("rc522/build/Release/rc522");
var logger = require('./logger.js');

var accessKey = '098f6bcd4621d373cade4e832627b4f6';
var lockId = '1';
var codeArray = [];

var sleepTime = 30000;

setInterval(function() {
    doHeartbeat();
    getCodeList();
}, sleepTime);

rc522(function(rfidSerialNumber) { // This is called everytime the reader sees a tag
    console.log(rfidSerialNumber);
    if (codeArray.indexOf(rfidSerialNumber) > 0) {
        sendUnlockStatus('ALLOWED');
        // some code to unlock the door
    } else {
        sendUnlockStatus('BLOCKED');
        // some code to signal access denied
    }
});

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

            // loop through the returned list and replace what we have in memory
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


