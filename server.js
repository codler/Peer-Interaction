/*! Peer Interaction - v1.0.0 - 2013-05-16 - .
* Copyright (c) 2013 Han Lin Yap http://yap.nu */
var app = require('http').createServer(handler),
	io  = require('socket.io').listen(app),
	fs  = require('fs'),
	url = require('url'),
	_   = require('./libs/underscore-1.4.4.min.js');

var KeyCommand = require('./shared.js').KeyCommand;
var Player = require('./shared.js').Player;
var Room = require('./shared.js').Room;

app.listen(80);

// http server
function handler (req, res) {
	var filepath = url.parse(req.url).pathname;

	// Protection
	filepath.replace('..', '.');
	// TODO: check how it is in other OS.
	if (__dirname + filepath.replace('/', "\\") == __filename) {
		filepath = ''; 
	}

	if (filepath == '/') filepath = '/index.html';
	// Read file
	fs.readFile(__dirname + filepath,
	function (err, data) {
		if (err) {
			res.writeHead(404);
			return res.end('Error loading ' + filepath);
		}

		res.writeHead(200);
		res.end(data);
	});
}


var players = [];
var rooms = [];
var uuid = 1; // unique user id
var urid = 1; // unique room id
// Socket
io.sockets.on('connection', function (socket) {
	var player = new Player();
	socket.player = player;

	function disconnect() {
		console.log('disconnect');
		console.log(io.sockets.clients(player.room));
		if (player.room) {
			for (var i = io.sockets.clients(player.room).length - 1; i >= 0; i--) {
				if (io.sockets.clients(player.room)[i].player.nickname != player.nickname) {
					io.sockets.clients(player.room)[i].emit('pi-player-remove', player);
				}
			};
			socket.leave(player.room);
			var room = _.findWhere(rooms, {id: player.room });
			if (room) {
				var index = rooms.indexOf(room);
				if (index !== -1) {
					rooms.splice(index,1);
				}
			}
		}
		player.reset();

		var index = players.indexOf(player);
		if (index !== -1) {
			players.splice(index,1);
		}
	}
	socket.on('disconnect', disconnect);
	socket.on('pi-disconnect', disconnect);
	socket.on('pi-connect', function (data) {
		// Validate
		if (!_.isObject(data) || !_.isString(data.nickname)) return;

		// Nickname exists
		if (_.findWhere(players, {nickname: data.nickname })) {
			socket.emit('pi-connect-message', false);
		} else {
			player.nickname = data.nickname;
			players.push(player);
			socket.emit('pi-connect-message', data);
		}
	});
	socket.on('pi-connect-random', function() {
		var data = {};
		// Nickname exists
		do {
			data.nickname = 'PiPlayer' + (uuid++);
		} while (_.findWhere(players, {nickname: data.nickname }));

		player.nickname = data.nickname;
		players.push(player);
		socket.emit('pi-connect-message', data);
	});
	function join() {
		player.command.x = _.random(0, 200);
		player.command.y = _.random(0, 200);
		player.command.color = '#' + _.random(0, 255).toString(16) + _.random(0, 255).toString(16) + _.random(0, 255).toString(16);
	}
	socket.on('pi-create', function() {
		var rid = urid++;
		socket.join(rid);
		var room = new Room();
		room.id = rid;
		room.players.push(player);
		rooms.push(room);
		var data = {
			id: room.id
			,screen: 1
		};
		player.room = room.id;
		data.players = room.players;
		join();
		socket.emit('pi-room', data);
	});
	socket.on('pi-join', function(data) {
		console.log('pi-join')
		// Validate
		if (!_.isObject(data) || !_.isNumber(data.id) || !_.isNumber(data.screen)) return;

		socket.join(data.id);
		var room = _.findWhere(rooms, {id: data.id });
		if (!room) {
			console.log('room not found')
			room = new Room().setId(data.id);
			rooms.push(room);
		}
		room.players.push(player);
		console.log(room.players)
		player.room = room.id;
		data.players = room.players;
		join();
		socket.emit('pi-room', data);
		for (var i = io.sockets.clients(player.room).length - 1; i >= 0; i--) {
			if (io.sockets.clients(player.room)[i].player.nickname != player.nickname) {
				io.sockets.clients(player.room)[i].emit('pi-player-add', player);
			}
		};
	});
	socket.on('pi-player-command', function(data) {
		player.sendCommand(data.command, data.commandData);
		data.player = player;
		for (var i = io.sockets.clients(player.room).length - 1; i >= 0; i--) {
			if (io.sockets.clients(player.room)[i].player.nickname != player.nickname) {
				io.sockets.clients(player.room)[i].emit('pi-player-command', data);
			}
		};
	});
	socket.on('pi-player-broadcast', function(data) {
		for (var i = io.sockets.clients(player.room).length - 1; i >= 0; i--) {
			if (io.sockets.clients(player.room)[i].player.nickname != player.nickname) {
				io.sockets.clients(player.room)[i].emit('pi-player-broadcast', data);
			}
		};
	});
	socket.on('pi-rooms', function() {
		socket.emit('pi-rooms', io.sockets.manager.rooms);
	});

	socket.on('players', function() {
		socket.emit('players', players);
	});
	socket.on('join', function(room) {
		socket.join(''+room);
	});
	socket.on('leave', function(room) {
		socket.leave(''+room);
	});
});