var touches = [];
var first_touch;

var width;
var height;
var movement;

var page_log = [];
var page_log_uid = [];
var uid = 1;

var timer;

var online = false;
var sidebar_isOn = false;
var blocFeed_bloc_on = false;
var isFollowing = false;

var db;

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
    db = window.openDatabase("timeBloc", "0.1", "dmgr", 200000);
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
    tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Primary Key ASC, username, display_name, bio, theme, birthday, location, date_joined)');
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

    //template for regex: tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined) VALUES (<uid>, "<username>", "<display_name>", "<bio>", "<theme>", "<birthday>", "<location>", "<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined) VALUES (1, "hyte", "John Gregg", "Lead Programmer on timeBloc.<br><br>Too Cool 5 You.", "dark", "January, 5th", "WV - USA", "<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined) VALUES (2, "the_reelist_condor", "Connor Thomas", "BYU<br>Also a noob.", "dark", "December, 4th", "UT - USA","<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined) VALUES (3, "serbian_slayer", "Brane Pantovic", "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.", "light", "March, 14th", "NY - USA","<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, bio, theme, birthday, location, date_joined) VALUES (0, "user", "default_user", "<message>", "light", "NULL, 00th", "N/A - N/A", "<date_joined>")');

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

  successCB:function() {
    //alert("Tables Created");
    //db.transaction(dataManager.queryDB, dataManager.errorCB);
  },

  querySuccess:function (tx, results) {
    alert(results.rows.item(0).uid);
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
  }
};

var uiControl = {

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
        //alert("DB INITILIZED");
        network.initialize();
        //uiControl.populate();
        blocFeed.setup();
        //userBloc.setup(3);
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
          default:
						uiControl.turnCurrentItemOff();

        }
        switch (page_log.pop()) {
          case 'userBloc':
              userBloc.setup(page_log_uid.pop());
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
      if(page_log.length > 1){
        var id = page_log[page_log.length-1];
        uiControl.turnItemOff(id);
				window[id]["taredown"];
      }
    },

    turnItemOn:function(id){
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

  setup:function() {
    this.requestData();
    uiControl.turnCurrentItemOff();
    uiControl.turnItemOn("blocFeed");
		document.getElementById("blocFeed").style['z-index'] = 100;
  },

  taredown:function() {
		uiControl.turnCurrentItemOff();
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
		weight:[0, 0.166, 0.166, 0.166, 0.166, 0.166, 0.166],
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
    },

		setupCallBack:function(){
			document.getElementById("userBloc").style['z-index'] = 500;
			uiControl.turnItemOn("userBloc");
		},

		taredown:function() {
			clearInterval(userBloc.animation);
			uiControl.turnItemOff("userBloc");
			setTimeout(function () {
				document.getElementById("userBloc").style['z-index'] = 0;
			}, 200);
		},

		getUserInfo:function(tx){
      tx.executeSql('SELECT * FROM user where uid = '+ userBloc.id, [], userBloc.setupUserElements, dataManager.errorCB);
    },

		setupUserElements: function(tx,results) {
      var user = results.rows.item(0);
			userBloc.c_user = user;
      page_log_uid.push(user.uid);
      document.getElementById('user_Profile_Picture').src = "img/"+ user.uid +"_profile_picture.jpg";
      document.getElementById('userBloc_background').src = "img/"+ user.uid +"_profile_background.jpg";
      document.getElementById('user_Display_Name').innerHTML = user.display_name;
      document.getElementById('user_Handle').innerHTML = "@" + user.username;
			document.getElementById('user_Birthday').innerHTML = user.birthday;
			document.getElementById('user_Location').innerHTML = user.location;
      document.getElementById('user_bio').innerHTML = user.bio;
			userBloc.setTheme(user.theme);
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
			userBloc.getOtherInfo(tx);
		},

    getOtherInfo:function(tx){
      tx.executeSql('SELECT * FROM follower_list where fuid = '+ userBloc.id, [], userBloc.setupFollowers, dataManager.errorCB);
      tx.executeSql('SELECT * FROM follower_list where uid = '+ userBloc.id, [], userBloc.setupFollowing, dataManager.errorCB);
      tx.executeSql('SELECT * FROM follower_list where uid = '+ uid +' AND fuid = ' + userBloc.id + ' OR uid = '+ userBloc.id +' AND fuid = ' + uid, [], userBloc.setFollowButton, dataManager.errorCB);
    },

		setupFollowers: function(tx,results) {
			document.getElementById('followers').innerHTML = dataManager.numberToString(results.rows.length);
		},

		setupFollowing: function(tx,results) {
			document.getElementById('following').innerHTML = dataManager.numberToString(results.rows.length);
		},

		setFollowButton: function(tx,results) {
			//alert(results.rows.length);
			userBloc.resetFollowButton();
			if (userBloc.id == uid) {
				document.getElementById('user_Follow_Status').style.border = '.8vw dashed #bfbfbf';
				document.getElementById('user_Follow_Status').style.background = '#bfbfbf';
				document.getElementById('user_Follow_Status_message').innerHTML = "Edit Profile";
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
    },

    onProfilePictureTouch:function(){
      touches = event.touches[0];
			var direction = Math.atan2(touches.pageY -  window.innerHeight*0.43, touches.pageX - window.innerWidth*0.50) + Math.PI;
			userBloc.start_angle = 360*(direction/(2*Math.PI));
			if(userBloc.animation == null){
				userBloc.animation = setInterval(this.translateCircle,10);
			} else {
				clearInterval(userBloc.animation);
				userBloc.animation = setInterval(this.translateCircle,10);
			}
			userBloc.sw = 16;
			userBloc.op = 0.5;
      document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = 0.5;
			document.getElementById("user_Profile_slice_" + userBloc.position_list[0]).style['stroke-width'] = 16 + '%';
			timer = performance.now();
		},

    onProfilePictureDrag:function() {
      touches = event.touches[0];
      userBloc.current_angle = userBloc.current_angle%360;
      var cd = 360*((Math.atan2(touches.pageY -  window.innerHeight*0.43, touches.pageX - window.innerWidth*0.50)+Math.PI)/(2*Math.PI));
      userBloc.delta_a = userBloc.start_angle-cd;
      userBloc.start_angle = cd;
    },

    onProfilePictureEnd:function() {
      clearInterval(userBloc.animation);
      var wedge_angle = 360/(userBloc.weight.length);
			document.getElementById("weeks").innerHTML = ((performance.now() - timer)/1000).toPrecision(3);

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
					document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+ userBloc.current_angle +"deg)";
					clearInterval(userBloc.animation);
				}
			} else {
				userBloc.delta_a -= userBloc.delta_a*step;
				if(userBloc.delta_a >= -1){
					document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+ userBloc.current_angle +"deg)";
					clearInterval(userBloc.animation);
					//userBloc.animation = setInterval(userBloc.extendPreview, 5);
				}
			}
			document.getElementById('user_Profile_breakdown_container').style['-webkit-transform'] = "rotate("+(userBloc.current_angle - userBloc.delta_a)+"deg)";
			document.getElementById("user_Profile_breakdown_" + userBloc.position_list[0]).style.opacity = userBloc.op;
		},

		extendPreview:function() {

		},

    toBeImplemented:function(ev) {
      alert('To be Implemented');
    },

		setTheme:function(id) {
			var classes = ['user_Display_Name', 'user_Handle', 'user_Follow_Status',
										 'user_bio', 'user_Birthday', 'user_Location', 'page_break',
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

	  resetFollowButton:function() {
			document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
			document.getElementById('user_Follow_Status').style.border = '.8vw dashed #bfbfbf';
			//document.getElementById('user_Follow_Status').style.background = "#f2f2f2";
			document.getElementById('user_Follow_Status_message').innerHTML = "Follow";
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
      document.getElementById('user_Follow_Status_message').innerHTML = "Following";
      isFollowing = true;
    },

    setUnfollow: function(tx) {
        tx.executeSql('DELETE FROM follower_list where uid = '+ uid +' AND fuid = '+ userBloc.id);
    },

    unfollow: function() {
      document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
      document.getElementById('user_Follow_Status_message').innerHTML = "Follow";
      isFollowing = false;
    }

};

var personalPage = {

	setup:function() {
		document.getElementById('current_Profile_Picture').src = "img/"+ userBloc.c_user.uid +"_profile_picture.jpg";
		document.getElementById('current_background').src = "img/"+ userBloc.c_user.uid +"_profile_background.jpg";

		/*
		document.getElementById('user_Display_Name').innerHTML = userBloc.c_user.display_name;
		document.getElementById('user_Handle').innerHTML = "@" + userBloc.c_user.username;
		document.getElementById('user_Birthday').innerHTML = userBloc.c_user.birthday;*
		document.getElementById('user_Location').innerHTML = userBloc.c_user.location;
		document.getElementById('user_bio').innerHTML = userBloc.c_user.bio;
		userBloc.setTheme(userBloc.c_user.theme);*/
		document.getElementById("personalPage").style['z-index'] = 700;
		personalPage.setupCallBack();
	},

	setupCallBack:function(){
		document.getElementById("personalPage").style['z-index'] = 700;
		uiControl.turnItemOn("personalPage");
	},

	taredown:function() {
		uiControl.turnItemOff("personalPage");
		setTimeout(function () {
			document.getElementById("personalPage").style['z-index'] = 0;
		}, 200);
	}

};

var bloc = {

	setup:function() {
		personalPage.setupCallBack();
	},

	setupCallBack:function(){
		document.getElementById("bloc").style['z-index'] = 700;
		uiControl.turnItemOn("bloc");
	},

	taredown:function() {
		uiControl.turnItemOff("bloc");
		setTimeout(function () {
			document.getElementById("bloc").style['z-index'] = 0;
		}, 205);
	}

};
