function sayHello() {
    
}
//sayHello();


//------------------------------------------------
// Call this function when the "logout" button is clicked
//-------------------------------------------------
// This function is actually only ever called when the index.html page is first 
// displayed which is pretty much the same thing as when the logout button is pushed but just for future reference
function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        console.log("logging out user");
      }).catch((error) => {
        // An error happened.
      });
}