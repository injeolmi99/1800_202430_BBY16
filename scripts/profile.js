// INSERTS THE USERNAME INTO THE PROFILE PAGE
var currentUser;
function insertNameFromFirestore() {
    // Check if the user is logged in:
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(user.uid); // Let's know who the logged-in user is by logging their UID
            currentUser = db.collection("users").doc(user.uid); // Go to the Firestore document of the user
            currentUser.get().then(userDoc => {
                // Get the user name
                let userName = userDoc.data().name;
                console.log(userName);
                let userEmail = userDoc.data().email;
                console.log(userEmail);
                let userDisplayName = userDoc.data().displayName;
                console.log(userDisplayName);
                let userDescription = userDoc.data().description;
                console.log(userDescription);
                //$("#name-goes-here").text(userName); // jQuery
                if(userName != null){
                    document.getElementById("nameInput").value = userName;
                }
                if(displayNameInput != null){
                    document.getElementById("displayNameInput").value = userDisplayName;
                }
                if(userEmail != null){
                    document.getElementById("emailInput").value = userEmail;
                }
                if(userDescription != null){
                    document.getElementById("descriptionInput").value = userDescription;
                }
                
                
                
            })
        } else {
            console.log("No user is logged in."); // Log a message when no user is logged in
        }
    })
}
insertNameFromFirestore();
function editUserInfo() {
    //Enable the form fields
    document.getElementById('personalInfoFields').disabled = false;
 }
 function saveUserInfo() {
    //enter code here
    userName = document.getElementById('nameInput').value;
    userDisplayName = document.getElementById('displayNameInput').value;
    userEmail = document.getElementById('emailInput').value;
    userDescription = document.getElementById('descriptionInput').value;


    currentUser.update({
        name: userName,
        email: userEmail,
        displayName: userDisplayName,
        description: userDescription
    })
    .then(() => {
        console.log("Document successfully updated!");
    })

    document.getElementById('personalInfoFields').disabled = true;
    //a) get user entered values

    //b) update user's document in Firestore

    //c) disable edit 
}