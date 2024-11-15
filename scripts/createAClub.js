function removeUnloggedinUsersandClubOwners() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("user detected");
            // validating that the user has not created 2 clubs yet
            // if they have we will remove them
            currentUser = db.collection("users").doc(user.uid);
            currentUser.get().then(userDoc => {
                let userData = userDoc.data()
                // console.log(userData)
                if (userData.clubsMade != null && userData.clubsMade >= 2) {
                    // users owns the max number of clubs or more so we can kick them out of this form
                    alert("you have made the maximum number of clubs per user")
                    location.href = "clubsList.html";
                } else if (userData.clubsMade == null) {
                    // the user does not have a clubs made field so we will create one and set to 0
                    currentUser.update({
                        clubsMade: 0
                    })
                } else {
                    console.log("Users current owned clubs: " + userData.clubsMade)
                }
            })
        } else {
            alert("You must be logged in to have access to this page.");
            location.href = "login.html";
        }
    })
}
removeUnloggedinUsersandClubOwners();

function createClub() {
    var user = firebase.auth().currentUser;
    // console.log(user)
    let clubName = document.getElementById("clubName").value;
    let clubDescription = document.getElementById("description").value;
    // note to self to remember later: .add returns a promise in this case it is the reference to the club 
    db.collection("unofficialClubs").add({
        name: clubName,
        admin: user.uid,
        description: clubDescription,
        members: [user.uid]
        // optional?
        // timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(clubRef => {
        // uses the promise of the add as a path to the new club ID to add the new club to users clubs array
        // console.log("new doc id: " + clubRef.id)
        // also increases the number of clubs made by the user by one
        db.collection("users").doc(user.uid).get().then(userDoc => {
            let userData = userDoc.data();
            // console.log("userData: " + userData)
            let newClubAmount = userData.clubsMade + 1;
            // console.log(userData.clubsMade)
            // console.log("newClubAmount: " + newClubAmount)
            db.collection("users").doc(user.uid).update({
                clubs: firebase.firestore.FieldValue.arrayUnion(clubRef.id),
                clubsMade: newClubAmount
            }).then(() => {
                window.location.href = "successful.html"; // redirect to the submission successful page
            })
        })
    })
}

// HERE JUST FOR REFERENCE
// function stuff() {
//     db.collection("hello").doc("world").collection("events").add({
//         time: "10:40",
//         AMOrPM: "am",
//         location: "SW05"
//     })
// } 