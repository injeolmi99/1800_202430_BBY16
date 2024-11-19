function removeNonAdmins() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    let thisClubID = db.collection("clubs").doc(ID);

    thisClubID.get().then(doc => {
        if (doc.exists) {
            let clubData = doc.data();
            let clubAdmin = clubData.admin;
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    userID = user.uid;
                    if (userID != clubAdmin) {
                        alert("You are not the club admin.")
                        location.href = "home.html";
                    }
                } else {
                    alert("No user signed in. Please sign in first.")
                    location.href = "login.html";
                }
            })
        } else {
            let thisClubID = db.collection("unofficialClubs").doc(ID);

            thisClubID.get().then(doc => {
                if (doc.exists) {
                    let clubData = doc.data();
                    let clubAdmin = clubData.admin;
                    firebase.auth().onAuthStateChanged(user => {
                        if (user) {
                            userID = user.uid;
                            if (userID != clubAdmin) {
                                alert("You are not the club admin.")
                                location.href = "home.html";
                            }
                        } else {
                            alert("No user signed in. Please sign in first.")
                            location.href = "login.html";
                        }
                    })
                }
            })
        }
    })
}
removeNonAdmins();

function displayEventInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id

    // new and improved way to check club bc storing previousPage url in session storage was unreliable and hack-y
    let collection;
    let clubMembers;
    let admin;
    let officialClubsList = db.collection("clubs").doc(clubID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(clubID);

    officialClubsList.get()
        .then(doc => {
            if (doc.exists) {
                // if official club, set collection to "clubs"
                collection = "clubs";
                clubMembers = doc.data().members;
                admin = doc.data().admin;
            } else {
                // because this return value is "thenable", next .then() in the chain can handle its result, preserving async handling
                // otherwise the next then() would execute without waiting to fetch the unofficial club list)
                return unofficialClubsList.get();
            }
        })
        .then(doc => {
            // !collection -> collection hasn't been set yet, i.e., isn't an official club
            if (!collection && doc.exists) {
                collection = "unofficialClubs";
                clubMembers = doc.data().members;
                admin = doc.data().admin;
            } else if (!collection) {
                console.error("Club doesn't exist!");
            }

            firebase.auth().onAuthStateChanged(user => {
                // If a user is logged in then go inside else fail
                if (user) {

                    if (clubMembers.includes(user.uid) && user.uid == admin) {
                        console.log("user has permission to edit");
                    }

                } else {
                    console.log("Failed at user check / none logged in?");
                }
            })
        })
        .then(() => {
            db.collection(collection).doc(clubID).collection("events").doc(eventID)
                .get()
                .then(doc => {
                    thisEvent = doc.data();
                    let title = thisEvent.event;
                    let description = thisEvent.description;
                    let date = thisEvent.date.toDate().toISOString().slice(0, 16);;
                    let location = thisEvent.location;

                    document.getElementById("eventName").value = title;
                    document.getElementById("eventDate").value = date;
                    document.getElementById("eventLocation").value = location;
                    document.getElementById("description").value = description;
                })
        })
}
displayEventInfo();

function updateEvent() {
    let params = new URL(window.location.href); //get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id

    // new and improved way to check club bc storing previousPage url in session storage was unreliable and hack-y
    let collection;
    let clubMembers;
    let admin;
    let officialClubsList = db.collection("clubs").doc(clubID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(clubID);

    officialClubsList.get()
        .then(doc => {
            if (doc.exists) {
                // if official club, set collection to "clubs"
                collection = "clubs";
                clubMembers = doc.data().members;
                admin = doc.data().admin;
            } else {
                // because this return value is "thenable", next .then() in the chain can handle its result, preserving async handling
                // otherwise the next then() would execute without waiting to fetch the unofficial club list)
                return unofficialClubsList.get();
            }
        })
        .then(doc => {
            // !collection -> collection hasn't been set yet, i.e., isn't an official club
            if (!collection && doc.exists) {
                collection = "unofficialClubs";
                clubMembers = doc.data().members;
                admin = doc.data().admin;
            } else if (!collection) {
                console.error("Club doesn't exist!");
            }

            firebase.auth().onAuthStateChanged(user => {
                // If a user is logged in then go inside else fail
                if (user) {

                    if (clubMembers.includes(user.uid) && user.uid == admin) {
                        console.log("user has permission to edit");
                    }

                } else {
                    console.log("Failed at user check / none logged in?");
                }
            })
        })
        .then(() => {
            db.collection(collection).doc(clubID).collection("events").doc(eventID)
                .get()
                .then(doc => {
                    let thisEvent = db.collection(collection).doc(clubID).collection("events").doc(eventID);
                    let dateBeforeConverting = new Date(document.getElementById("eventDate").value);
                    let eventDateTime = firebase.firestore.Timestamp.fromDate(dateBeforeConverting);
        
                    thisEvent.update({
                        event: document.getElementById("eventName").value,
                        description: document.getElementById("description").value,
                        date: eventDateTime,
                        location: document.getElementById("eventLocation").value,
                    }).then(() => {
                        alert("Your event was updated successfully!");
                        history.back();
                    })
                })
        })
}