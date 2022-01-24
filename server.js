const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const md5 = require('MD5');

console.log("Server started on port 8080");

httpServer = http.createServer(function (req, res) {
	console.log("Utilisateur connecté");

  // parse URL
  const parsedUrl = url.parse(req.url);
  // extract URL path
  let pathname = `.${parsedUrl.pathname}`;
  // based on the URL path, extract the file extension. e.g. .js, .doc, ...
  const ext = path.parse(pathname).ext;
  // maps file extension to MIME typere
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };

  fs.exists(pathname, function (exist) {
    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // if is a directory search for index file matching the extension
    if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', map[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });


});
httpServer.listen(8080);
var io = require('socket.io').listen(httpServer);

// Initialisation
rooms = [];

function newroom(nom, key) {
  var objet = {
    nom: nom,
    user: [],
    message: []
  };
  rooms[key] = objet;

}

newroom("public", "public");

var room = [];
var history = 15;


/**
 * On vient de se connecter dans le chat
 **/
io.sockets.on('connection', function(socket) {

  var me = false;
  console.log('User connecté');
  for (var l in room) {
    console.log(room[l].name);
  }
  for (var k in room) {
    socket.emit('usrroom', room[k]);
  }

  /**
   * On a reçu un message
   **/
  socket.on('newmsg', function(message) {
    // Si le message est vide on ne fait rien
    if (message.message.length <= 1 | message.message.length >= 1000) {
      return false;
    }
    message.user = me;
    date = new Date();
    message.h = date.getHours();
    message.m = date.getMinutes();
    rooms[me.key].message.push(message); //ici
    if (rooms[me.key].message.length > history) {
      rooms[me.key].message.shift();
    }

    io.sockets.in(me.room).emit('newmsg', message);
  });

  /**
   * Je me connecte
   **/
  socket.on('login', function(user) {
    me = user;
    me.id = md5(user.mail); // On génère une clef unique par utilisateur (basé sur le mail)
    me.avatar = 'http://www.gravatar.com/avatar/' + me.id + '?s=50';
    me.room = user.room;
    if (me.room != "public") {
      me.key = md5(me.room);
    } else {
      me.key = "public";
    } // la clé qui servira à se connecter à une salle
    socket.emit('logged');
    socket.join(me.room);
    rooms[me.key].user[me.id] = me;
    socket.broadcast.to(me.room).emit('newusr', me);
    for (var k in rooms[me.key].user) { //ici
      socket.emit('newusr', rooms[me.key].user[k]);
    }
    for (var k in rooms[me.key].message) {
      socket.emit('newmsg', rooms[me.key].message[k]);
    }

  });

  /**
   * Je quitte le tchat
   **/
  socket.on('disconnect', function() {
    console.log('User déconnecté');
    if (!me) {
      return false;
    }
    delete rooms[me.key].user[me.id];
    for (var t in rooms[me.key].user) {
      k++;
    }
    if (k == 0) {
      delete rooms[me.key];
      for (var l in room) {
        (room[l].name == me.room) ? delete room[l]: 1 + 1;
      }
    }
    io.sockets.in(me.room).emit('disusr', me);
  })

  /**
   * création des salles
   **/
  socket.on('usrroom', function(usrroom) {
    room.push(usrroom); //sert à afficher toutes les salles existantes
    console.log('Un utilisateur a créé la salle ' + usrroom.name);
    newroom(usrroom.name, md5(usrroom.name));
    socket.emit('usrroom', usrroom);
  })

});
