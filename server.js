var connect = require('connect'),
        app = connect.createServer(connect.static(__dirname + '/public')),
         io = require('socket.io').listen(app);

// Get the port from the command line argument.
// If it is not supplied then default to 8080.
// Since the index.html has to connect to a specific
// port I am not sure how to make that bit dynamic,
// unless writing out this port to a conf file,
// which gets read in by the html file, but ...
var port = process.argv[2] || 8080;

// Start up the app
app.listen(port)

// Create an object to store the active users in
var users = {};

// Have a set of colours to present each user differently.
// As users leave the room they free up that colour again
// and it can be reused.
var colours = ['red', 'blue', 'green', 'blueviolet', 'burlywood', 'cadetblue', 'chartreuse', 'coral'];

// The user list gets sorted twice - when a user joins and leaves
function sortUserList(users) {
    var sorted = [];
    for ( user in users )
        sorted.push(user);
	
    return sorted.sort();
}

// As connections come in deal with them here.
io.sockets.on('connection', function(client) {

    // When the user submits the nickname it gets processed here
    client.on('register', function(username){

        // This is definitely not the most in depth validation, but I thought 
        // instead of writing many lines to handle all possible cases I use
        // some more general cases.
        if ( username == '' || username == undefined || users[username] != undefined || username.length > 10 ) {
            client.emit('register', 'Username is not valid. Please try a different one.');
        } else {

	        // Keep the username for this session
	        client.username = username;	
	
            // Also add the user and the assigned colour in a global list for broadcasting to everyone
            users[username] = colours.shift();
			
            // Send out the updated user list
            // Sort it for better readability. Do this here so that each client does not have to do it.
            io.sockets.emit('userlist', users, sortUserList(users));
			
            // Tell everyone about the new user
	        client.broadcast.emit('useractivity', username, 'has joined this room.');
        }
    });

    // When a new message comes in from a user then send it to everyone.
    client.on('chatmessage', function (message) {
        
        // Tell all clients to run updatechat 
        io.sockets.emit('updatechat', client.username, users[client.username], message);
    });

    // A couple of things need to happen when a user disconnects
    client.on('disconnect', function() { 
		
        // Free up the user's colour so it can be reused.
        colours.push(users[client.username]);
		
        // Clear the user from the global list
        delete users[client.username];
		
        // Update the userlist for all clients. The list needs to be re-sorted.
        // Actually, maybe it doesn't, but there could be a race condition if new users join
        // at this point!?
        io.sockets.emit('userlist', users, sortUserList(users));
		
        // Tell everyone that this user is gone.
        io.sockets.emit('useractivity', client.username, ' has left this room');
    });
});
