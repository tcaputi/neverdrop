var neverDrop = require('./../neverdrop.js');
var fs = require('fs');

var clientOptions = {
	host: 'localhost',
	port: 3547,
	reconnectGrow: 2,
	heartbeatTimeout: 3000,
	reconnectCap: 7000,
	reconnectTime: 1000,
	rejectUnauthorized: false,
	ca: [fs.readFileSync('./cert/test.crt')],
	requestCert: true,
	agent: false
}
/*
var serverOptions = {
	key: fs.readFileSync('./cert/test.key'),
	cert: fs.readFileSync('./cert/test.crt'),
	rejectUnauthorized: false,
	requestCert: true,
};

var server = neverDrop.createServer(serverOptions, function(socket){
	socket.on('heartbeat', function(){
		console.log('server: hb')
	});
	
	for(var i=0; i<100; i++){
		socket.write(i);
	}
});
server.listen(3547);
*/
var socket = neverDrop.connect(clientOptions);
socket.on('error', function(e){
	console.log('error: ', e);
});

socket.on('message', function(data){
	console.log('message: ', data);
});

socket.on('heartbeat', function(){
	console.log('client: hb')
});