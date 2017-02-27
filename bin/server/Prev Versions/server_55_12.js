var Server;
var login_server_host;
var content_server;

var version = "0.55.12";

var infoBroker = {
  init:function() {
		console.log("\ntimeBloc Main Server");
		console.log("Version: "+version);
    console.log("Written By: John Gregg");

		console.log("=====================================");
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
	      console.log("[Login Database Log] Database connected.");
        login.db.on('error', function(err) {
          if(err != null){
            console.log("[Login Database Log] Database disconnected.");
            login.init();
          } else {
            console.log("[Login Database Log] Unknown error.");
          }
        });
	    } else {
	      console.log("[Login Database Log] Database Failed to Initialize.");
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
			    console.log("[Content Database Log] Database connected.");

          content.db.on('error', function(err) {
            if(err != null){
              console.log("[Content Database Log] Database disconnected.");
              content.init();
            } else {
              console.log("[Content Database Log] Unknown error.");

            }
          });
			  } else {
			    console.log("[Content Database Log] Database Failed to Initialize.");
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
        var today = new Date();
            console.log("["+today.toLocaleTimeString()+"][CONTENT SERVER]("+ socket.request.connection.remoteAddress +") connected.");

            socket.on('request_userBloc', function(details){
										if(details.uid != -1){
											console.log('\t[request_userBloc] UID: ' + details.uid + " | CLIENT VERSION:" + details.version + "");
											content.db.query('SELECT version FROM user WHERE uid = ?', details.uid , function(err, rows, fields) {
												if(err == null){
													if(details.version != rows[0].version){
														content.db.query('SELECT * FROM user WHERE uid = ?', details.uid , function(err, rows, fields) {
															if(err == null){
																socket.emit('request_userBloc_info' , rows[0]);
																console.log("\t[request_userBloc] Sent "+rows[0].username.toUpperCase() +" profile.");
															}
														});
													} else {
														socket.emit('request_userBloc_uptoDate');
														console.log("\t[request_userBloc] Version is up to date.");
													}
													delete rows;
												} else {
													socket.emit('request_userBloc_failed' , "ERROR: USER NOT FOUND");
													socket.disconnect();
												}
											});
										} else {
											socket.emit('request_userBloc_failed' , "ERROR: USER NOT FOUND");
											socket.disconnect();
										}
             });

						socket.on('userBloc_update', function(details){
                   console.log('\t[userBloc_update] update user:' + details.uid);
									 details.version +=1;
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

            socket.on('photo_upload', function(details){
                  console.log('\t[photo_upload] User: ' +details.user+ ' uploaded photo.');
									var post={
											uid: details.userid,
											data:details.data
									};
									content.db.query('INSERT into media set ?', post , function(err, rows, fr) {
	 									if(err == null){
											content.db.query('SELECT mid from media where uid = ?', details.userid, function(err, id, fr) {
												if(err == null){
													console.log('\t               Mid: '+ id[id.length-1].mid +' Size: ' + (details.data.length/1000) + ' Kbytes');
													socket.emit('photo_upload_confirm', id[id.length-1].mid);
												} else {
													socket.disconnect();
												}
											});
	 									} else {
	 										socket.disconnect();
	 									}
	 								});
            });


						socket.on('media_request', function(details){
                  console.log('\t[media_request] MID: ' +details);
									content.db.query('SELECT data from media where mid = ?', details, function(err, rows, fr) {
										if(err == null){
                      if(rows.length > 0){
                        socket.emit('media_request_data', rows[0].data);
                        console.log('\t               SENT: Size: ' + ((rows[0].data.length)/1000) + ' Kbytes');

                      } else {
                        console.log('\t               ERROR: Media not found.');

                      }
										} else {
                      console.log('\t               ERROR: Media not found.');
										}
									});
            });

						socket.on('get_users_request', function(){
                    console.log('\t[get_users] User List Request');
										content.db.query('SELECT uid, display_name, username, version FROM user', function(err, rows, fields) {
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
              console.log("["+today.toLocaleTimeString()+"][CONTENT SERVER]("+ socket.request.connection.remoteAddress +') disconnected.');
            });
    });
  },

  initLoginServer:function() {
      login_server.on('connection', function(socket){
            var today = new Date();
            console.log("["+today.toLocaleTimeString()+"][LOGIN SERVER]("+ socket.request.connection.remoteAddress +") connected.");

            socket.on('login_request', function(details){
							if(details.client_version.includes(version)){
                console.log("\t[login_request] User Client Up to date.");
										login.db.query('SELECT * FROM user WHERE username = ?', details.username.toLowerCase() , function(err, rows, fields) {
											if(err == null && rows.length != 0){
												if(rows[0].password == details.password){
													console.log('\t[login_request] Login Succeeded: ' + details.username);
													content.db.query('SELECT * FROM user WHERE username = ?', details.username.toLowerCase() , function(err, rows, fields) {
														if(err == null){
															socket.emit('login_succeed' , rows[0]);
															console.log("\t[login_request] Sent user info.");
														}
													});
												} else {
													console.log('\t[ERROR] Login Failed: ' + details[0] + " - INVALID PASSWORD");
													socket.emit("login_failed", "Invalid Username or Password.");
													socket.disconnect();
												}
											} else {
												console.log('\t[ERROR] Login Failed: ' + details[0] + " - INVALID USERNAME");
												socket.emit("login_failed", "Invalid Username or Password.");
												socket.disconnect();
											}
										});
								} else {
                  console.log("\t[ERROR] User Client out to date: " + details.client_version);

									socket.emit("login_failed", "Version Out of Date.");
								}
             });

            socket.on('user_create_request', function(details){
                  console.log('\t[user_create_request] Login Create request: ' + details.username);
									var user = {username: details.username.toLowerCase(), password: details.password};
									login.db.query('INSERT INTO user SET ?', user , function(err, rows, fields) {
										if(err == null){
											console.log("\t[LOGIN DATABASE]: USER:" + details.username + " inserted.");
											login.db.query('SELECT uid FROM user WHERE username = ?', details.username , function(err, rows, fields) {
												if(err == null){
													var user = {uid: rows[0].uid,
																	username: details.username.toLowerCase(),
																	bio: "",
																	location: details.location.toUpperCase(),
																	profilePicture: -1,
                                  profileBackground: -2,
																	//profileBackground: -(Math.floor(Math.random() * 9)+1),
																 	display_name: details.display_name,
																	birthday: details.birthday,
																	version: 1,
																	theme:"light"};
													content.db.query('INSERT INTO user SET ?', user , function(err, rr, fr) {
														if(err == null){
															console.log("\t[CONTENT DATABASE]: USER:" + user.username + " inserted.");
														} else {
														}
													});
													socket.emit("user_create_request_succeed", rows[0].uid);
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
              console.log("["+today.toLocaleTimeString()+"][LOGIN SERVER]("+ socket.request.connection.remoteAddress +') disconnected.');
            });



    });
  }

};

infoBroker.init();
