var touches = [];
var first_touch;

var width;
var height;
var movement;

var page_log = [];
var page_log_uid = [];
var uid = 3;

var timer;

var online = false;
var sidebar_isOn = false;
var blocFeed_bloc_on = false;
var isFollowing = false;

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
	    },

	    onDeviceReady: function() {
	        //alert("DEVICE READY");
	        dataManager.initialize();
	        //alert("DB INITILIZED")
	        network.initialize();
					uiControl.setDebugger();
	        //uiControl.populate();
					setTimeout(function () {
						blocFeed.setup();
					}, 700);
	        //userBloc.setup(1);
	    },

			onBackKeyDown: function() {
				if(sidebar_isOn){
					sidebar.slide();
				} else if(page_log.length > 1){
					if(page_log[page_log.length-1] == 'userBloc'){
						page_log_uid.pop();
					}

					switch (page_log.pop()) {
						case 'userBloc':
							userBloc.taredown();
							break;
						case 'blocFeed':
							blocFeed.taredown();
							break;
						case 'personalPage':
							personalPage.taredown();
							break;
						case 'dialog':
							uiControl.select(-2);
							break;
						case 'calander':
							calander.slide_step = (width)/50;
							calander.slide_animation = setInterval(calander.popIn, 4);
						default:
							uiControl.turnCurrentItemOff();

					}
					switch (page_log.pop()) {
						case 'userBloc':
								userBloc.setup(page_log_uid.pop());
							break;
						case 'personalPage':
								personalPage.setup();
								break;
						default:
							blocFeed.setup();
					}
				}
			},

			onlineCheck:function(){
				online = true;
			},

			offlineCheck:function(){
				online = false;
			}
};

var network = {
  ftp:21,

  initialize:function() {
    //alert("Server Attempt:");
    //var server = new WebSocket("ws://echo.websocket.org ", "80");
    //alert("Server Attempt: " + server.readyState);
  }

};

var dataManager = {

  initialize:function() {
		height = screen.availHeight;
		width = screen.availWidth;
		uiControl.updateDebugger("screenX", height);
		uiControl.updateDebugger("screenY", width);
		document.body.style.minHeight = document.body.clientHeight + "px";
		document.body.style.minWidth = document.body.clientWidth + "px";
    db = window.openDatabase("timeBloc", "0.1", "dmgr", 20000000);
    db.transaction(dataManager.populateDB, dataManager.errorCB);
  },

  //user (uid, username, display_name, date_joined)
  //bloc (bid, uid , message);
  //follower_list(uid, fuid, date_joined)
  populateDB:function(tx) {

    //remove after live host server
    tx.executeSql('DROP TABLE IF EXISTS personal');
    tx.executeSql('DROP TABLE IF EXISTS user');
    tx.executeSql('DROP TABLE IF EXISTS bloc');
    tx.executeSql('DROP TABLE IF EXISTS follower_list');
		tx.executeSql('DROP TABLE IF EXISTS weight_list');

    tx.executeSql('CREATE TABLE IF NOT EXISTS personal (session_key Primary Key ASC, uid Refrences USER uid)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Primary Key ASC, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS bloc (bid Primary Key ASC, uid Refrences USER uid, message, posted_time)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS follower_list (uid Refrences USER uid, fuid Refrences USER uid, date_followed)');
		tx.executeSql('CREATE TABLE IF NOT EXISTS weight_list (uid Refrences USER uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6)');

	  //temp inserts
    //template for regex: tx.executeSql('INSERT INTO personal(session_key, uid) VALUES (<session_id>, <uid>)');
    tx.executeSql('INSERT INTO personal(session_key, uid) VALUES (1, 1)');

		//tx.executeSql('INSERT INTO User(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (<uid> , <weight_0>, <weight_1>, <weight_2>, <weight_3>, <weight_4>, <weight_5>, <weight_6>)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (0, 1, 1, 1, 1, 1, 1, 1)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (1, 0.1, 0.5, 0.8, 0.6, 0.4, 0.8, 0.6)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (2, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, -1)');
		tx.executeSql('INSERT INTO weight_list(uid, weight_0, weight_1, weight_2, weight_3, weight_4, weight_5, weight_6) VALUES (3, 0.1, 0.25, 0.65, 1, -1, -1, -1)');

    //template for regex: tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined, profilePicture, profileBackground) VALUES (<uid>, "<username>", "<display_name>", "<bio>", "<theme>", "<birthday>", "<location>", "<date_joined>", "img/<uid>_profile_picture.jpg", "img/<uid>_profile_background.jpg")');
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

    //template for regex: tx.executeSql('INSERT INTO bloc(bid, userID, message) VALUES (<bid>, "<username>", "<message>")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (0, 0, "Oldest")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (1, 0, "Max Length is 23 Characters")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (2, 0, "PlaceHolder")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (3, 1, "This works somtimes")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (4, 0, "PlaceHolder")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (5, 3, "That moment when...")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (6, 2, "BYU eats dicks!")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (7, 2, "We also drank Grape Juice")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (8, 2, "I made a thing")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (9, 3, "Butt Empire")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (10, 2, "BYU eats BIG dicks!")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (11, 3, "~something in serbian~")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (12, 1, "Max Length is 23 Characters")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (13, 0, "PlaceHolder")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (14, 1, "I am a post.")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (15, 3, "Posts Dont exist?")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (16, 1, "I have to write 20...")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (17, 2, "HOT Mormom Singles!")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (18, 3, "Vroom Vroom")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (19, 2, "Insightful Questions?")');
    tx.executeSql('INSERT INTO bloc(bid, uid, message) VALUES (20, 1, "This works somtimes")');

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
				template = "<div class='dbg_item'>" +	uiControl.metrics[i] + " | " + uiControl.values[i] + "</div>";
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

		removeDebugger:function(id) {
			if(uiControl.metrics.indexOf(id) >  0){
				var pos = uiControl.metrics.indexOf(id);
				uiControl.metrics.splice(pos);
				uiControl.values.splice(pos);
				uiControl.setDebugger();
			}
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
        var id = page_log[page_log.length-1];
        //uiControl.turnItemOff(id);
				window[id]["taredown"];
      }
    },

    turnItemOn:function(id){
			if(page_log[page_log.length-1]=='personalPage' && id != 'dialog'){
				personalPage.taredown();
				page_log.pop();
			}
		 if(page_log[page_log.length-1] != id){
        page_log.push(id);
      }
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

		},

		dialog:function(options, cbk) {
			uiControl.callback = cbk;
			var option;
			var dialog = "";
			for(var i = options.length-1; i >= 0; i--){
				option = "";
				if(i == options.length-1){
					option += "<div class='option top' ontouchend='uiControl.select("+(i)+");'>";
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
			} else if(id == -1)  {
				page_log.pop();
			}
			uiControl.turnItemOff("dialog");
			setTimeout(function () {
				document.getElementById("dialog").style['z-index'] = 0;
			}, 200);

		}

};

var sidebar = {

  init: function() {
    touches = event.touches;
    first_touch = touches[0].pageX;
    width = document.body.clientWidth *0.7;
  },

  slide: function() {
    if(!sidebar_isOn){
      sidebar.slideOn();
    } else {
      sidebar.slideOff();
    }
  },

  slideOn: function(){
    if(!sidebar_isOn){
      document.getElementById('sidebar').classList.remove('off');
      document.getElementById('sidebar').classList.add('on');
      document.getElementById('sidebar').style.left = 0 +'%';
      sidebar_isOn = true;
    }
  },

  slideOff: function(){
    if(sidebar_isOn){
      document.getElementById('sidebar').classList.remove('on');
      document.getElementById('sidebar').classList.add('off');
      document.getElementById('sidebar').style.left = -70 +'%';
      sidebar_isOn = false;
    }
  },

  move: function() {
    touches = event.touches;
    movement = (touches[0].pageX - first_touch);
    if(movement < 0){
      document.getElementById('sidebar').style.left = movement + 'px';
    }
  },

  rubberband: function() {
    //alert(-width*0.2);
    if(movement < -width*0.4){
      //sidebar.slideOff();
    } else {
      //sidebar.slideOn();
    }
  }
};

var blocFeed ={

  //all page data load events here
  setup:function() {
		uiControl.turnCurrentItemOff();
    this.requestData();
  },

  //all ui load evenets here
  setupCallBack:function() {
		uiControl.turnItemOn("blocFeed");
		document.getElementById("userBloc").style.display = "block";

    document.getElementById("blocFeed").style['z-index'] = page_log.length+1;
  },

  taredown:function() {
		uiControl.turnItemOff("blocFeed");
		document.getElementById("userBloc").style.display = "none";
		document.getElementById("blocFeed").style['z-index'] = 0;
  },

  requestData:function() {
    db.transaction(blocFeed.getBlocs, dataManager.errorCB);
  },

  getBlocs:function(tx){
    tx.executeSql('SELECT * FROM BLOC', [], blocFeed.generateFeed, dataManager.errorCB);
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

    id: 0,
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
      userBloc.id = parseInt(id);
			uiControl.turnCurrentItemOff();
      db.transaction(userBloc.getUserInfo, dataManager.errorCB);
			calander.setup();
    },

		setupCallBack:function(){
			document.getElementById("userBloc").style.display = "block";
			document.getElementById("userBloc").style['z-index'] = page_log.length+4;
			uiControl.turnItemOn("userBloc");
		},

		taredown:function() {
			clearInterval(userBloc.animation);
			uiControl.turnItemOff("userBloc");

			uiControl.removeDebugger("angle");
			uiControl.removeDebugger("time");
			uiControl.removeDebugger("PL");
			setTimeout(function () {
				document.getElementById("userBloc").style['z-index'] = 0;
				document.getElementById("userBloc").style.display = "none";
				calander.taredown();
			}, 200);

		},

		getUserInfo:function(tx){
      tx.executeSql('SELECT * FROM user where uid = '+ userBloc.id, [], userBloc.setupUserElements, dataManager.errorCB);
    },

		setupUserElements: function(tx,results) {
      var user = results.rows.item(0);
			userBloc.c_user = user;
      page_log_uid.push(user.uid);
			document.getElementById('userBloc').style.backgroundImage = "url("+ user.profileBackground+")";
      document.getElementById('user_Profile_Picture').src = user.profilePicture;
      document.getElementById('user_Display_Name').textContent = user.display_name;
      document.getElementById('user_Handle').textContent = "@" + user.username;
			document.getElementById('user_Info').textContent = user.birthday + " | " + user.location;
      document.getElementById('user_bio').textContent = user.bio;
			uiControl.setTheme(user.theme);

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
			uiControl.updateDebugger("PL", userBloc.position_list);
			userBloc.generateSelf();
			userBloc.getOtherInfo(tx);
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
			userBloc.setupCallBack();
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
			uiControl.updateDebugger("angle", userBloc.current_angle.toPrecision(3));
    },

    onProfilePictureEnd:function() {
      clearInterval(userBloc.animation);
      var wedge_angle = 360/(userBloc.weight.length);
			uiControl.updateDebugger("time",((performance.now() - timer)/1000).toPrecision(3));

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
			uiControl.updateDebugger("PL", userBloc.position_list);
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
          //document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).classList.toggle("expand");
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).classList.toggle("darken");
          document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style["stroke-width"] = "23%";
          document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 1.0;

				}
			} else {
				userBloc.delta_a -= userBloc.delta_a*step;
				if(userBloc.delta_a >= -1){
          clearInterval(userBloc.animation);
					document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+ userBloc.current_angle +"deg)";
          //document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).classList.toggle("expand");
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
      } else if(confirm("Are you sure you want to unfollow?")){
        db.transaction(userBloc.setUnfollow, dataManager.errorCB);

      }
      db.transaction(userBloc.getOtherInfo, dataManager.errorCB);
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

			userBloc.setup(userBloc.c_user.uid);
		}, 200);
	},

	getGeoLocation:function() {
		 navigator.geolocation.getCurrentPosition(onSuccess, onError);
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
	 	camera.getPicture(personalPage.callback, this.error, { quality: 50, sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,destinationType: Camera.DestinationType.DATA_URL});
	},

  selectCamera:function(){
		var camera = navigator.camera;
	 	camera.getPicture(personalPage.callback, this.error, { quality: 50, sourceType: Camera.PictureSourceType.CAMERA,destinationType: Camera.DestinationType.DATA_URL});
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
			document.getElementById('user_Profile_Picture').src = personalPage.imageP;
		}
	},

	finalize:function() {
		db.transaction(personalPage.gatherInfo, dataManager.errorCB);
		personalPage.taredown();
		page_log.pop();
		//app.onBackKeyDown();
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
		document.getElementById("user_Display_Name").value = document.getElementById("username_edit").value;
		document.getElementById("user_bio").value = document.getElementById("bio_edit").value;
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
		setTimeout(function () {
			document.getElementById("calander").style.display = "none";
			document.getElementById("calander").style['z-index'] = 0;
			document.getElementById("calander").style.left = "0%";
		}, 200);
	},

	sideGrab:function() {
		touches = event.touches[0];
		if(calander.slide_animation != null){
			clearInterval(calander.slide_animation);
		}
		document.getElementById("calander").style.display = "block";
		calander.slide_animation = setInterval(this.slideUpdater,5);
	},

	slideUpdater:function() {
		//document.getElementById("calander").style["-webkit-transform"] = "translateX(" + (touches.pageX -width)+ "px)";
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

	setup:function() {
		personalPage.setupCallBack();
	},

	setupCallBack:function(){
		document.getElementById("bloc").style['z-index'] = page_log.length+2;
		uiControl.turnItemOn("bloc");
	},

	taredown:function() {
		uiControl.turnItemOff("bloc");
		setTimeout(function () {
			document.getElementById("bloc").style['z-index'] = 0;
		}, 205);
	}

};
