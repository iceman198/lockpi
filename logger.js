var fs = require('fs');
var logLevel = 'info';
var logFile = 'lockpi.log';

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
		fs.writeFile(logFile, new Date() + ' - File created', function(err) {
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
	
	var stringFile = '"' + new Date() + '","' + desc + '","' + text + '"';
	var stringConsole = + new Date() + ' || ' + desc + ' || ' + text;
	if (logLevelNum <= levelNum) {
		console.log(stringConsole);
		writeToLogFile(stringFile);
	} else {
		console.log('NOT IN LOG ** ' + stringConsole);
	}
}