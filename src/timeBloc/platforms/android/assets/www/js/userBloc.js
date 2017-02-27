var userBloc = {

    setup: function(id) {
      uid.push(id);

      id.toLowerCase();
      document.getElementById('user_Profile_Picture').src = "img/"+ id +"_profile_picture.jpg";
      document.getElementById('userBloc_background').src = "img/"+ id +"_profile_background.jpg";
    }
};
