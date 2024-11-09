function createClub() {
    var user = firebase.auth().currentUser;
    console.log(user)
    let clubName = document.getElementById("clubName").value;
    let clubDescription = document.getElementById("description").value;
        db.collection("unofficialClubs").add({
            name: clubName,
            admin: user.uid,
            description: clubDescription,
            members: []
            // optional?
            // timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
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