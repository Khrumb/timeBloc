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

var online = false;
var sidebar_isOn = false;
var blocFeed_bloc_on = false;
var isFollowing = false;

var version = "0.54.14";
var server = "http://98.236.77.7";
var login_server = server + ":750";
var content_server = server + ":700";

var db;

var app = {

	    initialize: function() {
	        this.bindEvents();
	    },

	    bindEvents: function() {
	        document.addEventListener('deviceready', this.onDeviceReady, false);
	        document.addEventListener('backbutton', this.onBackKeyDown, false);
	        document.addEventListener('online', this.onlineCheck, false);
	        document.addEventListener('offline', this.offlineCheck, false);
					//document.addEventListener('pause', this.onPause, false);
					//document.addEventListener('resume', this.onResume, false);
	    },

	    onDeviceReady: function() {
				uiControl.setDebugger();
	      dataManager.initialize();
	    },

			deviceReadyCallBack:function() {
				blocFeed.setup();
				//bloc.setup(1);
				//alert("setup called");
				setTimeout(function () {
					document.getElementById('base').style.display = "none";
					}, 200);
			},

			onBackKeyDown: function() {

				if(sidebar_isOn){
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
			},

			onResume:function() {
				network.getServerStatus();
			}


};

var network = {

	sendLoginRequest:function(username, password) {
		if(online){
			var socket = io(login_server);
			socket.on('connect', function () {
				uiControl.updateDebugger("Login_Server", "ONLINE");
				socket.emit("login_request", username+":sep:"+password);
			 });

			 socket.on('login_succeed', function (msg) {
 				socket.disconnect();
				uid = parseInt(msg);
				uiControl.turnCurrentItemOff();
				page_log.pop();
				uiControl.updateDebugger("Login_Server", "Logged In");
				app.deviceReadyCallBack();
 			 });

			 socket.on('login_failed', function () {
				login.loginFailed();
 				socket.disconnect();
				uiControl.updateDebugger("Login_Server", "Login Failed");
 			 });
		} else {
			alert("Phone Is offline.");
		}
	},

	sendCreateUserRequest:function(username, password, display_name) {
		if(online){
			var socket = io(login_server);
			socket.on('connect', function () {
				uiControl.updateDebugger("Login_Server", "ONLINE");
				socket.emit("user_create_request", username + ":sep:" + password +":sep:" + display_name);
			 });
			 socket.on('user_create_request_succeed', function (msg) {
 				socket.disconnect();
				uid = parseInt(msg);
				uiControl.turnCurrentItemOff();
				page_log.pop();
				uiControl.updateDebugger("Login_Server", "Account Created");
				app.deviceReadyCallBack();
 			 });
			 socket.on('user_create_request_failed', function () {
 				socket.disconnect();
				uiControl.updateDebugger("Login_Server", "Login Failed");
 			 });
		} else {
			alert("Phone Is offline.");
		}
	},

  getServerStatus:function() {
		if(online){
			var socket = io(content_server);
			socket.on('connect', function () {
				uiControl.updateDebugger("Content_Server", "ONLINE");
				socket.emit("ping");
				socket.disconnect();
			 });
			 socket.on('reconnect', function () {
 				socket.disconnect();
				uiControl.updateDebugger("Content_Server", "OFFLINE");
 			 });
		} else {
			alert("Phone Is offline.");
		}
  }

};

var dataManager = {

  initialize:function() {

		height = screen.availHeight;
		width = screen.availWidth;
		uiControl.updateDebugger("build", "pre-alpha");
		uiControl.updateDebugger("version", version);
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
		//alert(results.rows.item(0).uid);
		if(results.rows.length == 0){
			//network.sendCreateUserRequest();
			login.setup();
			setTimeout(function () {
				document.getElementById('base').style.display = "none";
				}, 200);
			//app.deviceReadyCallBack();
		} else {
			network.sendLoginRequest(results.rows.item(0).uid, results.rows.item(0).secret);
		}
	},

	resetUserData:function() {
		db.transaction(dataManager.resetDB, dataManager.errorCB);
	},

  //user (uid, username, display_name, date_joined)
  //bloc (bid, uid , message);
  //follower_list(uid, fuid, date_joined)
  populateDB:function(tx) {
    //remove after live host server

    tx.executeSql('DROP TABLE IF EXISTS user');
    tx.executeSql('DROP TABLE IF EXISTS bloc');
		tx.executeSql('DROP TABLE IF EXISTS bloc_temp');
		tx.executeSql('DROP TABLE IF EXISTS media');
		tx.executeSql('DROP TABLE IF EXISTS personal');
		tx.executeSql('DROP TABLE IF EXISTS comments');
		tx.executeSql('DROP TABLE IF EXISTS weight_list');
    tx.executeSql('DROP TABLE IF EXISTS follower_list');
		tx.executeSql('DROP TABLE IF EXISTS permission_list');



    tx.executeSql('CREATE TABLE IF NOT EXISTS personal (uid Refrences USER uid, session_key Primary Key)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Primary Key ASC, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground)');

		tx.executeSql('CREATE TABLE IF NOT EXISTS bloc_temp (bid Primary Key ASC, uid Refrences USER uid, message, posted_time)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS follower_list (uid Refrences USER uid, fuid Refrences USER uid, date_followed)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS weight_list (uid Refrences USER uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS media (mid Primary Key, uid Refrences USER uid, bid Refrences bloc bid, type, data)');
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

    //template for regex: tx.executeSql('INSERT INTO personal(session_key, uid) VALUES (<session_id>, <uid>)');

		//tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (<uid> , <weight_0>, <weight_1>, <weight_2>, <weight_3>, <weight_4>, <weight_5>, <weight_6>)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (0, 1, 1, 1, 1, 1, 1, 1)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (1, 0.1, 0.5, 0.8, 0.6, 0.4, 0.8, 0.6)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (2, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, -1)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (3, 0.1, 0.25, 0.65, 1, -1, -1, -1)');

    //template for regex: tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (<seq#>, "<username>", "<display_name>", "<bio>", "<theme>", "<birthday>", "<location>", "<date_joined>", "img/<uid>_profile_picture.jpg", "img/<uid>_profile_background.jpg")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (1, "hyte", "John Gregg", "Lead Programmer on timeBloc.", "dark", "January, 5th", "WV - USA", "<date_joined>", "img/1_profile_picture.jpg", "img/1_profile_background.jpg")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (2, "the_reelist_condor", "Connor Thomas", "BYU. Also a noob.", "dark", "December, 4th", "UT - USA", "<date_joined>", "img/2_profile_picture.jpg", "img/2_profile_background.jpg")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (3, "serbian_slayer", "Brane Pantovic", "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.", "light", "March, 14th", "NY - USA","<date_joined>", "img/3_profile_picture.jpg", "img/3_profile_background.jpg")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (0, "user", "default_user", "<message>", "light", "NULL, 00th", "N/A - N/A", "<date_joined>", "img/0_profile_picture.jpg", "img/0_profile_background.jpg")');

    //template for regex: tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES (<uid>, <fuid>, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 1, 2, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 1, 3, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 2, 1, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 2, 3, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 3, 1, "<date_joined>")');
    tx.executeSql('INSERT INTO follower_list( uid, fuid, date_followed) VALUES ( 3, 2, "<date_joined>")');


		//tx.executeSql('INSERT INTO picture(mid, uid, bid, type, data) VALUES (<seq#>, <uid>, <bid>, <type(0=picture)> <imagedata>)');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (1, 3, 0, 0, "img/1_bloc_bg.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (0, 3, 1, 0, "img/2_bloc_bg.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (3, 3, 1, 0,"img/bloc_1_1.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (4, 3, 1, 0, "img/bloc_1_2.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (5, 3, 1, 0, "img/bloc_1_3.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (6, 3, 1, 0, "img/bloc_1_4.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (7, 3, 1, 0, "img/bloc_1_5.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (8, 3, 1, 0, "img/bloc_1_6.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (9, 3, 1, 0, "img/bloc_1_7.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (10, 3, 1, 0, "img/bloc_1_8.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (11, 3, 1, 0, "img/bloc_1_9.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (12, 3, 1, 0, "img/bloc_1_10.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (13, 3, 1, 0, "img/bloc_1_11.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (14, 3, 1, 0, "img/bloc_1_12.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (15, 3, 1, 0, "img/bloc_1_13.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (16, 3, 1, 0, "img/bloc_1_14.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (17, 3, 1, 0, "img/bloc_1_15.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (18, 3, 1, 0, "img/bloc_1_1.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (19, 3, 1, 0, "img/bloc_1_2.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (20, 3, 1, 0, "img/bloc_1_3.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (21, 3, 1, 0, "img/bloc_1_4.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (22, 3, 1, 0, "img/bloc_1_5.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (23, 3, 1, 0, "img/bloc_1_6.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (24, 3, 1, 0, "img/bloc_1_7.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (25, 3, 1, 0, "img/bloc_1_8.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (26, 3, 1, 0, "img/bloc_1_9.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (27, 3, 1, 0, "img/bloc_1_10.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (28, 3, 1, 0, "img/bloc_1_11.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (29, 3, 1, 0, "img/bloc_1_12.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (30, 3, 1, 0, "img/bloc_1_13.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (31, 3, 1, 0, "img/bloc_1_14.jpg")');
		tx.executeSql('INSERT INTO media(mid, uid, bid, type, data) VALUES (32, 3, 1, 0, "img/bloc_1_15.jpg")');

		//tx.executeSql('INSERT INTO permission_list(pl_id, uid, bid, date_added) VALUES (<seq#>, <uid>, <bid>, <permission_level>, <current_data>)');
		tx.executeSql('INSERT INTO permission_list(plid, uid, bid, permission_level, date_added) VALUES (0, 3, 0, 5 ,"-Null-")');

		//tx.executeSql('INSERT INTO bloc(bid, uid, pl_id, title, mid, location, date) VALUES (<seq#>, <uid>, <pl_id>, "<title>",  <mid>, <location>, <current_date> )');
		tx.executeSql('INSERT INTO bloc(bid, uid, plid, title, mid, location) VALUES (0, 0, 0, "Default Bloc",  0, "NA - USA" )');
		tx.executeSql('INSERT INTO bloc(bid, uid, plid, title, mid, location) VALUES (1, 3, 0, "Brane Test",  0, "CO - USA" )');

    //template for regex: tx.executeSql('INSERT INTO bloc(bid, userID, message) VALUES (<bid>, "<username>", "<message>")');
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (0, 0, "Link to UID_0 - Default")');
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (1, 1, "Link to UID_1 - John")');
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (2, 2, "Link to UID_2 - Connor")');
    tx.executeSql('INSERT INTO bloc_temp(bid, uid, message) VALUES (3, 3, "Link to UID_3 - Brane")');

  },

  errorCB:function(err) {
      alert("Error processing SQL: "+ err.message);
  },

	getTheme:function(imgdata) {
		uiControl.updateDebugger("is in byte", 2*imgdata.length);
		return "light";
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

		decelerate:function() {

		}
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
		document.getElementById("login").style.display = "block";
		document.getElementById("login").style['z-index'] = 1;
		uiControl.turnItemOn("login");
	},

	taredown:function() {
		uiControl.turnItemOff("login");
		setTimeout(function () {
			document.getElementById('navbar_menu_button').style.opacity =1.0;
			document.getElementById('navbar_menu_button').ontouchstart = sidebar.slide;
			document.getElementById("login").style.display = "none";
			document.getElementById("login").style['z-index'] = 0;
		}, 200);
	},

	submit:function() {
		network.sendLoginRequest(document.getElementById('login_username').value, document.getElementById('login_password').value);
	},

	loginFailed:function() {
		document.getElementById('login_password').value = null;
		document.getElementById('login_username').value = null;
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
			network.sendCreateUserRequest(document.getElementById('login_username').value, document.getElementById('login_password').value, document.getElementById('display_name').value);
		}


	}

}

var blocFeed ={

  //all page data load events here
  setup:function() {
    this.requestData();
  },

  //all ui load evenets here
  setupCallBack:function() {
		uiControl.turnCurrentItemOff();
		document.getElementById("blocFeed").style.display = "block";
    document.getElementById("blocFeed").style['z-index'] = page_log.length+1;
		uiControl.turnItemOn("blocFeed");
  },

  taredown:function() {
		uiControl.turnItemOff("blocFeed");
		document.getElementById("blocFeed").style.display = "none";
		document.getElementById("blocFeed").style['z-index'] = 0;
  },

  requestData:function() {
    db.transaction(blocFeed.getBlocs, dataManager.errorCB);
  },

  getBlocs:function(tx){
    tx.executeSql('SELECT * FROM bloc_temp', [], blocFeed.generateFeed, dataManager.errorCB);
  },

  generateFeed:function(tx, results) {
    var bf = document.getElementById('blocFeed_slideable');
    var full_bloc = "";
    for(var i = results.rows.length-1; i >=0 ; i--){
      full_bloc += blocFeed.generateBloc(results.rows.item(i));
    }
    bf.innerHTML = full_bloc;
    blocFeed.setupCallBack();
  },

  generateBloc:function(b){
    var basic_template = "<div class='blocFeed_container'>"+
                              "<div class='blocFeed_bloc_top'>" +
                              "<a href='#userBloc' ontouchend='sidebar.slideOff();userBloc.setup(<username>);'>" +
                              "<img id='bloc_<bloc_id>_pic' class='blocFeed_bloc_picture' src='img/<username>_profile_picture_icon.jpg'/>" +
                              "</a>" +
                              "<div class='blocFeed_bloc_username' id='bloc_<bloc_id>_name'>" +
                              "</div>" +
                              "<div class='blocFeed_bloc_title'>"+
                              " <p id='bloc_<bloc_id>_title'><message></p>" +
                              "</div>" +
                              "<a href='#Expanded' ontouchend='blocFeed.expand(<bloc_id>);'>" +
                              " <p id='blocFeed_bloc_expander_<bloc_id>' class='blocFeed_bloc_expander'>^</p>"+
                              "</a>"+
                            "</div>"+
                          "</div>";
    basic_template = basic_template.replace(/<bloc_id>/g, b.bid);
    basic_template = basic_template.replace(/<username>/g, b.uid);
    basic_template = basic_template.replace(/<message>/g, b.message);
    return basic_template;
  },

  expand: function(id) {
    if(!blocFeed_bloc_on){
      blocFeed.expandOn(id);
    } else {
      blocFeed.expandOff(id);
    }
  },

  expandOn: function(id) {
    document.getElementById('blocFeed_bloc_expander_' + id).classList.remove('off');
    document.getElementById('blocFeed_bloc_expander_' + id).classList.add('on');
    blocFeed_bloc_on = true;
  },

  expandOff: function(id){
    document.getElementById('blocFeed_bloc_expander_' + id).classList.remove('on');
    document.getElementById('blocFeed_bloc_expander_' + id).classList.add('off');
    blocFeed_bloc_on = false;
  }

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

    setup:function(id) {
			if(userBloc.id != parseInt(id)){
				userBloc.id = parseInt(id);
				page_log_uid.push(id);
				db.transaction(userBloc.getUserInfo, dataManager.errorCB);
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
			uiControl.turnItemOff("userBloc");
			document.getElementById("userBloc_bloc_preview").style.display = "none";

			//uiControl.updateDebugger("td", "userBloc");
			document.getElementById("userBloc").style['z-index'] = 0;
			document.getElementById("userBloc").style.display = "none";
			userBloc.id = null;
			calander.taredown();
		},

		getUserInfo:function(tx){
      tx.executeSql('SELECT * FROM user where uid = '+ userBloc.id, [], userBloc.setupUserElements, dataManager.errorCB);
    },

		setupUserElements: function(tx,results) {
      var user = results.rows.item(0);
			userBloc.c_user = user;
			document.getElementById('userBloc').style.backgroundImage = "url("+ user.profileBackground+")";
      document.getElementById('user_Profile_Picture').style.backgroundImage = "url("+ user.profilePicture +")";
      document.getElementById('user_Display_Name').textContent = user.display_name;
      document.getElementById('user_Handle').textContent = "@" + user.username;
			document.getElementById('user_Info').textContent = user.birthday + " | " + user.location;
      document.getElementById('user_bio').textContent = user.bio;
			uiControl.setTheme(user.theme);
			userBloc.getOtherInfo(tx);
			userBloc.getWeights(tx);
    },

    getWeights:function(tx){
      tx.executeSql('SELECT * FROM weight_list where uid = ' + userBloc.id, [], userBloc.setWeights, dataManager.errorCB );
    },

		setWeights:function(tx, results) {
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
			userBloc.generateSelf();

			userBloc.setupCallBack();
		},

    getOtherInfo:function(tx){
      tx.executeSql('SELECT * FROM follower_list where fuid = '+ userBloc.id, [], userBloc.setupFollowers, dataManager.errorCB);
      tx.executeSql('SELECT * FROM follower_list where uid = '+ userBloc.id, [], userBloc.setupFollowing, dataManager.errorCB);
      tx.executeSql('SELECT * FROM follower_list where uid = '+ uid +' AND fuid = ' + userBloc.id + ' OR uid = '+ userBloc.id +' AND fuid = ' + uid, [], userBloc.setFollowButton, dataManager.errorCB);
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
			if (userBloc.id == uid) {
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
						if(results.rows.item(0).uid != uid){
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
    },

    onProfilePictureTouch:function(){
      touches = event.touches[0];
			var direction = Math.atan2(touches.pageY -  window.innerHeight*0.40, touches.pageX - window.innerWidth*0.50) + Math.PI;
			userBloc.start_angle = 360*(direction/(2*Math.PI));
			if(userBloc.animation == null){
				userBloc.animation = setInterval(this.translateCircle,20);
			} else {
				clearInterval(userBloc.animation);
				userBloc.animation = setInterval(this.translateCircle,20);
			}
			userBloc.sw = 16;
			userBloc.op = 0.5;
      if(document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.contains("darken")){
				document.getElementById("userBloc_bloc_preview").style.display = "none";
        document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.toggle("darken");
        document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 0.5;
  			document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style['stroke-width'] = 16 + '%';
  			//document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).classList.toggle("expand");
      }
      timer = performance.now();
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
      var wedge_angle = 360/(userBloc.weight.length);
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
			userBloc.animation = setInterval(userBloc.snapTo, 6);
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
			if(userBloc.delta_a > 0){
				userBloc.delta_a -= userBloc.delta_a*step;
				if(userBloc.delta_a <= 1){
          clearInterval(userBloc.animation);
					document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+ userBloc.current_angle +"deg)";
					document.getElementById("userBloc_bloc_preview").style.display = "block";
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.toggle("darken");
          document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style["stroke-width"] = "23%";
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 1.0;
				}
			} else {
				userBloc.delta_a -= userBloc.delta_a*step;
				if(userBloc.delta_a >= -1){
          clearInterval(userBloc.animation);
					document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+ userBloc.current_angle +"deg)";
					document.getElementById("userBloc_bloc_preview").style.display = "block";
					document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.toggle("darken");
          document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style["stroke-width"] = "23%";
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 1.0;
				}
			}
			document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+(userBloc.current_angle - userBloc.delta_a)+"deg)";
		},

		extendPreview:function() {

		},

	  resetFollowButton:function() {
			document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
			document.getElementById('user_Follow_Status').style.border = '.8vw dashed #bfbfbf';
			//document.getElementById('user_Follow_Status').style.background = "#f2f2f2";
			document.getElementById('user_Follow_Status_message').textContent = "Follow";
			document.getElementById('userFollowingStatus_fbarrow').style.display = "none";
			document.getElementById('userFollowingStatus_farrow').style.display = "none";
			document.getElementById('user_Follow_Status').style.background = 'none';
			isFollowing = false;
		},

    toggleFollow:function() {
      if(!isFollowing){
        db.transaction(userBloc.setFollow, dataManager.errorCB);
				db.transaction(userBloc.getOtherInfo, dataManager.errorCB);
      } else {
				uiControl.dialog(["Unfollow"],[function() {
					db.transaction(userBloc.setUnfollow, dataManager.errorCB);
					db.transaction(userBloc.getOtherInfo, dataManager.errorCB);
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

    setFollow: function(tx) {
        tx.executeSql('INSERT INTO follower_list (uid, fuid, date_followed) VALUES ( '+ uid +', '+ userBloc.id+', "<date_joined>")');
    },

    follow: function(){
      document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
      document.getElementById('user_Follow_Status').style['border-bottom-style'] = "solid";
      document.getElementById('user_Follow_Status').style['border-bottom-color'] = "#ffcb80";
      document.getElementById('user_Follow_Status').style['border-right-style'] = "solid";
      document.getElementById('user_Follow_Status').style['border-right-color'] = "#ffcb80";
      document.getElementById('userFollowingStatus_farrow').style.display = "block";
      document.getElementById('user_Follow_Status_message').textContent = "Following";
      isFollowing = true;
    },

    setUnfollow: function(tx) {
        tx.executeSql('DELETE FROM follower_list where uid = '+ uid +' AND fuid = '+ userBloc.id);
    },

    unfollow: function() {
      document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
      document.getElementById('user_Follow_Status_message').textContent = "Follow";
      isFollowing = false;
    }

};

var personalPage = {

	imageP: null,
	imageB: null,
	callback: null,

	setup:function() {
		//document.getElementById("user_Display_Name").prop('readonly', false);
		uiControl.setTheme("editing");
		document.getElementById("user_Profile_Picture").style['z-index'] = page_log.length+4;
		document.getElementById("current_userPP").style['z-index'] = page_log.length+5;
		document.getElementById("bgselect").style['z-index'] = page_log.length+5;
		document.getElementById("finished_profile").style['z-index'] = page_log.length+5;
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
		document.getElementById("current_userPP").style.display = "block";
		document.getElementById("bgselect").style.display = "block";


		document.getElementById("user_Follow_Status").style.display = "none";
		document.getElementById("user_Profile_breakdown_container").style.display = "none";

		personalPage.temp_user = userBloc.c_user;
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
			uiControl.setTheme(userBloc.c_user.theme);
		}, 200);
	},

	getGeoLocation:function() {
		 navigator.geolocation.getCurrentPosition(personalPage.onSuccess, onError);
	},

	onSuccess:function(position) {
			var element = document.getElementById('geolocation');
			element.innerHTML = 'Latitude: '          + position.coords.latitude         + '<br />' +
													'Longitude: '         + position.coords.longitude        + '<br />' +
													'Altitude: '          + position.coords.altitude         + '<br />' +
													'Accuracy: '          + position.coords.accuracy         + '<br />' +
													'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '<br />' +
													'Heading: '           + position.coords.heading          + '<br />' +
													'Speed: '             + position.coords.speed            + '<br />' +
													'Timestamp: '         + position.timestamp               + '<br />';
	},

	onError:function(error) {
            alert('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
  },

	selectPictureSource:function(type) {
		if(type == "background"){
			personalPage.callback = personalPage.encodeBackground;
		} else if(type == "profilePicture"){
			personalPage.callback = personalPage.encodeProfilePicture;
		} else {
		}
		uiControl.dialog(["Photo Library", "Camera"],[personalPage.selectPhotoAlbum, personalPage.selectCamera]);
	},

	selectPhotoAlbum:function(){
		var camera = navigator.camera;
	 	camera.getPicture(personalPage.callback, this.error, { quality: 100, sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,destinationType: Camera.DestinationType.DATA_URL, correctOrientation: true});
	},

  selectCamera:function(){
		var camera = navigator.camera;
	 	camera.getPicture(personalPage.callback, this.error, { quality: 100, sourceType: Camera.PictureSourceType.CAMERA,destinationType: Camera.DestinationType.DATA_URL, correctOrientation: true});
	},

  encodeBackground:function(imageData) {
		if(imageData != null){
			personalPage.imageB = "data:image/jpeg;base64," + imageData;
			document.getElementById('userBloc').style.backgroundImage = "url("+ personalPage.imageB +")";
		}
  },

	encodeProfilePicture:function(imageData) {
		if(imageData != null){
			personalPage.imageP = "data:image/jpeg;base64," + imageData;
			document.getElementById('user_Profile_Picture').style.backgroundImage = "url("+ personalPage.imageP +")";
		}
	},

	finalize:function() {
		db.transaction(personalPage.gatherInfo, dataManager.errorCB);
		personalPage.taredown();
		page_log.pop();
	},

	gatherInfo:function (tx) {
		if( personalPage.imageP != null){
			tx.executeSql('UPDATE user SET profilePicture = "' + personalPage.imageP + '" where uid = ' + userBloc.c_user.uid);
		}
		if( personalPage.imageB != null){
			tx.executeSql('UPDATE user SET profileBackground = "' + personalPage.imageB + '" where uid = ' + userBloc.c_user.uid);
		}
		tx.executeSql('UPDATE user SET display_name = "' + document.getElementById("username_edit").value + '" where uid = ' + userBloc.c_user.uid);
		tx.executeSql('UPDATE user SET bio = "' + document.getElementById("bio_edit").value + '" where uid = ' + userBloc.c_user.uid);
		personalPage.imageP = null;
		personalPage.imageB = null;
		document.getElementById("user_Display_Name").textContent = document.getElementById("username_edit").value;
		document.getElementById("user_bio").textContent = document.getElementById("bio_edit").value;

	},

  error:function() {
    //alert("NEGATIVE GHOST-RIDER");
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

	getSetupInfo:function(tx) {
		tx.executeSql('SELECT * FROM bloc where bid = '+ bloc.id, [], bloc.setupBloc, dataManager.errorCB);
	},

	setupBloc:function(tx, results) {
		bloc.c_bloc = results.rows.item(0);
		document.getElementById("bloc_title").textContent = bloc.c_bloc.title;
		document.getElementById("bloc_location").textContent = bloc.c_bloc.location;
		tx.executeSql('SELECT * FROM media where bid = '+ bloc.c_bloc.bid, [], bloc.setupPictures, dataManager.errorCB);

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
		tx.executeSql('SELECT * FROM user where uid = '+ bloc.c_bloc.uid, [], bloc.setupUserInfo, dataManager.errorCB);
		tx.executeSql('SELECT * FROM comments Left Outer Join user ON comments.uid = user.uid where bid =' + bloc.c_bloc.bid, [], bloc.setupDiscussion, dataManager.errorCB);
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
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_picture" src="'+ bloc.comments[id].profilePicture +'" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'userBloc\', '+bloc.comments[id].uid+');"/>';
		if(uid == bloc.comments[id].uid){
			comment += '<div class="comment_info_container self" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		} else{
			comment += '<div class="comment_info_container" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		}
		comment +=  				'<p id="bloc_comment_'+ id +'_poster" class="bloc_comment_poster"></p>'+
												'<p id="bloc_comment_'+ id +'_text" class="bloc_comment_text"></p>'+
												'<p class="bloc_comment_children"><span class="bloc_comment_cute_little_plus">+</span><span id="bloc_comment_children_'+ id +'">0</span></p>'+
											'</div>'+
											'<div id="bloc_comment_'+ id +'_reply_container" class="bloc_comment_reply_container">'+ bloc.findChildren(id) +'</div>'+
									'</div>';
		return comment;
	},

	generateReply:function(id) {
		var comment = '<div id="bloc_comment_'+ id +'" class="comment">' +
										'<img id="bloc_comment_'+ id +'_picture" class ="bloc_commenter_picture reply_picture" src="'+ bloc.comments[id].profilePicture +'" ontouchstart="bloc.pictureTouchStart();" ontouchend="bloc.selectiveSetup(\'userBloc\', '+bloc.comments[id].uid+');" />';
		if(uid == bloc.comments[id].uid){
			comment += '<div class="comment_info_container reply_content self" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		} else{
			comment += '<div class="comment_info_container reply_content" ontouchstart="bloc.pictureTouchStart();" onTouchEnd="bloc.selectiveSetup(\'comment_tap\', '+ id +');">';
		}
		comment +=    			'<p id="bloc_comment_'+ id +'_poster" class="bloc_comment_poster"></p>'+
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
		if(bloc.c_pos  >= -width*0.5){
			bloc.slide_step = (width + bloc.c_pos)/10;
			bloc.container_animation = setInterval(bloc.mediaOut, 6);
		} else{
			bloc.slide_step = (width + bloc.c_pos)/10;
			bloc.container_animation = setInterval(bloc.blogOut, 6);
		}
	},

	blogOut:function () {
		bloc.c_pos -= bloc.slide_step;
		if(bloc.c_pos  > -width){
			document.getElementById("bloc_media_container").style["-webkit-transform"] = "translateX(" + (0+bloc.c_pos)+ "px)";
			document.getElementById("bloc_blog_container").style["-webkit-transform"] = "translateX(" + bloc.c_pos+ "px)";
			document.getElementById("bloc_bottom_line").style["-webkit-transform"] = "translateX(" + (-(3*bloc.c_pos)/20)+ "px)";
			bloc.loadDiscussion();
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
		if(bloc.scrollAnimation != null){
			clearInterval(bloc.scrollAnimation);
		}
		bloc.scrollAnimation = setInterval(bloc.containerUpdater, 6);
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

	scrollFinalize:function() {
		clearInterval(bloc.scrollAnimation, 6);
		bloc.scrollAnimation = null;
		if(bloc.dy+bloc.containerPosition >= bloc.scrollLimit){
			bloc.containerPosition += bloc.dy;
			if(!bloc.mediaIsOut && Math.abs(bloc.lastLoad-bloc.containerPosition) > (1.5*width)){
				//uiControl.updateDebugger("reload", reloade);
				bloc.loadDiscussion();
				bloc.lastLoad = cpos;
			}
		} else {
			document.getElementById("bloc_container").style["-webkit-transform"] = "translateY(" + bloc.scrollLimit + "px)";
			bloc.containerPosition = bloc.scrollLimit;
			bloc.dy = 0;
		}
	},


	last_id: -1,
	last_tap:0,
	double_tap: false,
	selectiveSetup:function(page_ID, id) {
		if(bloc.dy < 10 && bloc.dy > -10){
			switch (page_ID) {
				case 'userBloc':
						if((performance.now()- bloc.last_tap) > 200){
							setTimeout(function () {
								if(!bloc.double_tap){
									userBloc.setup(id);
								} else {
									alert("Like :3");
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
								document.getElementById('bloc_comment_textarea').focus();
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
						if((performance.now()- bloc.last_tap) > 200){
							setTimeout(function () {
								if(bloc.double_tap){
									alert("title dt");
									bloc.startThread();
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
			tx.executeSql('SELECT * FROM media where mid = '+ id, [], fullScreenMedia.mediaSetup, dataManager.errorCB);
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
	},

	taredown:function() {
		if (current_page == null) {
			page_log.pop();
			uiControl.turnCurrentItemOff();
		}
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
