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
