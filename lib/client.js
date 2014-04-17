var tls = require('tls');

var DELIMITER = '|';
var DOUBLEDELIMITER = '||';

//additional options
/*
reconnectTime: initial time between reconnect attempts, defaults to 3 seconds
reconnectGrow: factor to grow reconnectTime, defaults to 1
reconnectCap: max cap on reconnectTime, defaults to 30 seconds
heartbeatTimeout: time before heartbeats begin being sent, defaults to 30 seconds
*/
module.exports.connect = function(options, onConnectCb){
	var body = '';
	var reconnect = null;
	var socket;
	var heartbeatTimeout = options.heartbeatTimeout || 30000;
	var reconnectGrow = options.reconnectGrow || 1;
	var reconnectCap = options.reconnectCap || 30000;
	var reconnectTime = (options.reconnectTime || 3000)/reconnectGrow;;
	var currentReconnectTime = reconnectTime;
	
	function onSecureConnect(){
		clearTimeout(reconnect);
		reconnect = null;
		if(socket.authorized === true){
			socket.setNoDelay(true);
			socket.setTimeout(heartbeatTimeout);
			if(onConnectCb) onConnectCb();
		}else{
			console.log('error connecting to server');
			console.log(socket.authorizationError);
			socket.destroy();
		}
	}

	function onError(e){
		clearTimeout(reconnect);
		currentReconnectTime *= reconnectGrow;
		if(currentReconnectTime > reconnectCap) currentReconnectTime = reconnectCap;
		console.log(currentReconnectTime);
		reconnect = setTimeout(function(){
			socket.destroy();
			beginConnectionLoop();
		}, currentReconnectTime);
	}
	
	function onTimeout(){
		socket.write('');
	}
	
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
					body += string.substring(startIndex, index);
					if(body !== '') socket.emit('message', body);
					else socket.emit('heartbeat');
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
			socket.on('error', onError);
			socket.on('timeout', onTimeout);
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
				socket.on('error', onError);
				break;
			case 'timeout':
				socket.on('timeout', onTimeout);
				break;
			case 'data':
				socket.on('data', onData);
				break;
			}
		}
		
		var oldWrite = socket.write;
		socket.write = function(buf){
			oldWrite.call(socket, buf.toString().replace(DELIMITER, DOUBLEDELIMITER) + DELIMITER);
		}
	}
	beginConnectionLoop();	
	return socket;
}