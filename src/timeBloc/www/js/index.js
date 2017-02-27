var touches = [];
var first_touch;

var width;
var height;
var movement;

var page_log = [];
var page_log_uid = [];
var page_log_bid = [];
var page_log_mid = [];
var current_page = null;

var uid = -1;
var comment_number = 0;

var timer;

var online = true;
var server_online = true;
var sidebar_isOn = false;
var block_Reload = false;

var version = "0.55.12.3";

//DEV_SERVER
var server = "http://10.0.0.2";

//PORTS FOR DEV SERVER
//var login_server = server + ":650";
//var content_server = server + ":600";

//LIVE_SERVER
//var server = "http://98.236.77.7";

//PORTS FOR LIVE SERVER
var login_server = server + ":750";
var content_server = server + ":700";


var db;

var app = {

	    initialize: function() {
	        this.bindEvents();
	    },

	    bindEvents: function() {
	        document.addEventListener('DeviceReady', this.onDeviceReady, false);
	        document.addEventListener('backbutton', this.onBackKeyDown, false);
	        document.addEventListener('Online', this.onlineCheck, false);
	        document.addEventListener('Offline', this.offlineCheck, false);
					document.addEventListener('Pause', this.onPause, false);
					document.addEventListener('Resume', this.onResume, false);
	    },

	    onDeviceReady: function() {
				uiControl.setDebugger();
				uiControl.updateDebugger("build", "pre-alpha");
				uiControl.updateDebugger("version", version);
				dataManager.initialize();
	    },

			deviceReadyCallBack:function() {
				page_log.pop();

				blocFeed.setup();
				//bloc.setup(1);
				//alert("setup called");
				setTimeout(function () {
					document.getElementById('base').style.display = "none";
				}, 200);
			},

			onBackKeyDown: function() {
				if(login.created){
					document.getElementById('login_content').style.display = 'block';
					document.getElementById('account_content').style.display = 'none';
					login.created = false;
				} else if(sidebar_isOn){
					sidebar.slide();
				} else if(!bloc.mediaIsOut && bloc.wasToggled){
					if(bloc.container_animation != null){
						clearInterval(bloc.container_animation);
						bloc.c_pos = -width;
						bloc.slide_step = width/18;
						bloc.container_animation = setInterval(bloc.mediaOut, 6);
					}
				}else if(page_log.length > 1){
					current_page = page_log.pop();
					if(page_log[page_log.length-1] == 'userBloc' && current_page == 'userBloc'){
					 page_log_uid.pop();
					}
					switch (current_page) {
						case "calander":
							calander.c_pos = -width;
							calander.slide_step = Math.floor(width/25);
							calander.slide_animation = setInterval(calander.popIn, 6);
							current_page = null;
							break;
						case "personalPage":
							uiControl.setTheme(userBloc.c_user.theme);
							dataManager.getMedia(userBloc.c_user.profileBackground, 'userBloc');
							dataManager.getMedia(userBloc.c_user.profilePicture, 'user_Profile_Picture');
							document.getElementById('user_Display_Name').textContent = userBloc.c_user.display_name;
							document.getElementById('user_bio').textContent = userBloc.c_user.bio;
							personalPage.taredown();
							current_page = null;
							break;
						case "fullScreenMedia":
							fullScreenMedia.taredown();
							current_page = null;
							break;
						case "dialog":
							uiControl.select(-2);
							current_page = null;
							break;
						default:
						//uiControl.updateDebugger("pl", current_page);

						var id = page_log[page_log.length-1];
						switch (id) {
							case 'blocFeed':
									blocFeed.setup();
									break;
							case 'calander':
							case 'userBloc':
									page_log.pop();
									userBloc.setup(page_log_uid.pop());
									break;
							case 'personalPage':
									personalPage.setup();
									break;
							case 'bloc':
									bloc.setup(page_log_bid.pop());
									break;
							case 'founders':
									founders.setup();
									break;
							default:
								alert("PAGE_SETUP_UNHANDLED: "+id);
						}
					}
				} else {
					if(confirm("Are you sure you want to exit?")){
						navigator.app.exitApp();
					}
				}
			},

			onlineCheck:function(){
				online = true;
			},

			offlineCheck:function(){
				online = false;
			},

			onPause:function() {
				if(!block_Reload){
					setTimeout(function () {
						document.getElementById('base').style.display = "block";
						document.getElementById('navbar_menu_button').style.opacity =0.0;
						document.getElementById('navbar_menu_button').ontouchstart = "";
					}, 400);
				}
			},

			onResume:function() {
				if(!block_Reload){
					db.transaction(function(tx){
						tx.executeSql('SELECT * FROM personal', [], function(tx, results) {
							network.sendLoginRequest(results.rows.item(0).username, results.rows.item(0).session_key, app.onResumeCallBack);
						}, dataManager.errorCB);
					}, dataManager.errorCB);
				}
			},

			onResumeCallBack:function functionName() {
				setTimeout(function () {
					document.getElementById('base').style.display = "none";
				}, 400);
			}
};

var network = {

	sendLoginRequest_recieved: true,
	sendLoginRequest:function(uname, pword, callback) {
		if(network.sendLoginRequest_recieved){
			network.sendLoginRequest_recieved = false;
			document.getElementById('login_error').textContent = "Logging in...";
			document.getElementById('login_error').style.display = "block";
			document.getElementById('login_error').style.color = "gray";
			var socket = io(login_server);
			socket.on('connect', function () {
				var post = {
					username:uname,
					password:pword,
					client_version: version
				};
				socket.emit("login_request", post);
			 });

			 socket.on('login_succeed', function (message) {
 				socket.disconnect();
				document.getElementById('login_error').style.color = "rgba(113,244,182,0.8)";
				uid = parseInt(message.uid);
				db.transaction(function(tx) {
					tx.executeSql('DELETE FROM user WHERE uid = '+ message.uid);
					tx.executeSql('INSERT INTO personal(username, session_key) VALUES ("'+ document.getElementById('login_username').value +'",'+dataManager.toHashCode(document.getElementById('login_password').value)+')');
					tx.executeSql('INSERT INTO user(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground, version) VALUES ('+message.uid+', "'+message.username+'", "'+message.display_name+'", "'+message.bio+'", "'+message.theme+'", "'+message.birthday+'", "'+message.location+'", "'+message.date_joined+'", "'+message.profilePicture+'", "'+message.profileBackground+'", '+message.version+')');
					tx.executeSql('SELECT username, display_name, profilePicture FROM user where uid = '+ uid, [], login.populateUserElements, dataManager.errorCB);
				}, dataManager.errorCB);
				document.getElementById('navbar_menu_button').style.opacity =1.0;
				document.getElementById('navbar_menu_button').ontouchstart = sidebar.slide;
				network.sendLoginRequest_recieved = true;
				callback.call();
 			 });

			 socket.on('login_failed', function (msg) {
				socket.disconnect();
				db.transaction(function(tx){
					tx.executeSql('DROP TABLE IF EXISTS user');
					tx.executeSql('DROP TABLE IF EXISTS bloc_temp');
					tx.executeSql('DROP TABLE IF EXISTS follower_list');

					tx.executeSql('CREATE TABLE IF NOT EXISTS personal(username, session_key)');
					tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Primary Key ASC, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground, version)');
					tx.executeSql('CREATE TABLE IF NOT EXISTS bloc_temp (uid Refrences USER uid, message, posted_time)');
					tx.executeSql('CREATE TABLE IF NOT EXISTS follower_list (user Refrences USER uid, followed Refrences USER uid)');
				}, dataManager.errorCB);
				page_log = [];
				page_log_bid = [];
				page_log_uid = [];
				if(page_log[page_log.length-1] != "login"){
					uiControl.turnCurrentItemOff();
					login.setup();
				}
				document.getElementById('login_error').style.color = "red";
				document.getElementById('login_error').style.display = "block";
				document.getElementById('login_error').textContent = msg;
				login.loginFailed();
				network.sendLoginRequest_recieved = true;
 			 });

			 socket.on('reconnecting', function () {
				 socket.disconnect();
				 document.getElementById('connection_message').textContent = "Trying Backup Server...";
				 if(server == "http://98.236.77.7"){
					 server = "http://10.0.0.2";
				 } else {
					 server = "http://98.236.77.7";
				 }
				 login_server = server + ":750";
				 content_server = server + ":700";
				 network.sendLoginRequest_recieved = true;
				 network.sendLoginRequest(uname, pword, callback);
 			 });


		} else {
			document.getElementById('login_error').textContent = "Request Sent, Waiting on Server.";
			document.getElementById('login_error').style.display = "block";
		}
	},

	sendCreateUserRequest_recieved:true,
	sendCreateUserRequest:function(uname, pword, dispname, loc, bday) {
		if(network.sendCreateUserRequest_recieved){
			network.sendCreateUserRequest_recieved = false;
			var socket = io(login_server);
			socket.on('connect', function () {
				var post = {
					username:uname,
					password:pword,
					display_name:dispname,
					location:loc,
					birthday:bday
				};
				socket.emit("user_create_request", post);
			 });

			 socket.on('user_create_request_succeed', function (message) {
 				socket.disconnect();
				uiControl.turnCurrentItemOff();
				uid = parseInt(message);
				page_log.pop();
				db.transaction(function(tx) {
					tx.executeSql('DROP TABLE IF EXISTS personal');
					tx.executeSql('CREATE TABLE IF NOT EXISTS personal(username, session_key)');
					tx.executeSql('INSERT INTO personal(username, session_key) VALUES ("'+ document.getElementById('login_username').value +'",'+dataManager.toHashCode(document.getElementById('login_password').value)+')');
					dataManager.getLoginInfo(tx);
					app.setupCallBack();
				}, dataManager.errorCB);
				network.sendCreateUserRequest_recieved = true;
 			 });

			 socket.on('user_create_request_failed', function () {
 				socket.disconnect();
				network.sendCreateUserRequest_recieved = true;
 			 });
		}
	},

	requestUserInfo_recieved:true,
	requestUserInfo:function(id, cli_version) {
		if(network.requestUserInfo_recieved){
			network.requestUserInfo_recieved = false;
			var socket = io(content_server);
			socket.on('connect', function () {
				var post={
					uid:id,
					version:cli_version
				};
				socket.emit("request_userBloc", post);
			 });

			 socket.on('request_userBloc_info', function (message) {
				socket.disconnect();
				db.transaction(function(tx) {
					tx.executeSql('delete from user where uid = '+ message.uid);
					//alert("packet recieved");
					tx.executeSql('INSERT INTO user(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground, version) VALUES ('+message.uid+', "'+message.username+'", "'+message.display_name+'", "'+message.bio+'", "'+message.theme+'", "'+message.birthday+'", "'+message.location+'", "'+message.date_joined+'", "'+message.profilePicture+'", "'+message.profileBackground+'", '+message.version+')');
					userBloc.getUserInfo(tx);
					network.requestUserInfo_recieved = true;
				}, dataManager.errorCB);
 			 });


			 socket.on('request_userBloc_uptoDate', function () {
				socket.disconnect();
				db.transaction(function(tx) {
					userBloc.getUserInfo(tx);
					network.requestUserInfo_recieved = true;
				}, dataManager.errorCB);
 			 });

			 socket.on('request_userBloc_failed', function (message) {
				socket.disconnect();

 			 });
		}
	},

	getUserFollowers_recieved:true,
	getUserFollowers:function(id) {
		if(network.getUserFollowers_recieved){
			network.getUserFollowers_recieved = false;
			var socket = io(content_server);
			socket.on('connect', function () {
					socket.emit("get_follower_info", id);
			 });

			socket.on('get_follower_info_return', function (message) {
				socket.disconnect();
				db.transaction(function(tx) {
					tx.executeSql('DROP TABLE IF EXISTS follower_list');
					tx.executeSql('CREATE TABLE IF NOT EXISTS follower_list (user Refrences USER uid, followed Refrences USER uid)');
					for(var i = 0; i < message.length; i++){
						tx.executeSql('INSERT INTO follower_list (user, followed) VALUES ( '+ message[i].user +', '+ message[i].followed+')');
					}
					network.getUserFollowers_recieved = true;
				}, dataManager.errorCB);
			});
		}

	},

	getUsers_recieved:true,
	getUsers:function() {
		if(network.getUsers_recieved){
			network.getUsers_recieved = false;
			var socket = io(content_server);
			socket.on('connect', function () {
				socket.emit('get_users_request');
			 });

			socket.on('get_users_succeed', function (message) {
				socket.disconnect();
				db.transaction(function(tx) {
					tx.executeSql('DROP TABLE IF EXISTS bloc_temp');
					tx.executeSql('CREATE TABLE IF NOT EXISTS bloc_temp (uid Refrences USER uid, message, username, version)');
					for(var i = 0; i < message.length; i++){
						tx.executeSql('INSERT INTO bloc_temp(uid, message, username,version) VALUES ('+message[i].uid+', "'+message[i].display_name+'", "'+message[i].username+'", "'+message[i].version+'")');
					}
					blocFeed.getBlocs(tx);
					network.getUsers_recieved = true;
				}, dataManager.errorCB);
 			});

			socket.on('get_users_failed', function (message) {
				socket.disconnect();
				app.onPause();
				app.onResume();
				network.getUsers_recieved = true;
 			});

		}
	},

	updateUser:function(tx, results) {
		var socket = io(content_server);
		socket.on('connect', function () {
			socket.emit("userBloc_update", results.rows.item(0));
		 });

		socket.on('update_user_succeed', function () {
				socket.disconnect();
				var user = results.rows.item(0);
				userBloc.c_user = user;
				uiControl.setTheme(user.theme);
				dataManager.getMedia(user.profileBackground, 'userBloc');
				dataManager.getMedia(user.profilePicture, 'user_Profile_Picture');
				document.getElementById('user_Display_Name').textContent = user.display_name;
				document.getElementById('user_Handle').textContent = "@" + user.username;
				document.getElementById('user_Info').textContent = user.birthday + " | " + user.location;
				document.getElementById('user_bio').textContent = user.bio;
		});

		socket.on('update_user_failed', function (message) {
			socket.disconnect();
			alert(message);
 		});
	},

	setFollow_recieved:true,
	setFollow:function(inc_followed) {
		if(network.setFollow_recieved){
			network.setFollow_recieved = false;
			var socket = io(content_server);
			socket.on('connect', function () {
				post ={user: uid,
							 followed: inc_followed
							};
				socket.emit("follow", post);
			 });

			socket.on('follow_confirmed', function (message) {
				socket.disconnect();
				db.transaction(function(tx) {
					tx.executeSql('INSERT INTO follower_list (user, followed) VALUES ( '+ uid +', '+ inc_followed+')');
					userBloc.getOtherInfo(tx);
					network.setFollow_recieved = true;
				}, dataManager.errorCB);
 			});

			socket.on('follow_failed', function (message) {
				socket.disconnect();
				alert(message);
				network.setFollow_recieved = true;
 			});

			socket.on('reconnecting', function (message) {
				socket.disconnect();
				alert(message);
				network.setFollow_recieved = true;
 			});
		}
	},

	setUnFollow_recieved:true,
	setUnFollow:function(inc_unfollowed) {
		if(network.setUnFollow_recieved){
			network.setUnFollow_recieved = false;
			var socket = io(content_server);
			socket.on('connect', function () {
				post ={user: uid,
							 followed: inc_unfollowed
							};
				socket.emit("unfollow", post);
			 });

			socket.on('unfollow_confirmed', function (message) {
				socket.disconnect();
				db.transaction(function(tx) {
					tx.executeSql('Delete from follower_list where user = '+uid+' AND followed ='+ inc_unfollowed+' ');
					userBloc.getOtherInfo(tx);
					network.setUnFollow_recieved = true;
				}, dataManager.errorCB);
 			});

			socket.on('unfollow_failed', function (message) {
				socket.disconnect();
				alert(message);
				network.setUnFollow_recieved = true;
 			});

			socket.on('reconnecting', function (message) {
				socket.disconnect();
				alert(message);
				network.setUnFollow_recieved = true;
 			});
		}
	},

	uploadPicture:function(photo, callback) {
		var socket = io(content_server);
		var fileReader = new FileReader();
		window.resolveLocalFileSystemURL(photo, function(fileEntry) {
			fileEntry.file(function functionName(file) {
				fileReader.onload = function(evnt){
					socket.on('photo_upload_confirm', function (mid) {
						socket.disconnect();
						db.transaction(function(tx){
							tx.executeSql('INSERT INTO media(mid, data) VALUES (' + mid + ', "'+ evnt.target.result + '")');
						}, dataManager.error);
						callback(mid);
					});
					var packet = {user: userBloc.c_user.username,
												userid: userBloc.c_user.uid,
												data: evnt.target.result};
					socket.emit('photo_upload', packet);
				}
				fileReader.readAsDataURL(file);

			}, network.error);
		} , network.error);

	},

	getMedia:function(mid, element) {
		var socket = io(content_server);
		socket.emit('media_request', mid);

		socket.on('media_request_data', function (data) {
			socket.disconnect();
			db.transaction(function(tx){
				tx.executeSql('INSERT INTO media(mid, data) VALUES (' + mid + ', "'+ data + '")');
			}, dataManager.error);
			document.getElementById(element).style.backgroundImage = "url("+data+")";
		});
	},

	error:function(message) {
		alert(message);
	}

};

var dataManager = {

  initialize:function() {

		height = screen.availHeight;
		width = screen.availWidth;
		//uiControl.updateDebugger("screenX", height);
		//uiControl.updateDebugger("screenY", width);
		//document.body.style.height = height + "px";
		//document.body.style.width = width + "px";
    db = window.openDatabase("timeBloc", "0.1", "dmgr", 20000000);
		db.transaction(dataManager.populateDB, dataManager.errorCB);
    db.transaction(dataManager.getLoginInfo, dataManager.errorCB);
  },

	getLoginInfo:function(tx) {
		tx.executeSql('SELECT * FROM personal', [], dataManager.setUser, dataManager.errorCB);
	},

	setUser:function(tx, results) {
		if(results.rows.length == 0){
			login.setup();
			document.getElementById('base').style.display = "none";
		} else {
			network.sendLoginRequest(results.rows.item(0).username, results.rows.item(0).session_key, app.deviceReadyCallBack);
		}
	},

	resetUserData:function() {
		db.transaction(function(tx){
			tx.executeSql('DROP TABLE IF EXISTS user');
			tx.executeSql('DROP TABLE IF EXISTS media');
			tx.executeSql('DROP TABLE IF EXISTS personal');
			tx.executeSql('DROP TABLE IF EXISTS follower_list');

			tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Primary Key ASC, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground, version)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS media (mid Primary Key, data)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS personal(username, session_key)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS follower_list (user Refrences USER uid, followed Refrences USER uid)');

			tx.executeSql('DROP TABLE IF EXISTS bloc_temp');
			tx.executeSql('CREATE TABLE IF NOT EXISTS bloc_temp (uid Refrences USER uid, message, posted_time)');


		}, dataManager.errorCB);
		if(page_log.length > 0){
			uiControl.turnCurrentItemOff();
		}
		page_log = [];
		page_log_bid = [];
		page_log_uid = [];
		login.setup();
	},

  populateDB:function(tx) {
    //remove after live host server

  	//tx.executeSql('DROP TABLE IF EXISTS user');
    tx.executeSql('DROP TABLE IF EXISTS bloc');
		tx.executeSql('DROP TABLE IF EXISTS bloc_temp');
		//tx.executeSql('DROP TABLE IF EXISTS media');
		tx.executeSql('DROP TABLE IF EXISTS media_temp');
		//tx.executeSql('DROP TABLE IF EXISTS personal');
		tx.executeSql('DROP TABLE IF EXISTS comments');
		tx.executeSql('DROP TABLE IF EXISTS weight_list');
		tx.executeSql('DROP TABLE IF EXISTS follower_list');
		tx.executeSql('DROP TABLE IF EXISTS permission_list');

    tx.executeSql('CREATE TABLE IF NOT EXISTS personal(username, session_key)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Primary Key ASC, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground, version)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS bloc_temp (uid Refrences USER uid, message, username, version)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS follower_list (user Refrences USER uid, followed Refrences USER uid)');


		tx.executeSql('CREATE TABLE IF NOT EXISTS weight_list (uid Refrences USER uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS media (mid Primary Key, data)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS permission_list (plid Primary Key, uid Refrences USER uid, bid Refrences bloc bid, permission_level, date_added)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS bloc (bid Primary Key, uid Refrences USER uid, plid References permission_list(plid), title, mid References media(mid), location, date)');

		tx.executeSql('CREATE TABLE IF NOT EXISTS comments (cid Primary Key, reply References comments(cid), uid Refrences USER uid , bid Refrences bloc bid, text)');


	  //temp inserts

		//template for regex: tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (<seq#>, <cid>, <uid>, <bid>, <text>)');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (0, -1, 3, 1, "This is my test bloc i guess?")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (1, 0, 1, 1, "Any idea on how i can get myself one of these?")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (2, -1, 2, 1, "riprip")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (3, 1, 0, 1, "BOT_DETECTED")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (4, 0, 2, 1, "RandomStoof")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (5, 2, 0, 1, "01000100 01101111 01100101 01110011 00100000 01110100 01101000 01101001 01110011 00100000 01100011 01101111 01110101 01101110 01110100 00100000 01100001 01110011 00100000 01100001 01101110 00100000 01000101 01100001 01110011 01110100 01100101 01110010 01100101 01100111 01100111 00111111")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (6, 3, 3, 1, "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (7, -1, 1, 1, "Bruh Calm down.")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (8, 5, 2, 1, "LOL, im the bot.")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (9, 3, 3, 1, "This is my test bloc i guess?")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (10, 0, 1, 1, "Any idea on how i can get myself one of these?")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (11, 5, 2, 1, "riprip")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (12, -1, 2, 1, "riprip")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (13, 1, 0, 1, "BOT_DETECTED")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (14, 12, 2, 1, "RandomStoof")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (15, 2, 0, 1, "01000100 01101111 01100101 01110011 00100000 01110100 01101000 01101001 01110011 00100000 01100011 01101111 01110101 01101110 01110100 00100000 01100001 01110011 00100000 01100001 01101110 00100000 01000101 01100001 01110011 01110100 01100101 01110010 01100101 01100111 01100111 00111111")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (16, 9, 3, 1, "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (17, -1, 1, 1, "Bruh Calm down.")');
		tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES (18, 5, 2, 1, "LOL, im the bot.")');
		comment_number=19;

		//Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium

    //template for regex: tx.executeSql('INSERT INTO personal(session_key, username) VALUES (<session_id>, username)');


    /*		//tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (<uid> , <weight_0>, <weight_1>, <weight_2>, <weight_3>, <weight_4>, <weight_5>, <weight_6>)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (0, 1, 1, 1, 1, 1, 1, 1)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (1, 0.1, 0.5, 0.8, 0.6, 0.4, 0.8, 0.6)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (2, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, -1)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (3, 0.1, 0.25, 0.65, 1, -1, -1, -1)');
    */
		tx.executeSql('DELETE FROM user WHERE uid = 0');
		tx.executeSql('DELETE FROM user WHERE uid = 1');
		tx.executeSql('DELETE FROM user WHERE uid = 2');
		tx.executeSql('DELETE FROM user WHERE uid = 3');

    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (1, "hyte", "John Gregg", "Lead Programmer on timeBloc.", "dark", "January, 5th", "WV - USA", "<date_joined>", "img/1_profile_picture.jpg", "img/1_profile_background.jpg")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (2, "the_reelist_condor", "Connor Thomas", "BYU. Also a noob.", "dark", "December, 4th", "UT - USA", "<date_joined>", "img/2_profile_picture.jpg", "img/2_profile_background.jpg")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (3, "serbian_slayer", "Brane Pantovic", "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.", "light", "March, 14th", "NY - USA","<date_joined>", "img/3_profile_picture.jpg", "img/3_profile_background.jpg")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (0, "user", "default_user", "<message>", "light", "NULL, 00th", "N/A - N/A", "<date_joined>", "img/0_profile_picture.jpg", "img/0_profile_background.jpg")');



    //template for regex: tx.executeSql('INSERT INTO follower_list( user, followed, date_followed) VALUES (<uid>, <fuid>, "<date_joined>")');
		/*
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 1, 2, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 1, 3, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 2, 1, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 2, 3, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 3, 1, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 3, 2, "<date_joined>")');
		*/
		tx.executeSql('CREATE TABLE IF NOT EXISTS media_temp (mid Primary Key, uid Refrences USER uid, bid Refrences bloc bid, type, data)');

		//tx.executeSql('INSERT INTO picture(mid, uid, bid, type, data) VALUES (<seq#>, <uid>, <bid>, <type(0=picture)> <imagedata>)');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (1, 3, 0, 0, "img/1_bloc_bg.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (0, 3, 1, 0, "img/2_bloc_bg.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (3, 3, 1, 0,"img/bloc_1_1.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (4, 3, 1, 0, "img/bloc_1_2.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (5, 3, 1, 0, "img/bloc_1_3.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (6, 3, 1, 0, "img/bloc_1_4.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (7, 3, 1, 0, "img/bloc_1_5.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (8, 3, 1, 0, "img/bloc_1_6.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (9, 3, 1, 0, "img/bloc_1_7.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (10, 3, 1, 0, "img/bloc_1_8.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (11, 3, 1, 0, "img/bloc_1_9.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (12, 3, 1, 0, "img/bloc_1_10.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (13, 3, 1, 0, "img/bloc_1_11.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (14, 3, 1, 0, "img/bloc_1_12.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (15, 3, 1, 0, "img/bloc_1_13.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (16, 3, 1, 0, "img/bloc_1_14.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (17, 3, 1, 0, "img/bloc_1_15.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (18, 3, 1, 0, "img/bloc_1_1.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (19, 3, 1, 0, "img/bloc_1_2.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (20, 3, 1, 0, "img/bloc_1_3.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (21, 3, 1, 0, "img/bloc_1_4.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (22, 3, 1, 0, "img/bloc_1_5.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (23, 3, 1, 0, "img/bloc_1_6.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (24, 3, 1, 0, "img/bloc_1_7.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (25, 3, 1, 0, "img/bloc_1_8.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (26, 3, 1, 0, "img/bloc_1_9.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (27, 3, 1, 0, "img/bloc_1_10.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (28, 3, 1, 0, "img/bloc_1_11.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (29, 3, 1, 0, "img/bloc_1_12.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (30, 3, 1, 0, "img/bloc_1_13.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (31, 3, 1, 0, "img/bloc_1_14.jpg")');
		tx.executeSql('INSERT INTO media_temp(mid, uid, bid, type, data) VALUES (32, 3, 1, 0, "img/bloc_1_15.jpg")');

		//tx.executeSql('INSERT INTO permission_list(pl_id, uid, bid, date_added) VALUES (<seq#>, <uid>, <bid>, <permission_level>, <current_data>)');
		tx.executeSql('INSERT INTO permission_list(plid, uid, bid, permission_level, date_added) VALUES (0, 3, 0, 5 ,"-Null-")');

		//tx.executeSql('INSERT INTO bloc(bid, uid, pl_id, title, mid, location, date) VALUES (<seq#>, <uid>, <pl_id>, "<title>",  <mid>, <location>, <current_date> )');
		tx.executeSql('INSERT INTO bloc(bid, uid, plid, title, mid, location) VALUES (0, 0, 0, "Default Bloc",  0, "NA - USA" )');
		tx.executeSql('INSERT INTO bloc(bid, uid, plid, title, mid, location) VALUES (1, 3, 0, "Brane Test",  0, "CO - USA" )');

    //template for regex: tx.executeSql('INSERT INTO bloc(bid, userID, message) VALUES (<bid>, "<username>", "<message>")');
		/*
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (0, 0, "Link to UID_0 - Default")');
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (1, 1, "Link to UID_1 - John")');
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (2, 2, "Link to UID_2 - Connor")');
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (3, 3, "Link to UID_3 - Brane")');*/
  },

  errorCB:function(err) {
      alert("Error processing SQL: "+ err.message);
  },

  numberToString:function(num) {
    var i = 10;
    if(num == 0)
      return num;
    while(num <= Math.pow(10, i)) {
      i--;
    }
    switch (i) {
      case 4:
        return (num/Math.pow(10,3)).toFixed(1) + 'k';
      case 5:
        return (num/Math.pow(10,3)).toFixed(0) + 'k';
      case 6:
        return (num/Math.pow(10,6)).toFixed(1) + 'm';
      case 7:
        return (num/Math.pow(10,6)).toFixed(1) + 'm';
      case 8:
        return (num/Math.pow(10,6)).toFixed(0) + 'm';
      case 9:
        return (num/Math.pow(10,9)).toFixed(1) + 'b';
      default:
        return num;
    }
  },

	toHashCode:function(string) {
		var hash = 0, i, chr, len;
  	if (string.length === 0) return hash;
  	for (i = 0, len = string.length; i < len; i++) {
    	chr   = string.charCodeAt(i);
    	hash  = ((hash << 5) - hash) + chr;
    	hash |= 0; // Convert to 32bit integer
  	}
  	return hash;
	},

	getMedia:function(mid, element) {
		if(mid < 0){
			switch (mid) {
				case '-1':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_picture.jpg)";
					break;
				case '-2':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_1.jpg)";
					break;
				case '-3':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_2.jpg)";
					break;
				case '-4':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_3.jpg)";
					break;
				case '-5':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_4.jpg)";
					break;
				case '-6':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_5.jpg)";
					break;
				case '-7':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_6.jpg)";
					break;
				case '-8':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_7.jpg)";
					break;
				case '-9':
					document.getElementById(element).style.backgroundImage = "url(assets/default_profile_background_8.jpg)";
					break;
				default:
					alert(mid);
			}
		} else {
			db.transaction(function(tx){
				tx.executeSql('SELECT data FROM media WHERE mid = '+ mid , [], function(tx, results) {
					if(results.rows.length != 0){
						document.getElementById(element).style.backgroundImage = "url("+results.rows.item(0).data+")";
					} else {
						network.getMedia(mid, element);
					}
				}, dataManager.errorCB);
			}, dataManager.errorCB);

		}
	}
};

var uiControl = {

		metrics: [],
		values: [],
		callback: [],

		setDebugger:function() {
			var htmlinsert = "";
			var template = "";
			for(var i = 0;i < uiControl.metrics.length; i++){
				if(uiControl.metrics[i] == "build" || uiControl.metrics[i] == "version" || uiControl.metrics[i] == "msg"){
					template = "<div class='dbg_item'>" + uiControl.values[i] + "</div>";
				} else {
					template = "<div class='dbg_item'>" +	uiControl.metrics[i] + "|" + uiControl.values[i] + "</div>";
				}
				htmlinsert += template;
			}
			document.getElementById('debug').innerHTML = htmlinsert;
		},

		updateDebugger:function(id, val){
			if(uiControl.metrics.indexOf(id) <  0){
				uiControl.metrics.push(id);
			}
			uiControl.values[uiControl.metrics.indexOf(id)] = val;
			uiControl.setDebugger();
		},


    toBeImplemented:function(ev) {
      alert('This feature is not working.');
    },

		setTheme:function(id) {
			var classes = ['user_Display_Name', 'user_Handle', 'user_Follow_Status',
										 'user_bio', 'user_Info', 'page_break',
										 'wks', 'fr', 'fi'];
			var current_block;
			for(var i = 0; i < classes.length; i++){
				current_block = document.getElementById(classes[i]);
				if(current_block.classList.length > 1){
					current_block.classList.remove(current_block.classList[1]);
				}
				current_block.classList.add(id);
			}
		},

		setPreviewTheme:function(id) {
			var classes = ['finished_profile', 'username_edit', 'location_swap', 'bottom_line', 'bio_edit'];
			var selector = ['theme_light', 'theme_dark'];
			for(var i = 0; i < selector.length; i++){
				if(document.getElementById(selector[i]).classList.contains('active_theme')){
					document.getElementById(selector[i]).classList.toggle('active_theme');
				}
				if(("theme_"+id) == selector[i]){
					document.getElementById(selector[i]).classList.add('active_theme');
				}
			}
			userBloc.c_user.theme = id;
			var current_block;
			for(var i = 0; i < classes.length; i++){
				current_block = document.getElementById(classes[i]);
				if(current_block.classList.length > 1){
					current_block.classList.remove(current_block.classList[1]);
				}
				current_block.classList.add(id);
			}
		},

    populate: function() {
      //====================================
      //--------------userBloc--------------
      //====================================
      //alert("img/"+ username +"_profile_picture.jpg");
      var d = new Date();
      for (var i = 1; i < 7; i++) {
            document.getElementById("day"+ i +"_date").innerHTML = (d.getMonth()+1) +"/" + (d.getDate() - i);
      }
      //====================================
      //-----END------userBloc------END-----
      //====================================
    },

    turnCurrentItemOff:function(){
      if(page_log.length >= 1){
				var id;
				if(current_page != null){
					id = current_page;
					current_page = null;
				} else {
				  id = page_log[page_log.length-1];
				}
				//uiControl.updateDebugger("tco", id);
				switch (id) {
					case 'calander':
						calander.c_pos = -width;
						calander.slide_step = Math.floor(width/25);
						calander.slide_animation = setInterval(calander.popIn, 6);
					case 'userBloc':
						userBloc.taredown();
						break;
					case 'blocFeed':
						blocFeed.taredown();
						break;
					case 'personalPage':
						personalPage.taredown();
						userBloc.taredown();
						break;
					case 'bloc':
						bloc.taredown();
						break;
					case 'dialog':
						uiControl.select(-3);
						break;
					case 'founders':
						founders.taredown();
						break;
					case 'fullScreenMedia':
						fullScreenMedia.taredown();
						break;
					case 'login':
						login.taredown();
						break;
					default:
						alert("TCO Unhandled Page: " + id);
				}
      } else {
				document.getElementById('blocFeed').display = 'block';
				document.getElementById('userBloc').display = 'none';
				document.getElementById('calander').display = 'none';
				document.getElementById('bloc').display = 'none';
				document.getElementById('dialog').display = 'none';
				document.getElementById('base').display = 'none';
			}
    },

    turnItemOn:function(id){
			if(page_log[page_log.length-1]=='personalPage' && id != 'dialog'){
				personalPage.taredown();
				page_log.pop();
			}
			if(page_log[page_log.length-1]!=id){
				page_log.push(id);
			} else if(page_log[page_log.length-1] == 'userBloc'){
				page_log.push(id);
			}
			//uiControl.updateDebugger("pl", page_log);
      if(document.getElementById(id).classList.contains("off")){
        document.getElementById(id).classList.remove('off');
      }
      document.getElementById(id).classList.add('on');
    },

    turnItemOff:function(id) {
      if(document.getElementById(id).classList.contains("on")){
        document.getElementById(id).classList.remove('on');
      }
      document.getElementById(id).classList.add('off');
    },

		addItem:function(id) {
			alert();
		},

		dialog:function(options, cbk) {
			uiControl.callback = cbk;
			var option;
			var dialog = "";
			for(var i = options.length-1; i >= 0; i--){
				option = "";
				if(i == options.length-1){
					if(i == 0){
						option += "<div class='option top bottom' ontouchend='uiControl.select("+(i)+");'>";
					} else {
						option += "<div class='option top' ontouchend='uiControl.select("+(i)+");'>";
					}
				} else if(i == 0){
					option += "<div class='option bottom' ontouchend='uiControl.select("+(i)+");'>";
				} else {
					option += "<div class='option' ontouchend='uiControl.select("+(i)+");'>";
				}
				option += options[i]+ "</div>";
				dialog += option;
			}
			dialog += "<div class='option cancel' ontouchend='uiControl.select(-1);'>Cancel</div>";
			document.getElementById('option_container').innerHTML = dialog;
			document.getElementById("dialog").style.display ="block";
			document.getElementById("dialog").style['z-index'] = page_log.length+5;
			uiControl.turnItemOn("dialog");
		},

		select:function(id) {
			if(id >= 0){
				var temp  = uiControl.callback[id];
				if(temp == null){
					uiControl.toBeImplemented()
				} else {
					temp.call();
				}
			}
			if(id  >= -1){
				page_log.pop();
			}
			if(id == -3){
				page_log.pop();
				uiControl.turnCurrentItemOff();
			}
			uiControl.turnItemOff("dialog");
			setTimeout(function () {
				document.getElementById("dialog").style.display ="none";
			}, 200);
		},

};

var sidebar = {

	width:0,
	animation: null,
	c_pos:0,
	slide_step:0,


  slide: function() {
		if(sidebar.animation != null){
			clearInterval(sidebar.animation);
			sidebar.animation = null;
		}
		if(!sidebar_isOn){
			sidebar_isOn = true;
			sidebar.c_pos = 0;
			sidebar.slide_step = width/15;
			sidebar.animation = setInterval(sidebar.slideOn, 5);
		} else{
			sidebar_isOn = false;
			sidebar.c_pos = width;
			sidebar.slide_step = width/15;
			sidebar.animation = setInterval(sidebar.slideOff, 5);
		}
  },

	slideOn:function () {
		sidebar.c_pos += sidebar.slide_step;
		if(sidebar.c_pos < width){
			document.getElementById("sidebar").style["-webkit-transform"] = "translateX(" + sidebar.c_pos+ "px)";
		} else{
			clearInterval(sidebar.animation);
			sidebar.animation = null;
			sidebar_isOn = true;
			document.getElementById("sidebar").style["-webkit-transform"] = "translateX(" + width + "px)";
		}
	},

	slideOff:function () {
		sidebar.c_pos -= sidebar.slide_step;
		if(sidebar.c_pos > 0){
			document.getElementById("sidebar").style["-webkit-transform"] = "translateX(" + sidebar.c_pos+ "px)";
		} else{
			clearInterval(sidebar.animation);
			sidebar.animation = null;
			sidebar_isOn = false;
			document.getElementById("sidebar").style["-webkit-transform"] = "translateX(0px)";
		}
	},

	onTouch:function() {
		if(sidebar_isOn == true){
		touches = event.touches[0];
		first_touch = touches;
		sidebar.c_pos = width;
		sidebar.animation = setInterval(sidebar.updater,5);
		}
	},

	updater:function() {
			document.getElementById("sidebar").style["-webkit-transform"] = "translateX(" + sidebar.c_pos + "px)";
	},

	onSlide:function() {
		var temp = width-(first_touch.pageX - event.touches[0].pageX);
		if(temp <  width){
			sidebar.c_pos = temp;
		}
	},

	onTouchEnd:function() {
		if(sidebar_isOn == true){
			clearInterval(sidebar.animation);
			sidebar.animation = null;
			if(sidebar.c_pos  >= (25*width)/36){
				sidebar.slide_step = width/30;
				sidebar.animation = setInterval(sidebar.slideOn, 5);
			} else{
				sidebar.slide_step = width/18;
				sidebar.animation = setInterval(sidebar.slideOff, 5);
			}
		}
	}
};

var login = {
	setup:function() {
		login.setupCallBack();
	},


	setupCallBack:function(){
		document.getElementById('navbar_menu_button').style.opacity =0.0;
		document.getElementById('navbar_menu_button').ontouchstart = "";
		uiControl.turnCurrentItemOff();
		document.getElementById("login_error").style.display = "none";
		document.getElementById("login").style.display = "block";
		document.getElementById("login").style['z-index'] = 2;
		uiControl.turnItemOn("login");
	},

	taredown:function() {
		uiControl.turnItemOff("login");
		setTimeout(function () {
			document.getElementById("login").style.display = "none";
			document.getElementById("login").style['z-index'] = 0;
		}, 200);
	},

	submit:function() {
		if(document.getElementById('login_username').value != "" && document.getElementById('login_password').value != ""){
			login.taredown();
			network.sendLoginRequest(document.getElementById('login_username').value, dataManager.toHashCode(document.getElementById('login_password').value), app.deviceReadyCallBack);
		} else {
			login.loginFailed();
		}
	},

	loginFailed:function() {
		document.getElementById('login_password').value = null;
		//document.getElementById('login_username').value = null;
		document.getElementById('login_username').classList.add("failed_top");
		document.getElementById('login_password').classList.add("failed_bottom");
	},

	created: false,
	createAccount:function() {
		if(!login.created){
			document.getElementById('login_content').style.display = 'none';
			document.getElementById('account_content').style.display = 'block';
			login.created = true;
		} else {
			network.sendCreateUserRequest(document.getElementById('login_username').value,
																		dataManager.toHashCode(document.getElementById('login_password').value),
																		document.getElementById('display_name').value,
																		document.getElementById('location').value,
																		document.getElementById('birthday').value);
		}
	},

	populateUserElements:function(tx, results) {
		if(results.rows.length != 0){
			var user = results.rows.item(0);
			dataManager.getMedia(user.profilePicture, 'profile_sidebar_link_image');
			document.getElementById('profile_sidebar_link_display_name').textContent = user.display_name;
			document.getElementById('profile_sidebar_link_username').textContent = '@' + user.username;
		} else {

		}
	}

}

var blocFeed ={

  //all page data load events here
  setup:function() {
		network.getUsers();
		db.transaction(blocFeed.getBlocs, dataManager.errorCB);
  },

  //all ui load evenets here
  setupCallBack:function() {
		uiControl.turnCurrentItemOff();
		document.getElementById("blocFeed").style.display = "block";
    document.getElementById("blocFeed").style['z-index'] = 5;
		uiControl.turnItemOn("blocFeed");
  },

  taredown:function() {
		uiControl.turnItemOff("blocFeed");
		document.getElementById("blocFeed").style.display = "none";
		document.getElementById("blocFeed").style['z-index'] = 0;
  },

  getBlocs:function(tx){
    tx.executeSql('SELECT * FROM bloc_temp', [], blocFeed.generateFeed, dataManager.errorCB);
  },

  generateFeed:function(tx, results) {
		if(results.rows.length !=0){
			tx.executeSql('SELECT uid, version FROM user', [], function( tx, version_results) {
				var bf = document.getElementById('blocFeed_slideable');
				var full_bloc = "";
				for(var i = results.rows.length-1; i >=0 ; i--){
					full_bloc += blocFeed.generateBloc(results.rows.item(i));
				}
				bf.innerHTML = full_bloc;
				var found = false;
				for(var i = results.rows.length-1; i >=0 ; i--){
					found = false;
					for(var ii = 0; ii < version_results.rows.length; ii++){
						if(version_results.rows.item(ii).uid == results.rows.item(i).uid){
							if(version_results.rows.item(ii).version == results.rows.item(i).version){
								if(uid == results.rows.item(i).uid){
									document.getElementById('blocFeed_container_'+ version_results.rows.item(ii).uid).style.backgroundColor= "#fbedb6";
								} else {
									document.getElementById('blocFeed_container_'+ version_results.rows.item(ii).uid).style.backgroundColor= "white";
								}
								found = true;
							}
						}
					}
					if(!found){
						document.getElementById('blocFeed_container_'+ results.rows.item(i).uid).style.backgroundColor= "#fff1e6";
					}
				}
				blocFeed.setupCallBack();
			}, dataManager.errorCB);
		} else {
			network.getUsers();
		}

  },

  generateBloc:function(b){
    var basic_template = "<div id='blocFeed_container_"+b.uid+"' class='blocFeed_container'>"+
                              "<img ontouchend='userBloc.setup("+b.uid+")' class='blocFeed_bloc_picture' src='assets/blocFeed_icon.png'/>" +
                              "<p class='blocFeed_bloc_title'>"+ b.message +"</p>" +
															"<p class='blocFeed_bloc_username'>@"+b.username+"</p>"+
                          "</div>";
    return basic_template;
  },

};

var userBloc = {

    id: null,
		weight:[0.166, 0.166, 0.166, 0.166, 0.166, 0.166, 0.166],
    last_slice: 0,
		current_angle: 0,
    start_angle: 0,
    delta_a: 0,
		position_list: [],
		c_user: null,
    animation: null,
		animation_2: null,
		velocity: 0,
		isFollowing: false,
		timer:null,
		deceleration:null,



    setup:function(id) {
			document.getElementById('userBloc').style.backgroundImage = '';
			document.getElementById('user_Profile_Picture').style.backgroundImage = '';
			document.getElementById('user_Display_Name').textContent = "";
			document.getElementById('user_Handle').textContent = "@";
			document.getElementById('user_Info').textContent = "";
			document.getElementById('user_bio').textContent = "";
			if(id == null){
				id = uid;
			}
			if(userBloc.id != parseInt(id)){
				page_log_uid.push(id);
				userBloc.id = parseInt(id);
				network.getUserFollowers(userBloc.id);
				db.transaction(function(tx) {
					tx.executeSql('SELECT version FROM user where uid = '+ userBloc.id, [], function(tx, results) {
						if(results.rows.length != 0){
							network.requestUserInfo(userBloc.id, results.rows.item(0).version);
						} else {
							network.requestUserInfo(userBloc.id, 0);
						}
					}, dataManager.errorCB);
				}, dataManager.errorCB);
				calander.setup();
			}
    },

		setupCallBack:function(){
			uiControl.turnCurrentItemOff();
			document.getElementById("userBloc").style.display = "block";
			document.getElementById("userBloc").style.left = "0%";
			document.getElementById("userBloc").style['z-index'] = page_log.length+4;
			uiControl.turnItemOn("userBloc");
		},

		taredown:function() {
			clearInterval(userBloc.animation);
			clearInterval(userBloc.deceleration);
			userBloc.animation == null;
			userBloc.deceleration = null;

			uiControl.turnItemOff("userBloc");
			document.getElementById("userBloc_bloc_preview").style.display = "none";
			document.getElementById("userBloc").style['z-index'] = 0;
			document.getElementById("userBloc").style.display = "none";
			userBloc.id = null;
			calander.taredown();
		},

		getUserInfo:function(tx){
      tx.executeSql('SELECT * FROM user where uid = '+ userBloc.id, [], userBloc.setupUserElements, dataManager.errorCB);
			userBloc.getWeights(tx);
    },

		setupUserElements: function(tx,results) {
				var user = results.rows.item(0);
				userBloc.c_user = user;
				uiControl.setTheme(user.theme);
				dataManager.getMedia(user.profileBackground, 'userBloc');
				dataManager.getMedia(user.profilePicture, 'user_Profile_Picture');
				document.getElementById('user_Display_Name').textContent = user.display_name;
				document.getElementById('user_Handle').textContent = "@" + user.username;
				document.getElementById('user_Info').textContent = user.birthday + " | " + user.location;
				document.getElementById('user_bio').textContent = user.bio;
    },

    getWeights:function(tx){
      tx.executeSql('SELECT * FROM weight_list where uid = ' + userBloc.id, [], userBloc.setWeights, dataManager.errorCB );
    },

		setWeights:function(tx, results) {
			if(results.rows.length != 0){
				var userWedge = results.rows.item(0);
				var replace_weight = [];
				var replace_pos = [];
				for(var i=0; i <= 6 ; i++){
					if(userWedge['weight_'+ i] > 0){
						replace_weight.push(userWedge['weight_'+ i]);
						replace_pos.push(i);
					}
				}
				userBloc.weight = replace_weight;
				userBloc.position_list = replace_pos;
			} else {
				userBloc.weight = [0.166, 0.166, 0.166, 0.166, 0.166, 0.166, 0.166];
				userBloc.position_list = [0,1,2,3,4,5,6];
			}
			userBloc.generateSelf();
			userBloc.getOtherInfo(tx);
		},

    getOtherInfo:function(tx){
      tx.executeSql('SELECT user FROM follower_list where followed = '+ userBloc.id, [], userBloc.setupFollowers, dataManager.errorCB);
      tx.executeSql('SELECT user FROM follower_list where user = '+ userBloc.id, [], userBloc.setupFollowing, dataManager.errorCB);
			tx.executeSql('SELECT user FROM follower_list where user = '+ userBloc.id +' AND followed = ' + uid + ' OR user = '+ uid +' AND followed = ' + userBloc.id, [], userBloc.setFollowButton, dataManager.errorCB);

    },

		setupFollowers: function(tx,results) {
			document.getElementById('followers').textContent = dataManager.numberToString(results.rows.length);
		},

		setupFollowing: function(tx,results) {
			document.getElementById('following').textContent = dataManager.numberToString(results.rows.length);
		},

		setFollowButton: function(tx,results) {
			//alert(results.rows.length);
			userBloc.resetFollowButton();
			if (userBloc.c_user.uid == uid) {
				document.getElementById('user_Follow_Status').style.border = '.8% dashed #bfbfbf';
				document.getElementById('user_Follow_Status').style.background = '#bfbfbf';
				document.getElementById('user_Follow_Status_message').textContent = "Edit Profile";
				document.getElementById('user_Follow_Status').ontouchend = personalPage.setup;
			} else {
				switch (results.rows.length) {
					case 2:
						userBloc.followBack();
						userBloc.follow();
						break;
					case 1:
						if(results.rows.item(0).user != uid){
							userBloc.followBack();
						} else {
							userBloc.follow();
						}
						break;
					default:
						userBloc.unfollow();
				}
			}
		},

    generateSelf:function() {
			var wedge_angle = 360/(userBloc.weight.length);
      var s_angle = -90 + (wedge_angle/2);
			var dasharray = (205/(userBloc.weight.length)) + "%" + " 195%";
      for(var i = 0; i < 7; i++){
			  if(userBloc.position_list[i] != null){
          document.getElementById("user_Profile_slice_" + userBloc.position_list[i]).style.display = "block";
        	document.getElementById("user_Profile_breakdown_" + userBloc.position_list[i]).style['-webkit-transform'] = "rotate(" + (s_angle+(wedge_angle*(i-1))) + "deg)";
        	document.getElementById("user_Profile_slice_" + userBloc.position_list[i]).style['stroke-dasharray']= dasharray;
					document.getElementById("user_Profile_slice_" + userBloc.position_list[i]).style['stroke-width'] = 16 + '%';
					document.getElementById("user_Profile_breakdown_" + userBloc.position_list[i]).style.opacity = 0.50;
        	//begin_angle += userBloc.c_angle;
				} else {
					document.getElementById("user_Profile_slice_" + i).style.display = "none";
					//document.getElementById("user_Profile_slice_"  + userBloc.last_slice).style['stroke-width'] = 23 + '%';
				}
			}
			document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate(0deg)";
			userBloc.current_angle = 0;
			userBloc.last_slice = 0;
			userBloc.setupCallBack();
    },

    onProfilePictureTouch:function(){
      touches = event.touches[0];
			clearInterval(userBloc.animation);
			clearInterval(userBloc.deceleration);
			var direction = Math.atan2(touches.pageY -  window.innerHeight*0.40, touches.pageX - window.innerWidth*0.50) + Math.PI;
			userBloc.start_angle = 360*(direction/(2*Math.PI));
			if(document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.contains("darken")){
				document.getElementById("userBloc_bloc_preview").style.display = "none";
				document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.toggle("darken");
				document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 0.5;
				document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style['stroke-width'] = 16 + '%';
			}
			if(userBloc.animation == null || userBloc.deceleration == null){
				userBloc.animation = setInterval(this.translateCircle,20);
			} else {
				userBloc.animation == null;
			 	userBloc.deceleration = null;
				userBloc.animation = setInterval(this.translateCircle,20);
			}
			userBloc.sw = 16;
			userBloc.op = 0.5;
      userBloc.timer = performance.now();
		},

    onProfilePictureDrag:function() {
      touches = event.touches[0];
      userBloc.current_angle = userBloc.current_angle%360;
      var cd = 360*((Math.atan2(touches.pageY -  window.innerHeight*0.40, touches.pageX - window.innerWidth*0.50)+Math.PI)/(2*Math.PI));
      userBloc.delta_a = userBloc.start_angle-cd;
      userBloc.start_angle = cd;
    },

    onProfilePictureEnd:function() {
      clearInterval(userBloc.animation);
			userBloc.animation = null;
			userBloc.timer = performance.now() - userBloc.timer;
			var velocity = (userBloc.delta_a/userBloc.timer);
			var wedge_angle = 360/(userBloc.weight.length);

			userBloc.deceleration = setInterval(function() {
				userBloc.delta_a -= 5*((userBloc.delta_a)/80).toPrecision(5);
				userBloc.translateCircle();
				if(Math.abs(userBloc.delta_a) <= 0.001){
					clearInterval(userBloc.deceleration);
					userBloc.deceleration = null;
					var wedge_angle = 360/(userBloc.weight.length);
					userBloc.current_angle = userBloc.current_angle%360;
					var i = (Math.round(userBloc.current_angle/wedge_angle)-userBloc.last_slice)%userBloc.weight.length;
					while(i != 0){
						if(i > 0){
							userBloc.position_list.unshift(userBloc.position_list.pop());
							i--;
						} else if(i < 0) {
							userBloc.position_list.push(userBloc.position_list.shift());
							i++;
						}
					}
					userBloc.last_slice = Math.round(userBloc.current_angle/wedge_angle);
					userBloc.start_angle = userBloc.current_angle;
					userBloc.current_angle = userBloc.last_slice * wedge_angle;
					userBloc.delta_a = userBloc.current_angle - userBloc.start_angle;
					userBloc.animation = setInterval(userBloc.snapTo, 5);

				}
			},5);


    },

    translateCircle:function() {
      userBloc.current_angle -= userBloc.delta_a;
      document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+(userBloc.current_angle)+"deg)";
    },

		op:0.5,
		sw:16,
		snapTo:function() {
			var step = 1/15;
			userBloc.op += 0.5*step;
			userBloc.sw += 2*step;
			userBloc.delta_a -= userBloc.delta_a*step;

			if(userBloc.delta_a > 0){
				if(userBloc.delta_a <= 1){
          clearInterval(userBloc.animation);
					userBloc.animation == null;
					document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+ userBloc.current_angle +"deg)";
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.toggle("darken");
          document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style["stroke-width"] = "23%";
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 1.0;
				}
			} else {
				if(userBloc.delta_a >= -1){
          clearInterval(userBloc.animation);
					userBloc.animation == null;
					document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+ userBloc.current_angle +"deg)";
					document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.toggle("darken");
          document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style["stroke-width"] = "23%";
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 1.0;
				}
			}
			document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+(userBloc.current_angle - userBloc.delta_a)+"deg)";
		},

	  resetFollowButton:function() {
			document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
			document.getElementById('user_Follow_Status').style.border = '.8vw dashed #bfbfbf';
			//document.getElementById('user_Follow_Status').style.background = "#f2f2f2";
			document.getElementById('user_Follow_Status_message').textContent = "Follow";
			document.getElementById('userFollowingStatus_fbarrow').style.display = "none";
			document.getElementById('userFollowingStatus_farrow').style.display = "none";
			document.getElementById('user_Follow_Status').style.background = 'none';
			userBloc.isFollowing = false;
		},

    toggleFollow:function() {
      if(!userBloc.isFollowing){
        network.setFollow(userBloc.id);
      } else {
				uiControl.dialog(["Unfollow"],[function() {
					network.setUnFollow(userBloc.id);
				}]);
      }
    },

    followBack:function() {
      document.getElementById('user_Follow_Status').style['border-top-style'] = "solid";
      document.getElementById('user_Follow_Status').style['border-top-color'] = "#e68800";
      document.getElementById('user_Follow_Status').style['border-left-style'] = "solid";
      document.getElementById('user_Follow_Status').style['border-left-color'] = "#e68800";
      document.getElementById('userFollowingStatus_fbarrow').style.display = "block";
    },

    follow: function(){
      document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
      document.getElementById('user_Follow_Status').style['border-bottom-style'] = "solid";
      document.getElementById('user_Follow_Status').style['border-bottom-color'] = "#ffcb80";
      document.getElementById('user_Follow_Status').style['border-right-style'] = "solid";
      document.getElementById('user_Follow_Status').style['border-right-color'] = "#ffcb80";
      document.getElementById('userFollowingStatus_farrow').style.display = "block";
      document.getElementById('user_Follow_Status_message').textContent = "Following";
      userBloc.isFollowing = true;
    },

    setUnfollow: function(tx) {
        tx.executeSql('DELETE FROM follower_list where uid = '+ uid +' AND fuid = '+ userBloc.id);
    },

    unfollow: function() {
      document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
      document.getElementById('user_Follow_Status_message').textContent = "Follow";
      userBloc.isFollowing = false;
    }

};

var personalPage = {

	imageP: null,
	imageB: null,
	callback: null,
	theme: null,

	setup:function() {
		//document.getElementById("user_Display_Name").prop('readonly', false);
		uiControl.setTheme("editing");
		document.getElementById("user_Profile_Picture").style['z-index'] = page_log.length+4;
		document.getElementById("current_userPP").style['z-index'] = page_log.length+5;
		document.getElementById("bgselect").style['z-index'] = page_log.length+5;
		document.getElementById("finished_profile").style['z-index'] = page_log.length+5;
		document.getElementById("theme_Selecter").style['z-index'] = page_log.length+8;

		document.getElementById("userBloc_slide_tab").style['z-index'] = 0;


		document.getElementById("bio_edit").style.display = "block";
		document.getElementById("bio_edit").value = userBloc.c_user.bio;

		document.getElementById("username_edit").style.display = "block";
		document.getElementById("username_edit").value = userBloc.c_user.display_name;

		document.getElementById("location_swap").style.display = "block";
		document.getElementById("location_swap").textContent = userBloc.c_user.location;

		document.getElementById("bg_overlay").style.display = "block";
		document.getElementById("bottom_line").style.display = "block";
		document.getElementById("finished_profile").style.display = "block";
		document.getElementById("theme_Selecter").style.display = "block";
		document.getElementById("current_userPP").style.display = "block";
		document.getElementById("bgselect").style.display = "block";


		document.getElementById("user_Follow_Status").style.display = "none";
		document.getElementById("user_Profile_breakdown_container").style.display = "none";

		uiControl.setPreviewTheme(userBloc.c_user.theme);
		personalPage.setupCallBack();
	},

	setupCallBack:function(){
		document.getElementById("personalPage").style['z-index'] = page_log.length;
		uiControl.turnItemOn("personalPage");
	},

	taredown:function() {

		uiControl.turnItemOff("personalPage");
		document.getElementById("user_Profile_breakdown_container").style.display = "block";
		document.getElementById("user_Follow_Status").style.display = "block";
		document.getElementById("current_userPP").style.display = "none";
		document.getElementById("bgselect").style.display = "none";
		setTimeout(function () {
			document.getElementById("userBloc_slide_tab").style['z-index'] = page_log.length+3;
			document.getElementById("personalPage").style['z-index'] = 0;
			document.getElementById("location_swap").style.display = "none";
			document.getElementById("bio_edit").style.display = "none";
			document.getElementById("username_edit").style.display = "none";
			document.getElementById("bg_overlay").style.display = "none";
			document.getElementById("finished_profile").style.display = "none";
			document.getElementById("bottom_line").style.display = "none";
			document.getElementById("theme_Selecter").style.display = "none";
		}, 200);
	},

	getGeoLocation:function() {
		 navigator.geolocation.getCurrentPosition(personalPage.onSuccess, personalPage.onError);
	},

	onSuccess:function(position) {
			alert('Latitude: '          + position.coords.latitude         +
						'\nLongitude: '         + position.coords.longitude        +
						'\nAltitude: '          + position.coords.altitude         +
						'\nAccuracy: '          + position.coords.accuracy         +
						'\nAltitude Accuracy: ' + position.coords.altitudeAccuracy +
						'\nHeading: '           + position.coords.heading          +
						'\nSpeed: '             + position.coords.speed            +
						'\nTimestamp: '         + position.timestamp
					);
	},

	onError:function(error) {
            alert('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
  },


	t_width:0,
	t_height:0,
	selectPictureSource:function(type) {
		if(type == "background"){
			personalPage.callback = personalPage.encodeBackground;
			personalPage.t_width = 1080;
			personalPage.t_height = 1920;
		} else if(type == "profilePicture"){
			personalPage.callback = personalPage.encodeProfilePicture;
			personalPage.t_width = 500;
			personalPage.t_height = 500;
		} else {
		}
		uiControl.dialog(["Photo Library", "Camera"],[personalPage.selectPhotoAlbum, personalPage.selectCamera]);
	},

	selectPhotoAlbum:function(){
		block_Reload = true;
		var camera = navigator.camera;
		camera.getPicture(personalPage.callback, personalPage.error, { quality: 80, allowEdit:true, targetWidth: personalPage.t_width, targetHeight: personalPage.t_height, sourceType: camera.PictureSourceType.PHOTOLIBRARY,destinationType: camera.DestinationType.FILE_URI});
	},

  selectCamera:function(){
		block_Reload = true;
		var camera = navigator.camera;
	 	camera.getPicture(personalPage.callback, personalPage.error, { quality: 80, allowEdit:true, targetWidth: personalPage.t_width, targetHeight: personalPage.t_height, sourceType: camera.PictureSourceType.CAMERA,destinationType: camera.DestinationType.FILE_URI});
	},

  encodeBackground:function(imageData) {
		if(imageData != null){
			personalPage.imageB = imageData;
			document.getElementById('userBloc').style.backgroundImage = "url("+ personalPage.imageB +")";
		} else {
			alert("Failed to Retrieve Photo.");
		}
		setTimeout(function () {
			block_Reload = false;
		}, 500);
  },

	encodeProfilePicture:function(imageData) {
		if(imageData != null){
			personalPage.imageP = imageData;
			document.getElementById('user_Profile_Picture').style.backgroundImage = "url("+ personalPage.imageP +")";
		} else {
			alert("Failed to Retrieve Photo.");
		}
		setTimeout(function () {
			block_Reload = false;
		}, 500);
	},

	finalize:function() {
		db.transaction(function(tx) {
			if(personalPage.imageP != null){
				personalPage.waitingOnProfileUpload = true;
				network.uploadPicture(personalPage.imageP, personalPage.setUserProfilePicture);
			}
			if( personalPage.imageB != null){
				personalPage.waitingOnBackgrounUpload = true;
				network.uploadPicture(personalPage.imageB, personalPage.setUserBackgroundPicture);
			}
			tx.executeSql('UPDATE user SET display_name = "' + document.getElementById("username_edit").value + '" where uid = ' + uid);
			tx.executeSql('UPDATE user SET bio = "' + document.getElementById("bio_edit").value + '" where uid = ' + uid);
			var selector = ['theme_light', 'theme_dark'];
			for(var i = 0; i < selector.length; i++){
				if(document.getElementById(selector[i]).classList.contains('active_theme')){
					tx.executeSql('UPDATE user SET theme = "' + selector[i].substr(6) + '" where uid = ' + uid);
					uiControl.setTheme(selector[i].substr(6));
				}
			}
			personalPage.imageP = null;
			personalPage.imageB = null;
			document.getElementById("user_Display_Name").textContent = document.getElementById("username_edit").value;
			document.getElementById("user_bio").textContent = document.getElementById("bio_edit").value;
			personalPage.taredown();
			page_log.pop();
		}, dataManager.errorCB);
	},

	waitingOnProfileUpload:false,
	setUserProfilePicture:function(mid) {
		db.transaction(function(tx) {
			if(mid != null){
				tx.executeSql('UPDATE user SET profilePicture = "' + mid + '" where uid = ' + uid);
				dataManager.getMedia(mid, 'profile_sidebar_link_image');
				personalPage.waitingOnProfileUpload = false;
				personalPage.uploadResults();
			} else {
				alert("Profile Picture failed to upload.");
			}
		}, dataManager.errorCB);
	},

	waitingOnBackgrounUpload:false,
	setUserBackgroundPicture:function(mid) {
		db.transaction(function(tx) {
			if(mid != null){
				tx.executeSql('UPDATE user SET profileBackground = "' + mid + '" where uid = ' + uid);
				personalPage.waitingOnBackgrounUpload = false;
				personalPage.uploadResults();
			} else {
				alert("Profile Picture failed to upload.");
			}
		}, dataManager.errorCB);
	},

	uploadResults:function() {
		if(!personalPage.waitingOnBackgrounUpload && !personalPage.waitingOnProfileUpload){
			db.transaction(function(tx) {
				tx.executeSql('SELECT * FROM user where uid = '+ uid, [], network.updateUser, dataManager.errorCB);
			} ,dataManager.error);
		}
	},

  error:function(message) {
   //alert(message);
  }

};

var calander = {

	slide_animation: null,
	slide_step: 0,
	c_pos: 0,

	setup:function() {
		calander.setupCallBack();
	},

	setupCallBack:function(){
		document.getElementById("calander").style.left = "0%";
		document.getElementById("calander").style['z-index'] = page_log.length +3;
	},

	taredown:function() {
		document.getElementById("calander").style.display = "none";
		document.getElementById("calander").style['z-index'] = 0;
		document.getElementById("calander").style.left = "0%";
	},

	sideGrab:function() {
		touches = event.touches[0];
		calander.c_pos = 0;
		if(calander.slide_animation != null){
			clearInterval(calander.slide_animation);
		}
		document.getElementById("calander").style.display = "block";
		calander.slide_animation = setInterval(this.slideUpdater,10);
	},

	slideUpdater:function() {
		//document.getElementById("calander").style["-webkit-transform"] = "translateX(" + (touches.pageX -width)+ "px)";
		//uiControl.updateDebugger("xPos",(touches.pageX -width));
		document.getElementById("userBloc").style["-webkit-transform"] = "translateX(" + (touches.pageX -width)+ "px)";
	},

	dragOut:function () {
		touches = event.touches[0];
	},


	onDragEnd:function() {
		calander.c_pos  = touches.pageX -width;
		clearInterval(calander.slide_animation);
		if(calander.c_pos  <= -width*0.4){
			if(page_log[page_log.length-1] != "calander"){
				page_log.push("calander");
			}
			calander.slide_step = (width + calander.c_pos)/15;
			calander.slide_animation = setInterval(calander.popOut, 6);
		} else{
			if(page_log[page_log.length-1] == "calander"){
				page_log.pop();
			}
			calander.slide_step = (width + calander.c_pos)/18;
			calander.slide_animation = setInterval(calander.popIn, 6);
		}
	},

	popOut:function () {
		calander.c_pos -= calander.slide_step;
		if(calander.c_pos  > -width){
			document.getElementById("userBloc").style["-webkit-transform"] = "translateX(" + calander.c_pos+ "px)";

		} else{
			clearInterval(calander.slide_animation);
			document.getElementById("userBloc").style["-webkit-transform"] = "translateX("+ -width +"px)";
		}
	},

	popIn:function () {
		calander.c_pos += calander.slide_step;
		if(calander.c_pos < 0){
			document.getElementById("userBloc").style["-webkit-transform"] = "translateX(" + calander.c_pos+ "px)";
		} else{
			clearInterval(calander.slide_animation);
			document.getElementById("calander").style.display = "none";
			document.getElementById("userBloc").style["-webkit-transform"] = "translateX(0px)";
		}
	}

};

var bloc = {

	id: null,
	c_bloc: null,
	mediaList: [],
	mediaIsOut: true,
	wasToggled: false,
	timer:0,

	c_pos:0,
	slide_step:0,
	container_animation: null,
	scrollAnimation: null,
	scrollLimit:0,
	containerPosition:0,

	setup:function(id) {
		if(bloc.id != parseInt(id)){
			bloc.id = parseInt(id);
			page_log_bid.push(bloc.id);
			bloc.reply_id = -1;
			if(!bloc.mediaIsOut){
				bloc.wasToggled = true;
			}

			db.transaction(bloc.getSetupInfo, dataManager.errorCB);
		}
	},

	setupCallBack:function(){
		document.getElementById("bloc_container").style.height = -bloc.scrollLimit+ "px";
		document.getElementById("bloc_blog_container").style.height = -bloc.scrollLimit*1.2+ "px";
		document.getElementById("bloc_blog_content").style.height = -bloc.scrollLimit*1.2+ "px";
		document.getElementById("bloc_content_container").style["-webkit-transform"] = "translateY(0px)";
		document.getElementById("bloc_container").style["-webkit-transform"] = "translateY(0px)";
		bloc.containerPosition = 0;

		uiControl.turnCurrentItemOff();

		document.getElementById("bloc").style.display = "block";
		document.getElementById("bloc").style['z-index'] = 1;
		uiControl.turnItemOn("bloc");
	},

	taredown:function() {
		uiControl.turnItemOff("bloc");
		if(!bloc.mediaIsOut){
			bloc.toggleOut();
		}
		clearInterval(bloc.heightListener);
		clearInterval(bloc.scrollAnimation);
		bloc.heightListener == null;
		bloc.scrollAnimation == null;
		bloc.wasToggled = false;
		setTimeout(function () {
			bloc.id = null;
			document.getElementById("bloc_media_content").scrollTop =  0;
			document.getElementById("bloc").style.display = "none";
			document.getElementById("bloc").style['z-index'] = 0;
		}, 200);
	},

	getSetupInfo:function(tx) {
		tx.executeSql('SELECT * FROM bloc where bid = '+ bloc.id, [], bloc.setupBloc, dataManager.errorCB);
	},

	setupBloc:function(tx, results) {
		bloc.c_bloc = results.rows.item(0);
		document.getElementById("bloc_title").textContent = bloc.c_bloc.title;
		document.getElementById("bloc_location").textContent = bloc.c_bloc.location;
		tx.executeSql('SELECT * FROM media_temp where bid = '+ bloc.c_bloc.bid, [], bloc.setupPictures, dataManager.errorCB);

	},

	setupPictures:function(tx, results) {
		var pictures = "";
		var piccounter = 0;
		for(var i = 0; i < results.rows.length; i++){
			bloc.mediaList.push(results.rows.item(i).mid);
			if(results.rows.item(i).mid == bloc.c_bloc.mid){
				document.getElementById("bloc_bg").style['background-image'] = "url('"+results.rows.item(i).data+"')";
			} else {
				switch(piccounter%3){
					case 0:
						pictures += "<div class='bloc_photo_row'>"+
													"<div class='bloc_photo_container c1' ontouchstart='bloc.pictureTouchStart();' onTouchEnd='bloc.selectiveSetup(\"picture\", "+ results.rows.item(i).mid +");'>"+
														"<img class='bloc_photo' src='"+ results.rows.item(i).data +"' />" +
													"</div>";
						break;
					case 1:
						pictures += "<div class='bloc_photo_container c2' ontouchstart='bloc.pictureTouchStart();' onTouchEnd='bloc.selectiveSetup(\"picture\", "+ results.rows.item(i).mid +");'>"+
														"<img class='bloc_photo' src='"+ results.rows.item(i).data +"' />" +
													"</div>";
						break;
					case 2:
						pictures += "<div class='bloc_photo_container c3' ontouchstart='bloc.pictureTouchStart();' onTouchEnd='bloc.selectiveSetup(\"picture\", "+ results.rows.item(i).mid +");'>"+
													"<img class='bloc_photo' src='"+ results.rows.item(i).data +"' />" +
												"</div>"+
											"</div>";
						break;

				}
				piccounter++;
			}
		}
		bloc.scrollLimit = -(((Math.ceil(piccounter/3)-2)*(width*0.587))+ (width*0.1375));

		if(pictures != "" ){
			document.getElementById("bloc_media_content").innerHTML = pictures;
		} else {
			document.getElementById("bloc_media_content").innerHTML =	"<div class='bloc_empty_content'>" +
																																	"No Posts Yet :(" +
																																"</div>";
		}
		tx.executeSql('SELECT username,uid FROM user where uid = '+ bloc.c_bloc.uid, [], bloc.setupUserInfo, dataManager.errorCB);
		tx.executeSql('SELECT cid, reply, text, username, user.uid FROM comments Left Outer Join user ON comments.uid = user.uid where bid =' + bloc.c_bloc.bid, [], bloc.setupDiscussion, dataManager.errorCB);
	},


	comments:[],
	comment_connections:[],
	visited:[],
	visible: [],
	base_id:0,
	setupDiscussion:function(tx, results) {
		bloc.base_id = results.rows.item(0).cid;
		bloc.comments = [];
		bloc.comment_connections = [];

		for(var i = 0; i < results.rows.length; i++){
			bloc.comments[i] = results.rows.item(i);
			bloc.comment_connections.push(results.rows.item(i).reply);
			if(bloc.comments[i].reply == -1){
				bloc.visible[i] = true;
			} else {
				bloc.visible[i] = false;
			}
		}
		bloc.loadDiscussion();
	},

	loadDiscussion:function() {
		var discussion = "";
		bloc.visited = [];
		bloc.children =[];
		for(var i = 0; i < bloc.comments.length ; i++){
			bloc.children.push(0);
		}
		for(var i = 0; i < bloc.comments.length ; i++){
			if(bloc.visited.indexOf(i) == -1){
				bloc.visited.push(i);
				discussion += bloc.generateThreadHead(i);
			}
		}
		document.getElementById('bloc_blog_content').innerHTML = discussion;
		for(var i = 0; i <  bloc.comments.length ; i++){

				document.getElementById("bloc_comment_"+i+"_poster").textContent = '@'+ bloc.comments[i].username;
				if(bloc.comments[i].reply != -1){
					var parent = bloc.comments[i].reply;
					document.getElementById('bloc_comment_parent_'+i).textContent = "@" + bloc.comments[parent].username+ " ";
				}
				document.getElementById("bloc_comment_children_"+i).textContent = bloc.children[i];
				document.getElementById("bloc_comment_"+i+"_text").textContent = bloc.comments[i].text;
			if(!bloc.visible[i]){
				document.getElementById("bloc_comment_"+ i + "_reply_container").style.display = "none";
			}

		}
	},

	generateThreadHead:function(id) {
		var comment = '<div class="comment">'+
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_picture" src="img/'+ bloc.comments[id].uid +'_profile_picture_icon.jpg" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'profilePicture\', '+ id +');"/>';
		if(uid == bloc.comments[id].uid){
			comment += '<div class="comment_info_container self" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		} else{
			comment += '<div class="comment_info_container" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		}
		comment +=  				'<p id="bloc_comment_'+ id +'_poster" class="bloc_comment_poster"></p>'+
												'<img id="bloc_comment_'+ id +'_like" class ="bloc_comment_like" src="assets/heart_unfilled.png" />'+
												'<p id="bloc_comment_'+ id +'_text" class="bloc_comment_text"></p>'+
												'<p class="bloc_comment_children"><span class="bloc_comment_cute_little_plus">+</span><span id="bloc_comment_children_'+ id +'">0</span></p>'+
											'</div>'+
											'<div id="bloc_comment_'+ id +'_reply_container" class="bloc_comment_reply_container">'+ bloc.findChildren(id) +'</div>'+
									'</div>';
		return comment;
	},

	generateReply:function(id) {
		var comment = '<div id="bloc_comment_'+ id +'" class="comment">' +
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_picture reply_picture" src="img/'+ bloc.comments[id].uid +'_profile_picture_icon.jpg" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'profilePicture\', '+ id +');" />';
		if(uid == bloc.comments[id].uid){
			comment += '<div class="comment_info_container reply_content self" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		} else{
			comment += '<div class="comment_info_container reply_content" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		}
		comment +=    			'<p id="bloc_comment_'+ id +'_poster" class="bloc_comment_poster"></p>'+
												'<img id="bloc_comment_'+ id +'_like" class ="bloc_comment_like" src="assets/heart_unfilled.png" />'+
												'<p class="bloc_comment_text"><span id="bloc_comment_parent_'+id+'" class="bloc_comment_parent"></span><span id="bloc_comment_'+ id +'_text" ></span></p>'+
												'<p class="bloc_comment_children"><span class="bloc_comment_cute_little_plus">+</span><span id="bloc_comment_children_'+ id +'">0</span></p>'+
											'</div>'+
										 '<div id="bloc_comment_'+ id +'_reply_container" class="bloc_comment_reply_container">'+ bloc.findChildren(id) +'</div>'+
										'</div>';
		return comment;
	},

	children:[],
	findChildren:function(id) {
		var char = "";
		for(var i = 0; i < bloc.comments.length; i++){
			var nextChild = bloc.comment_connections.indexOf(id,i);
			if(nextChild != -1 && bloc.visited.indexOf(nextChild) == -1){
				bloc.visited.push(nextChild);
				char += bloc.generateReply(nextChild);
				bloc.children[id] += (bloc.children[nextChild]+1);
				i = nextChild+1;
			}
		}
		return char;
	},

	setupUserInfo:function(tx, results) {
		document.getElementById("bloc_creater").textContent = "@"+results.rows.item(0).username;
		document.getElementById("bloc_creater").ontouchend = "userBloc.setup("+results.rows.item(0).uid+");";
		bloc.setupCallBack();
	},

	onTabTouch:function() {
		touches = event.touches[0];
		bloc.c_pos = 0;
		if(bloc.container_animation != null){
			clearInterval(bloc.container_animation);
		}
		bloc.container_animation = setInterval(bloc.tabUpdater,5);
	},

	tabUpdater:function() {
		document.getElementById("bloc_media_container").style["-webkit-transform"] = "translateX(" + (0+(touches.pageX-width))+ "px)";
		document.getElementById("bloc_blog_container").style["-webkit-transform"] = "translateX(" + (touches.pageX-width)+ "px)";
		document.getElementById("bloc_bottom_line").style["-webkit-transform"] = "translateX(" + (-(3*(touches.pageX-width))/20)+ "px)";
	},

	onTabSlide:function() {
		touches = event.touches[0];
	},

	onTabTouchEnd:function() {
		bloc.c_pos  = touches.pageX -width;
		clearInterval(bloc.container_animation);
		bloc.slide_step = (width + bloc.c_pos)/10;
		if(bloc.c_pos  >= -width*0.5){
			bloc.container_animation = setInterval(bloc.mediaOut, 6);
		} else{
			bloc.container_animation = setInterval(bloc.blogOut, 6);
			bloc.loadDiscussion();
		}
	},

	blogOut:function () {
		bloc.c_pos -= bloc.slide_step;
		if(bloc.c_pos  > -width){
			document.getElementById("bloc_media_container").style["-webkit-transform"] = "translateX(" + (0+bloc.c_pos)+ "px)";
			document.getElementById("bloc_blog_container").style["-webkit-transform"] = "translateX(" + bloc.c_pos+ "px)";
			document.getElementById("bloc_bottom_line").style["-webkit-transform"] = "translateX(" + (-(3*bloc.c_pos)/20)+ "px)";
		} else {
			clearInterval(bloc.slide_animation);
			document.getElementById("bloc_media_container").style["-webkit-transform"] = "translateX(" + width+ "px)";
			document.getElementById("bloc_blog_container").style["-webkit-transform"] = "translateX(" + -width+ "px)";
			document.getElementById("bloc_bottom_line").style["-webkit-transform"] = "translateX(" +  ((3*width)/20) + "px)";
			document.getElementById("bloc_blog").classList.add("active");
			document.getElementById("bloc_media").classList.remove("active");
			bloc.mediaIsOut = false;
		}
	},

	mediaOut:function () {
		bloc.c_pos += bloc.slide_step;
		if(bloc.c_pos < 0){
			document.getElementById("bloc_media_container").style["-webkit-transform"] = "translateX(" + (0+bloc.c_pos)+ "px)";
			document.getElementById("bloc_blog_container").style["-webkit-transform"] = "translateX(" + bloc.c_pos+ "px)";
			document.getElementById("bloc_bottom_line").style["-webkit-transform"] = "translateX(" + (-(3*bloc.c_pos)/20)+ "px)";
		} else{
			clearInterval(bloc.slide_animation);
			document.getElementById("bloc_media_container").style["-webkit-transform"] = "translateX(0px)";
			document.getElementById("bloc_blog_container").style["-webkit-transform"] = "translateX(0px)";
			document.getElementById("bloc_bottom_line").style["-webkit-transform"] = "translateX(0)";
			document.getElementById("bloc_media").classList.add("active");
			document.getElementById("bloc_blog").classList.remove("active");
			bloc.mediaIsOut = true;
		}
	},

	toggleOut:function() {
		if(bloc.container_animation != null){
			clearInterval(bloc.container_animation);
		}
		bloc.wasToggled = true;
		if(!document.getElementById("bloc_media").classList.contains("active")){
			bloc.c_pos = -width;
			bloc.slide_step = width/18;
			bloc.container_animation = setInterval(bloc.mediaOut, 6);
		} else{
			bloc.c_pos = 0;
			bloc.slide_step = width/18;
			bloc.container_animation = setInterval(bloc.blogOut, 6);
		}
	},

	dy:0,
	scrollStart:function() {
		first_touch = event.touches[0];
		bloc.dy = 0;
		clearInterval(bloc.scrollAnimation);
		clearInterval(bloc.deceleration);
		if(bloc.scrollAnimation != null || bloc.deceleration != null){
			bloc.scrollAnimation = null;
			bloc.deceleration = null;
		}
		bloc.scrollAnimation = setInterval(bloc.containerUpdater, 5);
		bloc.timer = performance.now();
	},

	lastLoad:0,
	containerUpdater:function() {
		var cpos = (bloc.dy+bloc.containerPosition);
		if(cpos <=0){
			if( cpos >= (-width*0.45)){
				document.getElementById("bloc_content_container").style["-webkit-transform"] = "translateY(" + cpos + "px)";

			} else {
				document.getElementById("bloc_content_container").style["-webkit-transform"] = "translateY(" + -(width*0.445) + "px)";
			}
			if(cpos >= bloc.scrollLimit){
				document.getElementById("bloc_container").style["-webkit-transform"] = "translateY(" + (cpos) + "px)";
			}
		}
	},

	scrollMove:function() {
		bloc.dy = event.touches[0].pageY - first_touch.pageY;
	},

	deceleration:null,
	scrollFinalize:function() {
		clearInterval(bloc.scrollAnimation);
		bloc.scrollAnimation = null;

		bloc.timer = performance.now() - bloc.timer;
		var velocity = 5*(bloc.dy/bloc.timer)+1;
		if(bloc.dy+bloc.containerPosition >= bloc.scrollLimit){
			bloc.containerPosition += bloc.dy;

		} else {
			document.getElementById("bloc_container").style["-webkit-transform"] = "translateY(" + bloc.scrollLimit + "px)";
			bloc.containerPosition = bloc.scrollLimit;
		}
		bloc.dy = 0;

		bloc.deceleration = setInterval(function() {
			bloc.containerPosition += velocity;
			velocity -= ((velocity)/12).toPrecision(6);

			if(bloc.containerPosition < bloc.scrollLimit){
				velocity == 0;
				bloc.containerPosition = bloc.scrollLimit;
			} else if(bloc.containerPosition >= 0){
				velocity == 0;
				bloc.containerPosition = 0 ;
			}
			bloc.containerUpdater();
			if(Math.abs(velocity) < 0.1){
				clearInterval(bloc.deceleration);
				bloc.deceleration = null;
			}
		}, 15);
	},


	last_id: -1,
	last_tap:0,
	double_tap: false,
	selectiveSetup:function(page_ID, id) {
		if(bloc.dy < 10 && bloc.dy > -10){
			switch (page_ID) {
				case 'profilePicture':
						if((performance.now()- bloc.last_tap) > 200){
							setTimeout(function () {
								if(!bloc.double_tap){
									//userBloc.setup(id);
								} else {
									//alert("LIKED LiKE A BAWS");
									document.getElementById('bloc_comment_'+ id + '_like').src = 'assets/heart_filled.png';
									document.getElementById('bloc_comment_'+ id + '_like').style.opacity = '1.0';
									bloc.double_tap = false;
								}
							}, 200);
							bloc.last_tap = performance.now();
						} else {
							bloc.double_tap = true;
						}
					break;
				case 'picture':
					fullScreenMedia.setup(id);
					break;
				case 'comment_tap':
					if((performance.now()- bloc.last_tap) > 200){
						setTimeout(function () {
							if(!bloc.double_tap){
								if(document.getElementById('bloc_comment_'+ id +'_reply_container').style.display == "none"){
									bloc.visible[id] = true;
								} else {
									bloc.visible[id] = false;
								}
								bloc.loadDiscussion();
							} else {
								bloc.replyComment(id);
								//document.getElementById('bloc_comment_textarea').focus();
								bloc.double_tap = false;
							}
							document.getElementById('bloc_blog_content');
						}, 200);
						bloc.last_tap = performance.now();
					} else {
						bloc.double_tap = true;
					}
					break;
					case 'title_tap':
						if(!bloc.mediaIsOut && (performance.now()- bloc.last_tap) > 200){
							setTimeout(function () {
								if(!bloc.mediaIsOut && bloc.double_tap){
									bloc.startThread();
									bloc.double_tap = false;
								}
							}, 200);
							bloc.last_tap = performance.now();
						} else {
							bloc.double_tap = true;
						}
						break;
				case 'confirm':
					//alert("comment submit");
					if(document.getElementById("bloc_comment_textarea").value != ""){
						bloc.reply_ID = id;
						db.transaction(bloc.submitComment, dataManager.errorCB);
					} else {
						alert("Your Comment is blank!");
					}
					break;
				case 'reply_backout':
						document.getElementById("bloc_comment_reply").remove();
					break;
				default:
					alert("UNHANDLED PAGE: " + page_ID + "\nID: " + id);
			}
			bloc.last_id = id;
		}
	},

	startThread:function() {
		if(document.getElementById("bloc_comment_reply") != null){
			document.getElementById("bloc_comment_reply").remove();
		}
		document.getElementById('bloc_comment_'+ id +'_reply_container').style.display = "block";
		var comment = '<div id="bloc_comment" class="comment">' +
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_reply_cancel" src="assets/cancel.png" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'reply_backout\', '+uid+');" />'+
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_reply_confirm" src="assets/confirm.png" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'confirm\', '+uid+');" />'+
											'<div class="comment_info_container reply_content self" >'+
		    								'<p id="bloc_comment_'+ id +'_poster" class="bloc_comment_poster"></p>'+
												'<textarea id="bloc_comment_textarea" class="bloc_comment_textarea" autofocus rows=3 maxlengh=140></textarea>'+
												'<p class="bloc_comment_children"><span class="bloc_comment_cute_little_plus">+</span><span id="bloc_comment_children_'+ id +'">0</span></p>'+
											'</div>'+
										'<div id="bloc_comment_'+ id +'_reply_container" class="bloc_comment_reply_container"></div>'+
									'</div>';
		var comment_node = document.createElement("DIV");
		comment_node.innerHTML= comment;
		document.getElementById('bloc_blog_content').insertBefore(comment_node, document.getElementById('bloc_blog_content').childNodes[0]);
	},

	reply_id: -1,
	replyComment:function(id) {
		bloc.reply_id = id;
		if(document.getElementById("bloc_comment_reply") != null){
			document.getElementById("bloc_comment_reply").remove();
		}
		document.getElementById('bloc_comment_'+ id +'_reply_container').style.display = "block";
		var comment = '<div id="bloc_comment_reply" class="comment">' +
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_reply_cancel" src="assets/cancel.png" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'reply_backout\', '+uid+');" />'+
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_reply_confirm" src="assets/confirm.png" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'confirm\', '+uid+');" />'+
											'<div class="comment_info_container reply_content self" >'+
											'<img id="bloc_comment_'+ id +'_like" class ="bloc_comment_like" src="assets/heart_unfilled.png" />'+

												'<p id="bloc_comment_'+ id +'_poster" class="bloc_comment_poster"></p>'+
												'<textarea id="bloc_comment_textarea" class="bloc_comment_textarea" autofocus rows=3 maxlengh=140></textarea>'+
												'<p class="bloc_comment_children"><span class="bloc_comment_cute_little_plus">+</span><span id="bloc_comment_children_'+ id +'">0</span></p>'+
											'</div>'+
										'<div id="bloc_comment_'+ id +'_reply_container" class="bloc_comment_reply_container"></div>'+
									'</div>';
		var comment_node = document.createElement("DIV");
		comment_node.innerHTML= comment;
		document.getElementById('bloc_comment_'+ id +'_reply_container').insertBefore(comment_node, document.getElementById('bloc_comment_'+ id +'_reply_container').childNodes[0]);

	},

	submitComment:function(tx) {
			tx.executeSql('INSERT INTO comments(cid, reply, uid, bid, text) VALUES ('+ comment_number +', '+ bloc.reply_id +', '+ uid +', '+ bloc.c_bloc.bid +' , "'+document.getElementById("bloc_comment_textarea").value +'")');
			comment_number++;
			tx.executeSql('SELECT * FROM comments Left Outer Join user ON comments.uid = user.uid where bid =' + bloc.c_bloc.bid, [], bloc.setupDiscussion, dataManager.errorCB);
	}

};

var fullScreenMedia ={

	setup:function(id) {
		db.transaction(function(tx){
			tx.executeSql('SELECT * FROM media_temp where mid = '+ id, [], fullScreenMedia.mediaSetup, dataManager.errorCB);
		}, dataManager.errorCB);
	},

	mediaSetup:function(tx, results) {
		var media = results.rows.item(0);
		switch (media.type) {
			case 0:
				document.getElementById('fullScreenMedia_piture').src = media.data;
				break;
			default:
				alert("UNHANDLED MEDIA TYPE:" + media.type);
		}

		fullScreenMedia.setupCallBack();
	},

	setupCallBack:function(){
		document.getElementById("fullScreenMedia").style.display = "block";
		document.getElementById("fullScreenMedia").style['z-index'] = 1;
		uiControl.turnItemOn("fullScreenMedia");
		setTimeout(function () {
			document.getElementById('navbar_top').style.backgroundColor = "rgba(255, 177, 110, 0.0)";

		}, 100);
	},

	taredown:function() {
		if (current_page == null) {
			page_log.pop();
			uiControl.turnCurrentItemOff();
		}
		document.getElementById('navbar_top').style.backgroundColor = "rgba(255, 177, 110, 1.0)";
		uiControl.turnItemOff("fullScreenMedia");
		setTimeout(function () {
			document.getElementById("fullScreenMedia").style.display = "none";
			document.getElementById("fullScreenMedia").style['z-index'] = 0;
		}, 200);
	}
};

var founders ={

	reversed: false,

	setup:function() {
		founders.setupCallBack();
	},


	setupCallBack:function(){
		uiControl.turnCurrentItemOff();
		document.getElementById("founders").style.display = "block";
		document.getElementById("founders").style['z-index'] = 1;
		uiControl.turnItemOn("founders");
	},

	taredown:function() {
		uiControl.turnItemOff("founders");
		setTimeout(function () {
			document.getElementById("founders").style.display = "none";
			document.getElementById("founders").style['z-index'] = 0;
		}, 200);
	},

	reverseDirection:function() {
		if(founders.reversed){
			document.getElementById("founders_faces").style['-webkit-animation'] = "rotate_ccw 3000ms linear infinite";
			document.getElementById("founder_face_1").style['-webkit-animation'] = "rotate_cw 3000ms linear infinite";
			document.getElementById("founder_face_2").style['-webkit-animation'] = "rotate_cw 3000ms linear infinite";
			document.getElementById("founder_face_3").style['-webkit-animation'] = "rotate_cw 3000ms linear infinite";
			founders.reversed = false;
		} else {
			document.getElementById("founders_faces").style['-webkit-animation'] = "rotate_cw 3000ms linear infinite";
			document.getElementById("founder_face_1").style['-webkit-animation'] = "rotate_ccw 3000ms linear infinite";
			document.getElementById("founder_face_2").style['-webkit-animation'] = "rotate_ccw 3000ms linear infinite";
			document.getElementById("founder_face_3").style['-webkit-animation'] = "rotate_ccw 3000ms linear infinite";
			founders.reversed = true;
		}
	}
};
