Boards = new Mongo.Collection("boards");
Ideas = new Mongo.Collection("idea");

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
}

Router.configure({
  layoutTemplate: 'layout'
});

if (Meteor.isClient) {
	ClientID = window.localStorage.IdeaHuntClientID;
	if (!ClientID) {
		ClientID = uuid();
		window.localStorage.IdeaHuntClientID = ClientID;
	}
	
  Router.route('/', function() {
	  this.render("index");
		document.title = "Idea Hunt";
  });
  
  Router.route('/:board', function() {
	  var board = Boards.findOne({url: this.params.board});
	  if (board) {
		  this.render("board", {data: {
				board: board,
				ideas: function() {
					return Ideas.find({board: board.url}, {sort: {votes: -1}});
				}
			}});
			document.title = board.name + " — Idea Hunt";
	  } else if (board === null) {
		  this.render("404");
			document.title = "404 — Idea Hunt";
	  } else {
	  	this.render("loading");
	  }
  });
	
	Template.index.events({
		'click #create, keydown #name, keydown #description': function(event, template) {
			if (event.keyCode == 13 || event.keyCode === undefined) {
				var name = template.find("#name").innerText;
				var description = template.find("#description").innerText;
				if (name.length) {
					Meteor.call('createBoard', {name: name, description: description}, function(err, url) {
						console.log('result', url)
						if (url) {
							Router.go('/' + url);
						}
					});
				}
				return false;
			}
		}
	});
	
	Template.board.events({
		'click #add #create, keydown #add': function(event, template) {
			if (event.keyCode === undefined || event.keyCode == 13) {
				var text = template.find("#add .text").innerText;
				var author = template.find("#add .author").innerText;
				template.find("#add .text").innerText = '';
				Ideas.insert({board: this.board.url, text: text, author: author, votes: 0, voters: [], comments: []});
				return false;
			}
		}
	})
	
	Template.idea.events({
		'click .votes': function(event, template) {
			if (this.voters.indexOf(ClientID) == -1) {
					Ideas.update({_id: this._id}, {$push: {voters: ClientID}, $inc: {votes: 1}});
					} else {
						Ideas.update({_id: this._id}, {$pull: {voters: ClientID}, $inc: {votes: -1}});
					}
		}
	})
}

if (Meteor.isServer) {
  Meteor.startup(function () {
		Boards._ensureIndex({url: 1}, {unique: 1});
  });
}

Meteor.methods({
	createBoard: function(dict) {
		var url = encodeURI(dict.name.toLowerCase().replace(/ /g, "-"));
		var index = 1;
		if (Meteor.isServer) {
			while (1) {
				try {
					var tryUrl = url + (index == 1 ? '' : index);
					Boards.insert({
						url: tryUrl,
						name: dict.name,
						description: dict.description
					});
					return tryUrl;
				} catch (e) {
					index++;
				}
			}
		}
	}
})
