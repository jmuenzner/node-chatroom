var io = require('socket.io-client'),
server = io.connect('http://localhost:8080');

server.on('connect', function (data) {

    console.log('Connected successfully.');

    // Register a user
	console.log('Registering user.')
    server.emit('register', 'jmuenzner'); 
});

server.on('userlist', function(users, sorted) {
	var i = 0;
	for (i; i<sorted.length; ++i) {
		console.log('User: ' + sorted[i] + ', Colour: ' + users[sorted[i]]);
	}
});

server.on('useractivity', function(user, message) {
	console.log('User: ' + user + ', Message: ' + message);
	
	server.emit('chatmessage', 'This is a test message.');
});

server.on('updatechat', function(user, colour, message) {	
	console.log('User: ' + user + ', Colour: ' + colour + ', Message: ' + message);
});
