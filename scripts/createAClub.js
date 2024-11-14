function removeUnloggedinUsers() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("user detected");
        } else {
            alert("You must be logged in to have access to this page.");
            location.href = "login.html";
        }
    })
}
removeUnloggedinUsers();

function createClub() {
    var user = firebase.auth().currentUser;
    console.log(user)
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
        //uses the promise of the add as a path to the new club ID to add the new club to users clubs array
        console.log("new doc id: " + clubRef.id)
        db.collection("users").doc(user.uid).update({
            clubs: firebase.firestore.FieldValue.arrayUnion(clubRef.id)
        })
    })
    .then(() => {
        window.location.href = "successful.html"; // redirect to the submission successful page
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