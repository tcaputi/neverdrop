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

var serverOptions = {
	key: fs.readFileSync('./cert/test.key'),
	cert: fs.readFileSync('./cert/test.crt'),
	rejectUnauthorized: false,
	requestCert: true,
};

var server = neverDrop.createServer(serverOptions, function(socket){
	socket.on('data', function(data){
		console.log('server data: ', data.toString())
	});
	
	socket.on('message', function(data){
		console.log('server message: ', data);
	});
	
	socket.on('heartbeat', function(){
		console.log('server hb');
	});
	
	socket.write('hithere|poop');
	socket.noaccumulate();
	socket.write('here is a |lot of data');
	socket.write('plz no |accumulate');
	socket.accumulate();
	socket.write('jk u can start again');
});
server.listen(3547);

var socket = neverDrop.connect(clientOptions);
socket.on('error', function(e){
	console.log('error: ', e);
});

socket.on('message', function(data){
	console.log('client message: ', data);
});

socket.on('heartbeat', function(){
		console.log('client hb');
	});

socket.on('data', function(data){
	console.log('client data: ', data.toString());
});