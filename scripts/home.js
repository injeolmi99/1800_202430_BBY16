function insertName() {
    // check if the user is logged in:
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(user.uid); // log UID of the logged-in user
            currentUser = db.collection("users").doc(user.uid); // go to the Firestore document of the user
            currentUser.get().then(userDoc => {
                // get the user name
                let userName = userDoc.data().name;
                console.log(userName);
                document.getElementById("name-goes-here").innerText = userName;
            })
        } else {
            console.log("No user is logged in.");
        }
    })
}
insertName();