var request = require('request');
var gpio = require("pi-gpio"); //https://www.npmjs.com/package/pi-gpio - There is some setup involved here!
//var rc522 = require("rc522/build/Release/rc522"); //https://www.npmjs.com/package/rc522 - setup involved here too!
//var rc522v1 = require("rc522-rfid-promise");
var rc522v2 = require("rc522");
var logger = require('./logger.js');

var accessKey = '098f6bcd4621d373cade4e832627b4f6'; // Access key given to you by the web app (http://locks.duttonbiz.com/)
var lockId = '1'; // Lock id to identify the lock for your setup
var codeArray = [];

var relayPin = 16;

var sleepTime = 30000;
var lockOpenTime = 5000;

setInterval(function() {
    //doHeartbeat();
    getCodeList();
}, sleepTime);

/*
rc522v1.startListening()
  .then(function(tagId){ 
    console.log('I see a tag of ' + tagId); 
})
  .catch(function(err) { console.log('Error reading tag:', err); });
*/

rc522v2(function(rfidSerialNumber) { // This is called everytime the reader sees a tag
    if (codeArray.indexOf(rfidSerialNumber) > 0) {
        logger.log('debug', 'index.js', 'RECOGNIZED rfid of ' + rfidSerialNumber + ' so Im letting them in');
        // some code to unlock the door
        setPin(relayPin, 0); // set the pin to low to trigger the relat
        setTimeout(setPin(relayPin, 1), lockOpenTime); // lock the door again after the set amount of time
        sendUnlockStatus('ALLOWED');
    } else {
        logger.log('debug', 'index.js', 'UNKNOWN rfid of ' + rfidSerialNumber + ' // blocking access');
        // some code to signal access denied
        sendUnlockStatus('BLOCKED');
    }
});


function setPin(pin, stat) {
    gpio.open(pin, "output", function(err) {		// Open pin for output 
        gpio.write(pin, stat, function() {			// Set pin high (1) low (0)
            gpio.close(pin);						// Close pin 
        });
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

logger.log('info', 'index.js', 'Ready and waiting...');

