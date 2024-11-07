// INSERTS THE USERNAME INTO THE PROFILE PAGE
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
                //$("#name-goes-here").text(userName); // jQuery
                document.getElementById("name-goes-here").innerText = userName;
                document.getElementById("email-goes-here").innerText = userEmail;
                document.getElementById("displayName-goes-here").innerText = userDisplayName;
            })
        } else {
            console.log("No user is logged in."); // Log a message when no user is logged in
        }
    })
}
insertNameFromFirestore();
