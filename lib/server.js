var tls = require('tls');

var HEARTBEAT_STRING = 'hb';
var DELIMITER = '|';

module.exports.createServer = function(options, onSecureConnectCb){
	var server = tls.createServer(options, function(socket){
		var body = '';
		function onData(data){
			var string = data.toString();
			var index = 0;
			var startIndex = 0;
			while(index < string.length){
				if(string.charAt(index) === DELIMITER){
					if(string.charAt(index+1) === DELIMITER) index++
					else{
						body += string.substring(startIndex, index);
						socket.emit('message', body);
						body = '';
						index++;
						startIndex = index;
					}
				}
				index++;
			}
			body += string.substring(startIndex);
		}
		socket.on('data', onData);
		
		var oldRemoveAllListeners = socket.removeAllListeners;
		socket.removeAllListeners = function(event){
			oldRemoveAllListeners.call(socket, event);
			if(event === data) socket.addListener('data', onData);
		}
		
		var oldWrite = socket.write;
		socket.write = function(buf){
			//console.log('mw: ', buf.toString().replace(DELIMITER, DELIMITER + DELIMITER) + DELIMITER);
			oldWrite.call(socket, buf.toString().replace(DELIMITER, DELIMITER + DELIMITER) + DELIMITER);
		}
		//console.log('server write overwritten');
	
		if(onSecureConnectCb) onSecureConnectCb(socket);
	});
	
	return server;
}