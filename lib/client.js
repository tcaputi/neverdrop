var tls = require('tls');

var HEARTBEAT_STRING = 'hb';
var DELIMITER = '|';

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

module.exports.connect = function(options, onConnectCb){

	var body = '';
	var reconnect = null;
	var socket;
	var reconnectTime = 3000;
	
	function onSecureConnect(){
		clearInterval(reconnect);
		reconnect = null;
		if(socket.authorized === true){
			socket.setNoDelay(true);
			socket.setTimeout(30000);
			if(onConnectCb) onConnectCb();
		}else{
			console.log('error connecting to server');
			console.log(socket.authorizationError);
			socket.destroy();
		}
	}

	function onErrorOrTimeout(e){
		if(reconnect === null){
			reconnect = setInterval(function(){
				socket.destroy();
				beginConnectionLoop();
			}, reconnectTime);
		}
	}
	
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

	function beginConnectionLoop(){
		if(socket){
			var events = socket._events;
			socket = tls.connect(options);
			socket._events = events;
		}else{
			socket = tls.connect(options);
			socket.on('secureConnect', onSecureConnect);
			socket.on('error', onErrorOrTimeout);
			socket.on('timeout', onErrorOrTimeout);
			socket.on('data', onData);
		}
		
		var oldRemoveAllListeners = socket.removeAllListeners;
		socket.removeAllListeners = function(event){
			oldRemoveAllListeners.call(socket, event);
			switch(event){
			case 'secureConnect':
				socket.on('secureConnect', onSecureConnect);
				break;
			case 'error':
				socket.on('error', onErrorOrTimeout);
				break;
			case 'timeout':
				socket.on('timeout', onErrorOrTimeout);
				break;
			case 'data':
				socket.on('data', onData);
				break;
			}
		}
		
		var oldWrite = socket.write;
		socket.write = function(buf){
			//console.log('mw: ', buf.toString().replace(DELIMITER, DELIMITER + DELIMITER) + DELIMITER);
			oldWrite.call(socket, buf.toString().replace(DELIMITER, DELIMITER + DELIMITER) + DELIMITER);
		}
		//console.log('client write overwritten');
	}
	beginConnectionLoop();	
	return socket;
}