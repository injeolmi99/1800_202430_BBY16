function createClub() {
    let clubName = document.getElementById("clubName").value;
    let clubDescription = document.getElementById("description").value;
        db.collection("clubs").add({
            name: clubName,
            description: clubDescription,
            members: []
            // optional?
            // timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            window.location.href = "successful.html"; // redirect to the submission successful page
        })
}