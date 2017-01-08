var spawn = require('child_process').spawn;
var readline = require('readline');
var Q = require('q');
var child = null;

exports.startListening = function(timeout) {
  var deferred = Q.defer();
  var returnValue = 'none';
  var success = false;
  child = spawn("node", [__dirname + "/" + "rc522_output.js"]);
  var linereader = readline.createInterface(child.stdout, child.stdin);

  linereader.on('line', function(rfidTagSerialNumber) {
    success = true;
    returnValue = rfidTagSerialNumber;
    endRead();
  });

  child.on('close', function(code) {
    if (success)
      deferred.resolve(returnValue);
    else
      deferred.reject();
  });

  function endRead() {
    if (child != null)
      child.kill();
  }

  if (typeof timeout === 'number') {
    setTimeout(function() {
      if (deferred.promise.inspect().state === 'pending') {
        success = false;
        endRead('none');
      }
    }, timeout);
  }

  return deferred.promise;
}

exports.stopListening = function() {
  if (child != null)
    child.kill();
}


// SIGTERM AND SIGINT will trigger the exit event.
process.once("SIGTERM", function() {
  process.exit(0);
});
process.once("SIGINT", function() {
  process.exit(0);
});

// And the exit event shuts down the child.
process.once("exit", function() {
  if (child != null)
    child.kill();
});

// This is a somewhat ugly approach, but it has the advantage of working
// in conjunction with most of what third parties might choose to do with
// uncaughtException listeners, while preserving whatever the exception is.
process.once("uncaughtException", function(error) {
  // If this was the last of the listeners, then shut down the child and rethrow.
  // Our assumption here is that any other code listening for an uncaught
  // exception is going to do the sensible thing and call process.exit().
  if (process.listeners("uncaughtException").length === 0) {
    if (child != null)
      child.kill();
    throw error;
  }
});