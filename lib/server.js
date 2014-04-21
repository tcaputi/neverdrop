var tls = require('tls');

var DELIMITER = '\x04';

module.exports.createServer = function(options, onSecureConnectCb){
	var server = tls.createServer(options, function(socket){
		socket.setNoDelay(true);
		var body = '';
		var msgFlag = false;
		
		function onData(data){
			var string = data.toString();
			var index = 0;
			var startIndex = 0;
			while(index < string.length){
				index = string.indexOf(DELIMITER, index);
				if(index === -1) break;
				else {
					body += string.substring(startIndex, index);;
					if(body === ''){
						socket.emit('heartbeat');
						socket.write('');
					}else if(body === 'neverdropmsg') msgFlag = true;
					else{
						socket.emit('data2', body);
						if(msgFlag) {
							socket.emit('message', body);
							msgFlag = false;
						}
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
		
		socket.message = function(string){
			socket.write('neverdropmsg');
			socket.write(string);
		}
		
		if(onSecureConnectCb) onSecureConnectCb(socket);
	});
	return server;
}