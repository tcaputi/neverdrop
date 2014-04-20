var tls = require('tls');

var DELIMITER = '|';
var DOUBLEDELIMITER = '||';

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
					if(string.charAt(index+1) === DELIMITER) index++
					else{
						var incData = string.substring(startIndex, index).replace(/\|\|/g, DELIMITER);
						if(accFlag){
							body += incData;
							if(body === ''){ 
								socket.emit('heartbeat');
								socket.write('');
							}else if(body === 'neverdropnoacc') accFlag = false;
							else if(body === 'neverdropacc') accFlag = true;
							else {
								socket.emit('data2', incData);
								socket.emit('message', body);
							}
						}else{
							if(incData === ''){
								socket.emit('heartbeat');
								socekt.write('');
							}else if(incData === 'neverdropnoacc') accFlag = false;
							else if(incData === 'neverdropacc') accFlag = true;
							else socket.emit('data2', incData);
						}
						body = '';
						index++;
						startIndex = index;
					}
				}
				index++;
			}
			if(accFlag) body += string.substring(startIndex).replace(/\|\|/g, DELIMITER);
			if(body !== '') socket.emit('data2', body);
		}
		socket.on('data', onData);
		
		var oldRemoveAllListeners = socket.removeAllListeners;
		socket.removeAllListeners = function(event){
			oldRemoveAllListeners.call(socket, event);
			if(event === data) socket.addListener('data', onData);
		}
		
		var oldWrite = socket.write;
		socket.write = function(buf){
			oldWrite.call(socket, buf.toString().replace(DELIMITER, DOUBLEDELIMITER) + DELIMITER);
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