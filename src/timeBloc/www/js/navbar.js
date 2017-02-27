var touches = [];
var sidebar;
var width;

var navbar = {
  initialize(){
    width = document.body.clientWidth *0.38;
    sidebar = document.getElementById('sidebar');
    sidebar_button = document.getElementById('sidebar_button');

    sidebar_button.addEventListener('touchstart', function(event) {
      console.log('slidebar_button touched');
      sidebar.className='sidebar_out';
      sidebar.style.left = 0+'%';
    }, false);

    sidebar.addEventListener('touchstart', function(event) {
      console.log('Touch start.');
    }, false);

    sidebar.addEventListener('touchmove', function(event) {
      touches = event.touches;
      console.log(touches[0].pageX);
      if(touches[0].pageX < width){
        sidebar.style.left = -width+touches[0].pageX + 'px';
      }

    }, false);

    sidebar.addEventListener('touchend', function(event) {
      console.log('Touch End.');
      console.log('pgX: ' + touches[0].pageX);
      console.log('dw: ' + width);
      if(touches[0].pageX < width)
      {
        sidebar.className = 'sidebar_in';
        setTimeout(function(){sidebar.style.left = -38+'%';}, 200)
      }
    }, false);
  }
}
