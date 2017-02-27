var touches = [];
var first_touch;

var width;
var height;
var movement;

var currentPage;
var lastPage;
var page_log = [];
var page_lod_uid = [];
var uid = 1;

var sidebar_isOn = false;
var blocFeed_bloc_on = false;
var isFollowing = false;

var db;

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
    tx.executeSql('DROP TABLE IF EXISTS user');
    tx.executeSql('DROP TABLE IF EXISTS bloc');
    tx.executeSql('DROP TABLE IF EXISTS follower_list');

    tx.executeSql('CREATE TABLE IF NOT EXISTS user (uid Primary Key ASC, username, display_name, date_joined)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS bloc (bid Primary Key ASC, uid Refrences USER uid, message)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS follower_list (uid Refrences USER uid, fuid Refrences USER uid, date_followed)');


    //temp inserts
    //template for regex: tx.executeSql('INSERT INTO User(uid, username, display_name, date_joined) VALUES (<uid>, "<username>", "<display_name>", "<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, date_joined) VALUES (1, "hyte", "John", "<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, date_joined) VALUES (2, "condor", "Connor", "<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, date_joined) VALUES (3, "brain", "Brane", "<date_joined>")');
    tx.executeSql('INSERT INTO User(uid, username, display_name, date_joined) VALUES (0, "user", "default_user", "<date_joined>")');

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
    },

    onDeviceReady: function() {
        //alert("DEVICE READY");
        dataManager.initialize();
        //alert("DB INITILIZED");
        uiControl.populate();
        blocFeed.requestData();
        uiControl.setPage('blocFeed');
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

    setPage: function(id) {
      lastPage = document.getElementById(page_log[page_log.length-1]);
      if(lastPage){
        lastPage.classList.remove('on');
        lastPage.classList.add('off');
      }
      currentPage = document.getElementById(id);
      currentPage.classList.remove('off');
      currentPage.classList.add('on');
      page_log.push(id);
    },

    onBackKeyDown: function() {
      //alert(page_log[page_log.length-2]
      if(sidebar_isOn){
        sidebar.slide();
      } else if(page_log.length > 1){
        var lastSet = page_log.pop();
        var nextSet = page_log.pop();
        page_log.push(lastSet);
        if(nextSet == 'userBloc'){
          uid.pop();
          blocFeed.setup(uid.pop());
        }
        uiControl.setPage(nextSet);
        nextSet = page_log.pop();
        page_log.pop();
        page_log.push(nextSet);
      }
      //alert(page_log.toString());
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
    document.getElementById('sidebar').classList.remove('off');
    document.getElementById('sidebar').classList.add('on');
    document.getElementById('sidebar').style.left = 0 +'%';
    sidebar_isOn = true;
  },

  slideOff: function(){
    document.getElementById('sidebar').classList.remove('on');
    document.getElementById('sidebar').classList.add('off');
    document.getElementById('sidebar').style.left = -70 +'%';
    sidebar_isOn = false;
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

  requestData:function() {
    db.transaction(blocFeed.getBlocs, dataManager.errorCB);
  },

  getBlocs:function(tx){
    tx.executeSql('SELECT * FROM BLOC', [], blocFeed.generateFeed, dataManager.errorCB);
  },

  generateFeed:function(tx, results) {
    var bf = document.getElementById('blocFeed');
    var full_bloc = "";
    for(var i = results.rows.length-1; i >=0 ; i--){
      full_bloc += blocFeed.generateBloc(results.rows.item(i));
    }
    bf.innerHTML = full_bloc;
  },

  generateBloc:function(b){
    var basic_template = "<div class='blocFeed_container'>"+
                              "<div class='blocFeed_bloc_top'>" +
                              "<a href='#userBloc' ontouchend='sidebar.slideOff();uiControl.setPage(\"userBloc\");userBloc.setup(<username>);'>" +
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

    setup:function(id) {
      userBloc.id = id;
      db.transaction(userBloc.getUserInfo, dataManager.errorCB);
      db.transaction(userBloc.getBlocs, dataManager.errorCB);
      db.transaction(userBloc.getOtherInfo, dataManager.errorCB);
    },

    getUserInfo:function(tx){
      tx.executeSql('SELECT * FROM user where uid = '+ userBloc.id, [], userBloc.setupUserElements, dataManager.errorCB);
    },

    getBlocs:function(tx){
      tx.executeSql('SELECT * FROM bloc where uid =' + userBloc.id, [], userBloc.generateSelf, dataManager.errorCB);
    },

    getOtherInfo:function(tx){
      tx.executeSql('SELECT * FROM follower_list where fuid = '+ userBloc.id, [], userBloc.setupFollowers, dataManager.errorCB);
      tx.executeSql('SELECT * FROM follower_list where uid = '+ userBloc.id, [], userBloc.setupFollowing, dataManager.errorCB);
      tx.executeSql('SELECT * FROM follower_list where uid = '+ uid +' AND fuid = ' + userBloc.id, [], userBloc.setFollowButton, dataManager.errorCB);
    },

    setupUserElements: function(tx,results) {
      var user = results.rows.item(0);
      page_lod_uid.push(user.uid);
      document.getElementById('user_Profile_Picture').src = "img/"+ user.uid +"_profile_picture.jpg";
      document.getElementById('userBloc_background').src = "img/"+ user.uid +"_profile_background.jpg";
      document.getElementById('user_Display_Name').innerHTML = user.display_name;
      document.getElementById('user_Handle').innerHTML = "@" + user.username;
    },

    generateSelf:function(tx, results) {
      var bf = document.getElementById('user_blocFeed');
      var full_bloc = "";
      for(var i = results.rows.length-1; i >=0 ; i--){
        full_bloc += userBloc.generateBloc(results.rows.item(i));
      }
      bf.innerHTML = full_bloc;
    },

    setupFollowers: function(tx,results) {
      document.getElementById('followers').innerHTML = dataManager.numberToString(results.rows.length);
    },

    setupFollowing: function(tx,results) {
      document.getElementById('following').innerHTML = dataManager.numberToString(results.rows.length);
    },

    setFollowButton: function(tx,results) {
      //alert(results.rows.length);
      if (userBloc.id == uid) {
        document.getElementById('user_Follow_Status').style.color = '#f2f2f2';
        document.getElementById('user_Follow_Status').style.background = '#cccccc';
        document.getElementById('user_Follow_Status').innerHTML = "Edit Profile";
        document.getElementById('user_Follow_Status').ontouchend = userBloc.toBeImplemented;
      } else if(results.rows.length == 1){
        userBloc.follow();
      } else {
        userBloc.unfollow();
      }
    },

    generateBloc:function(b){
      var basic_template = "<div class='ublocFeed_container'>"+
                                "<div class='ublocFeed_bloc_top'>" +
                                "<a href='#userBloc' >" +
                                "<img id='bloc_<bloc_id>_pic' class='ublocFeed_bloc_picture' src='img/<username>_profile_picture_icon.jpg'/>" +
                                "</a>" +
                                "<div class='ublocFeed_bloc_username' id='bloc_<bloc_id>_name'>" +
                                "</div>" +
                                "<div class='ublocFeed_bloc_title'>"+
                                " <p id='bloc_<bloc_id>_title'><message></p>" +
                                "</div>" +
                                "<a href='#Expanded' ontouchend='blocFeed.expand(<bloc_id>);'>" +
                                " <p id='blocFeed_bloc_expander_<bloc_id>' class='ublocFeed_bloc_expander'>^</p>"+
                                "</a>"+
                              "</div>"+
                            "</div>";
      basic_template = basic_template.replace(/<bloc_id>/g, b.bid);
      basic_template = basic_template.replace(/<username>/g, b.uid);
      basic_template = basic_template.replace(/<message>/g, b.message);
      return basic_template;
    },

    toBeImplemented:function(ev) {
      alert('To be Implemented');
    },

    toggleFollow:function() {
      if(!isFollowing){
        userBloc.follow();
        db.transaction(userBloc.setFollow, dataManager.errorCB);
      } else {
        userBloc.unfollow();
        db.transaction(userBloc.setUnfollow, dataManager.errorCB);
      }
      db.transaction(userBloc.getOtherInfo, dataManager.errorCB);
    },

    setFollow: function(tx) {
        tx.executeSql('INSERT INTO follower_list (uid, fuid, date_followed) VALUES ( '+ uid +', '+ userBloc.id+', "<date_joined>")');
    },

    setUnfollow: function(tx) {
        tx.executeSql('DELETE FROM follower_list where uid = '+ uid +' AND fuid = '+ userBloc.id);
    },

    unfollow: function() {
      document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
      document.getElementById('user_Follow_Status').color = 'white';
      document.getElementById('user_Follow_Status').style.background = '#ffc980';
      document.getElementById('user_Follow_Status').innerHTML = "Follow";
      isFollowing = false;
    },

    follow: function(){
      document.getElementById('user_Follow_Status').ontouchend = userBloc.toggleFollow;
      document.getElementById('user_Follow_Status').color = 'white';
      document.getElementById('user_Follow_Status').style.background = '#80ff80';
      document.getElementById('user_Follow_Status').innerHTML = "Following";
      isFollowing = true;
    }
};
