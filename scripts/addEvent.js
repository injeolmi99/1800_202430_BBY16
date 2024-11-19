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

function addEvent() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    let collection;
    let officialClubsList = db.collection("clubs").doc(ID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(ID);

    officialClubsList.get()
        .then(doc => {
            if (doc.exists) {
                collection = "clubs";
            } else {
                return unofficialClubsList.get();
            }
        })
        .then(doc => {
            if (!collection && doc.exists) {
                collection = "unofficialClubs";
            } else if (!collection) {
                console.error("Club doesn't exist!");
            }
        })
        .then(() => {
            let eventName = document.getElementById("eventName").value;
            // this is needed because if we just get the value raw from the form it'll store in Firestore as a string, which might be fine but i already coded the event display cards to convert from Firestore timestamp to Javascript date object
            let dateBeforeConverting = new Date(document.getElementById("eventDate").value);
            let eventDateTime = firebase.firestore.Timestamp.fromDate(dateBeforeConverting);
            let eventLocation = document.getElementById("eventLocation").value;
            let eventDescription = document.getElementById("description").value;
            console.log(eventName);

            db.collection(collection)
                .doc(ID)
                .get()
                .then(() => {
                    var user = firebase.auth().currentUser;
                    db.collection(collection).doc(ID).collection("events").add({
                        event: eventName,
                        date: eventDateTime,
                        location: eventLocation,
                        description: eventDescription,
                        attendees: [user.uid],
                    }).then(() => {
                        alert("Your event was added successfully!");
                        history.back();
                    })
                })
        })
}