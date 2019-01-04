var fs = require('fs');
var logLevel = 'info';
var logFile = '/home/pi/lockpi/lockpi.log';

function writeToLogFile(text) {
	var fs = require('fs');
	fs.appendFile(logFile, text + '\n', function(err) {
		if(err) {
			return console.log('ERROR: ' + err);
		}
	}); 
	
	// get the file size
	var stats = fs.statSync(logFile);
	var fileSizeInBytes = stats["size"];
	var fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
	if (fileSizeInMegabytes > 5) {
		var newFileName = logFile + '.old';
		fs.rename(logFile, newFileName);
		fs.writeFile(logFile, getDateTime() + ' - File created', function(err) {
			if(err) {
				return console.log(err);
			}

			console.log("The file was saved!");
		}); 
	}
	//console.log('LogFile size: ' + fileSizeInMegabytes);
}

exports.log = function (level, desc, text) {
	var levelNum = 0;
	var logLevelNum = 0;
	
	if (level == 'all') {
		levelNum = 0;
	} else if (level == 'debug') {
		levelNum = 1;
	} else if (level == 'info') {
		levelNum = 2;
	} else if (level == 'error') {
		levelNum = 3;
	} else if (level == 'off') {
		levelNum = 4;
	}
	
	if (logLevel == 'all') {
		logLevelNum = 0;
	} else if (logLevel == 'debug') {
		logLevelNum = 2;
	} else if (logLevel == 'info') {
		logLevelNum = 2;
	} else if (logLevel == 'error') {
		logLevelNum = 3;
	} else if (logLevel == 'off') {
		logLevelNum = 4;
	}
	
	//console.log('logLevelNum: ' + logLevelNum + ' // levelNum passed: ' + levelNum);
	var mydate = getDateTime();
	var stringFile = '"' + mydate + '","' + desc + '","' + text + '"';
	var stringConsole = mydate + ' || ' + desc + ' || ' + text;
	if (logLevelNum <= levelNum) {
		console.log(stringConsole);
		writeToLogFile(stringFile);
	} else {
		console.log('NOT IN LOG ** ' + stringConsole);
	}
}

function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

	var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

	var mydate = year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
	return mydate;
}