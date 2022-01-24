(function($){

	var socket = io.connect('http://localhost:8080');
	var msgtpl = $('#msgtpl').html();
	var lastmsg= false;

	$('#msgtpl').remove();

	$('#loginform').submit(function(event){
		var ur=$('#newroom').val();
		event.preventDefault();
		//(document.getElementById(ur))?alert(ur+' existe déjà'):alert(ur+' existe pas');
		var chkd=$('input:checked').val();
		if(ur!=''&& !document.getElementById(ur)){
			socket.emit('usrroom', {
				name: ur
			});
			alert("salle : "+ur);
			event.preventDefault();
			socket.emit('login', {
			username : $('#username').val(),
			mail     : $('#mail').val(),
			room 	 : ur
			});

		} else if(document.getElementById(ur)){
			alert("la salle "+ur+" existe déjà");
			return false;

		} else {
			alert("salle "+chkd);
			event.preventDefault();
			socket.emit('login', {
			username : $('#username').val(),
			mail     : $('#mail').val(),
			room 	 : chkd
			});
		}

	})

	/**
	* On dit au serveur la salle créée ou choisie et vérifie si elle existe déjà
	**/

	socket.on('logged', function(){
		$('#login').fadeOut();
		$('#message').focus();


	});

	/**
	* Envois de message
	**/

	$('#form').submit(function(event){
		event.preventDefault();
		socket.emit('newmsg', {message: $('#message').val() });
		$('#message').val('');
		$('#message').focus();
	})

	/**
	* Message reçu depuis le serveur
	**/

	socket.on('newmsg', function(message){
		if(lastmsg != message.user.id){
			$('#messages').append('<div class="sep"></div>');
			lastmsg = message.user.id;
		}
		$('#messages').append('<div class="message">' + Mustache.render(msgtpl, message) + '</div>');
		$('#messages').animate({scrollTop : $('#messages').prop('scrollHeight') }, 500);

	});


	/**
	* Gestion des connectés
	**/

	socket.on('newusr', function(user){
		$('#users').append('<img src="' + user.avatar + '" id="' + user.id + '">');
	})

	socket.on('disusr', function(user){
		$('#' + user.id).remove();
	})

	/**
	* affichage des salles de chat
	**/

	socket.on('usrroom', function(room){
		$('<li><input type="radio" name="rooms[]" id="'+room.name+'" value="'+room.name+'">'+room.name+'</li>').insertAfter($('li:nth-child(1)'));
	})
})(jQuery);
