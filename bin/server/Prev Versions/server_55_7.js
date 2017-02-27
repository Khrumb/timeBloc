var Server;
var login_server_host;
var content_server;

var version = "0.55.7";

var infoBroker = {
  init:function() {
    console.log("[Database Log] Setup");
    login.init();
    content.init();
    server_manager.init();
  }
};

var login = {

  init:function functionName() {
		var mysql  = require('mysql');
		login.db = mysql.createConnection({
  		host     : 'localhost',
  		user     : 'infoBroker',
  		password : 'TJdPo5yMPz<Bl#a',
  		database : 'timeBloc_login_database',
			multipleStatements: true
		});
		login.db.connect(function(err) {
			if(err == null){
	      console.log("[Database Log] Login Database Active.");
	    } else {
	      console.log("[Database Log] Login Database Failed to Initialize.");
	    }
		});
  },

  db:null
};

var content = {

    init:function functionName() {
			var mysql  = require('mysql');
			content.db = mysql.createConnection({
				host     : 'localhost',
				user     : 'infoBroker',
				password : 'TJdPo5yMPz<Bl#a',
				database : 'timeBloc_content_database',
				multipleStatements: true
			});
			content.db.connect(function(err) {
				if(err == null){
			    console.log("[Database Log] Content Database Active.");
			  } else {
			    console.log("[Database Log] Content Database Failed to Initialize.");
			  }
			});


    },

    db:null
};

var server_manager = {

  init:function() {
    console.log("[Server log] Startup");
    Server = require('socket.io');
    login_server =  new Server(750);
    server_manager.initLoginServer();
    console.log("[Login Server] Listening *:750");
    content_server = new Server(700);
    server_manager.initContentServer();
    console.log("[Content Server] Listening *:700");
  },

  initContentServer:function() {
    content_server.on('connection', function(socket){
            console.log("[CONTENT SERVER] User: ("+socket.id +") connected.");

						socket.on('version_verify', function(message){
										if(message == version){
											socket.emit('correct_version');
											console.log('\t[version_verify] Correct Version.');
										} else {
											socket.emit('incorrect_version');
											console.log('\t[version_verify] INCORRECT Version: ' + message);
										}
             });

            socket.on('request_userBloc', function(details){
                    var today = new Date();
                    console.log('\t[request_userBloc] userBloc request:[ UID: ' + details.uid + " | CLIENT VERSION:" + details.version + " ]");
										content.db.query('SELECT version FROM user WHERE uid = ?', details.uid , function(err, rows, fields) {
											if(err == null){
												if(details.version != rows[0].version){
													content.db.query('SELECT * FROM user WHERE uid = ?', details.uid , function(err, rows, fields) {
														if(err == null){
															socket.emit('request_userBloc_info' , rows[0]);
															console.log("\t[request_userBloc_info] Sent user info.");
														}
													});
												} else {
													socket.emit('request_userBloc_uptoDate');
													console.log("\t[request_userBloc_uptoDate] Version is up to date.");
												}
												delete rows;
											} else {
												socket.emit('request_userBloc_failed' , "ERR: USER NOT FOUND");
												socket.disconnect();
											}
										});
             });

						socket.on('userBloc_update', function(details){
                   var today = new Date();
                   console.log('\t[userBloc_update] update user:' + details.uid);
									 delete details.theme;
									 details.version +=1;
									 console.log(details.version);
									 details.username = details.username.toLowerCase();
									 details.location = details.location.toUpperCase();
 									 content.db.query('UPDATE user set ? WHERE uid = ?', [details , details.uid] , function(err, rows, fields) {
 										if(err == null){
 											socket.emit('update_user_succeed');
 										} else {
											console.log("\tUpdate Failed.");
											console.log(err);
 											socket.disconnect();
 										}
 									});
            });

						socket.on('get_users_request', function(){
                    console.log('\t[get_users] User List Request');
										content.db.query('SELECT uid, display_name FROM user', function(err, rows, fields) {
											if(err == null){
												socket.emit('get_users_succeed' , rows);
											} else {
												socket.emit('get_users_failed' , err);
											}
										});
             });


						socket.on('get_follower_info', function(user){
                console.log('\t[get_follower_info] User: '+user);
								var post = [user, user];
 								content.db.query('Select user,followed from follower_list where user = ? OR followed = ?', post , function(err, rows, fr) {
 									if(err == null){
 										socket.emit('get_follower_info_return', rows);
 									} else {
 										socket.disconnect();
 									}
 								});
             });

						socket.on('follow', function(details){
                  console.log('\t[follow] User: '+details.user+' Followed User: '+details.followed);
									var post = { user: details.user,
													followed: details.followed
												};
									content.db.query('INSERT INTO follower_list SET ?', post , function(err, rr, fr) {
										if(err == null){
											socket.emit('follow_confirmed');
										} else {
											socket.disconnect();
										}
									});
            });

						socket.on('unfollow', function(details){
                  console.log('\t[unfollow] User: '+details.user+' unFollowed User: '+details.followed);
									var post = [details.user, details.followed];
									content.db.query('DELETE FROM follower_list where USER = ? and FOLLOWED = ?', post , function(err, rr, fr) {
										if(err == null){
											socket.emit('unfollow_confirmed');
										} else {
											socket.emit('unfollow_failed');
										}
									});
            });

            socket.on('disconnect', function() {
              console.log('[CONTENT SERVER] User: ('+ socket.id +') disconnected.');
            });
    });
  },

  initLoginServer:function() {
      login_server.on('connection', function(socket){
            console.log("[LOGIN SERVER] User: ("+socket.id +") connected.");

            socket.on('login_request', function(details){
                    var today = new Date();
										login.db.query('SELECT * FROM user WHERE username = ?', details.username , function(err, rows, fields) {
											if(err == null && rows.length != 0){
												if(rows[0].password == details.password){
													console.log('\t[login_request] Login Succeeded: ' + details.username);
													content.db.query('SELECT * FROM user WHERE username = ?', details.username , function(err, rows, fields) {
														if(err == null){
															socket.emit('login_succeed' , rows[0]);
															console.log("\t[login_request] Sent user info.");
														}
													});
												} else {
													console.log('\t[ERROR] Login Failed: ' + details.username + " - INVALID PASSWORD");
													socket.emit("login_failed", "INVALID PASSWORD");
													socket.disconnect();
												}
											} else {
												console.log('\t[ERROR] Login Failed: ' + details[0] + " - INVALID USERNAME");
												socket.emit("login_failed", "INVALID USERNAME");
												socket.disconnect();
											}
										});
             });

            socket.on('user_create_request', function(details){
                  var today = new Date();
                  console.log('\t[user_create_request] Login Create request: ' + details.username);
									var user = {username: details.username.toLowerCase(), password: details.password};
									login.db.query('INSERT INTO user SET ?', user , function(err, rows, fields) {
										if(err == null){
											console.log("\t[LOGIN DATABASE]: USER:" + details.username + " inserted.");
											login.db.query('SELECT uid FROM user WHERE username = ?', details.username , function(err, rows, fields) {
												if(err == null){
													user = {uid:rows[0].uid,
																	username: details.username.toLowerCase(),
																	bio: "",
																	location: details.location.toUpperCase(),
																	profilePicture: "assets/default_profile_picture.jpg",
																	profileBackground: "assets/default_profile_background.jpg",
																 	display_name: details.display_name,
																	birthday: details.birthday,
																	version: 0};
													content.db.query('INSERT INTO user SET ?', user , function(err, rr, fr) {
														if(err == null){
															console.log("\t[CONTENT DATABASE]: USER:" + user.username + " inserted.");
														} else {
														}
													});
													socket.emit("user_create_request_succeed", rows[0].uid );
													} else {
					                socket.emit("user_create_request_failed", "");
					              }
											});
										} else {
											console.log('\t[ERROR]:USERNAME TAKEN');
			                socket.emit("user_create_request_failed", "");
			              }
									});
            });
            socket.on('disconnect', function() {
              console.log('[LOGIN SERVER] User: ('+ socket.id +') disconnected.');
            });



    });
  }

};

infoBroker.init();
