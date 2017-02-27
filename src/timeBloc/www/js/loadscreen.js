var loader = {

  uid:'',

  login() {
    if(uid = ''){
      window.localStorage.getItem('uid');
      this.generateId();
    }
    console.log("Login: " + loader.uid);
    //window.dispatchEvent(loader_complete);
  }

}
