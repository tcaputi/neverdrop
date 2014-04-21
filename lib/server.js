var tls = require('tls');

var DELIMITER = '\x04';

module.exports.createServer = function(options, onSecureConnectCb){
	var server = tls.createServer(options, function(socket){
		socket.setNoDelay(true);
		var body = '';
		var accFlag = true;
		
		function onData(data){
			var string = data.toString();
			var index = 0;
			var startIndex = 0;
			while(index < string.length){
				index = string.indexOf(DELIMITER, index);
				if(index === -1) break;
				else {
					var incData = string.substring(startIndex, index);
					body += incData;
					if(body === ''){
						socket.emit('heartbeat');
						socket.write('');
					}
					else if(body === 'neverdropnoacc') accFlag = false;
					else if(body === 'neverdropacc') accFlag = true;
					else{
						socket.emit('data2', incData);
						if(accFlag) socket.emit('message', body);
					}
					body = '';
					index++;
					startIndex = index;
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
			oldWrite.call(socket, buf.toString() + DELIMITER);
		}
		
		var oldAddListener = socket.addListener;
		socket.addListener = function(event, fnc){
			if(event === 'data' && fnc !== onData) event = 'data2';
			oldAddListener.call(socket, event, fnc);
		}
		socket.on = socket.addListener;
		
		socket.accumulate = function(){
			socket.write('neverdropacc');
		}
		
		socket.noaccumulate = function(){
			socket.write('neverdropnoacc');
		}
		
		if(onSecureConnectCb) onSecureConnectCb(socket);
	});
	return server;
}