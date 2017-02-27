var loader_complete = new Event('loaded');
var timer;

var ui = {
  fullFrameHandle:'',

  setFullFrame(pageName){
   fullFrameHandle = document.getElementById('full_frame');
   fullFrameHandle.src = pageName;
   console.log('Full_Frame is now on: ' + fullFrameHandle.src);
  },

  initialize() {
    fullFrameHandle = document.getElementById('full_frame');
  }
};
