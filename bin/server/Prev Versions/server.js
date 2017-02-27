
var Server;
var login_server_host;
var content_server;

var infoBroker = {
  init:function() {
    console.log("[Database Log] Setup");
    login.init();
    if(login.db != null){
      console.log("[Database Log] Login Database Active.");
    } else {
      console.log("[Database Log] Login Database Failed to Initialize.");
    }
    content.init();
    if(content.db != null){
      console.log("[Database Log] Content Database Active.");
    } else {
      console.log("[Database Log] Content Database Failed to Initialize.");
    }
    console.log("[Database Log] Setup Complete");

    server_manager.init();
  }
};

var login = {

  init:function functionName() {
    login.db = require('sql');
    login.db.setDialect('mysql');
    login.user = login.db.define({name:'user',
          columns:['username', 'uid', 'date', 'secret', 'last_ip']});
  },
  db:null,
  user: null
};

var content = {

    init:function functionName() {
      content.db = require('sql');
      content.db.setDialect('mysql');
      content.user = content.db.define({name:'user',
        columns:['uid', 'username', 'display_name', 'bio', 'theme', 'birthday', 'location', 'date_joined', 'profilePicture', 'profileBackground']});
      content.follower_list = content.db.define({name: 'follower_list',
        columns:['uid', 'id', 'type', 'date_folowed']});
      content.like_list = content.db.define({name: 'like_list',
        columns:['uid', 'id', 'type', 'date_liked']});
      content.media = content.db.define({name: 'media',
        columns:['mid', 'uid', 'bid','type', 'date_posted']});
      content.bloc = content.db.define({name: 'bloc',
        columns:['bid', 'uid', 'plid','title', 'mid', 'location', 'date_posted']});
      content.permission_list = content.db.define({name: 'permission_list',
        columns:['plid', 'uid', 'bid', 'permission_level', 'date_added']});
      content.comments = content.db.define({name: 'comments',
        columns:['cid', 'reply', 'uid', 'bid', 'text']});
    },

    db:null,
    user: null,
    follower_list: null,
    like_list:null,
    media:null,
    bloc:null,
    permission_list:null,
    comments:null,
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

            socket.on('request', function(details){
                    var today = new Date();
                    console.log('[' + today.toLocaleDateString() +' : '+today.toLocaleTimeString()+'] Login request:' + details);
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
                    details = details.split(":sep:");
                    console.log('\t[' + today.toLocaleDateString() +' : '+today.toLocaleTimeString()+'] Login request: ' + details[0]);
                    var query = login.user.select(login.user.star()).from(login.user).toQuery();
                    console.log(query.text);

                    if(query.values.length != 0){
                      //query.split();
                      socket.emit("login_succeed", "1");
                    } else {
                      socket.emit("login_failed", "");
                    }
             });

             socket.on('user_create_request', function(details){
                     var today = new Date();
                     details = details.split(":sep:");
                     console.log('\t[' + today.toLocaleDateString() +' : '+today.toLocaleTimeString()+'] Login Create request: ' + details[0]);
                     var query = login.user.select(login.user.star()).from(login.user).where(login.user.username.equals(details[0])).toQuery();
                     console.log(query.text);
                     if(query.values.length == 1){
                       socket.emit("user_create_request_succeed", "1");
                     } else {
                       socket.emit("user_create_request_failed", "");
                     }
              });

            socket.on('disconnect', function() {
              console.log('[LOGIN SERVER] User: ('+ socket.id +') disconnected.');
            });
    });
  }

};

infoBroker.init();
