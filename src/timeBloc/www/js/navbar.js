var touches = [];
var sidebar;

var navbar = {
  initialize(){
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
      if(touches[0].pageX <= 150){
        sidebar.style.left = -150+touches[0].pageX + 'px';
      }

    }, false);

    sidebar.addEventListener('touchend', function(event) {
      console.log('Touch End.');
      if(touches[0].pageX <= 150)
      {
        sidebar.className = 'sidebar_in';
        setTimeout(function(){sidebar.style.left = -150+'px';}, 200)
      }
    }, false);
  }
}
