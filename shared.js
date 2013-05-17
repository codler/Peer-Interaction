/*! Peer Interaction - v1.0.0 - 2013-05-16 - .
* Copyright (c) 2013 Han Lin Yap http://yap.nu */
var KeyCommand = function() {
	this.x = 0;
	this.y = 0;
	this.color;
};

KeyCommand.prototype.command = function(command, commandData) {
	switch(command) {
		case 'left': this.x--; break;
		case 'right': this.x++; break;
		case 'down': this.y++; break;
		case 'up': this.y--; break;
	};
};
KeyCommand.prototype.update = function(element) {
	if ( typeof module !== "object") {
		element.css({
			top: this.y
			,left: this.x
		})
	}
}

var Player = function() {
	this.nickname;
	this.room;
	this.command = new KeyCommand();

};
Player.prototype.setNickname = function(nickname) {
	this.nickname = nickname;

	if ( typeof module !== "object") {
		this.element = $('<div class="player">').attr('data-nickname', nickname);
		this.element.appendTo('#gamearea');
		//this.element.hide();
		this.element.text(nickname);
	}

	return this;
}
Player.prototype.sendCommand = function(command, commandData) {
	this.command.command(command, commandData);
	this.command.update(this.element);
}
Player.prototype.reset = function() {
	this.nickname = null;
	this.room = null;
	this.command = null;
};

var Room = function() {
	this.id;
	this.players = [];
};

Room.prototype.setId = function(id) {
	this.id = id;
	return this;
}
Room.prototype.addPlayers = function(players) {
	_.each(players, this.addPlayer, this);
}
Room.prototype.addPlayer = function(player) {
	if (!(player instanceof Player)) {
		if (_.isObject(player)) {
			var newPlayer = new Player().setNickname(player.nickname);
			this.players.push(newPlayer);
		} else {
			this.players.push(new Player().setNickname(player))
		}
	} else {
		this.players.push(player);
	}
}
Room.prototype.removePlayer = function(player) {
	var player = _.findWhere(room.players, {nickname: player.nickname });
	if (player) {
		var index = room.players.indexOf(player)
		room.players.splice(index, 1);
	}
}

if ( typeof module === "object" && typeof module.exports === "object" ) {
	module.exports = {
		KeyCommand: KeyCommand
		,Player: Player
		,Room: Room
	};
}