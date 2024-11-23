var currentUser;

function removeUnloggedinUsers() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("user detected");
            currentUser = user;
        } else {
            alert("You must be logged in to have access to this page.");
            location.href = "login.html";
        }
    })
}
removeUnloggedinUsers();

// checks if club is official or unofficial, then displays its info
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

                    // Searches for the users ID in the club members array and acts accordingly
                    if (clubMembers.includes(user.uid) && user.uid == admin) {
                        document.getElementById("Admin-edit-button-goes-here").innerHTML = "<button onclick='editEvent()'><span class='material-icons'>settings</span> Edit Event</button>";
                    }

                    // only shows the ability to join the event if the user is a member of the club (anyone else can see the events data so this doesnt do much)
                    if (clubMembers.includes(user.uid)) {
                        document.getElementById("going").style.display = "inline";
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
                    let eventName = thisEvent.event;
                    let eventDescription = thisEvent.description;
                    let eventTimestamp = thisEvent.date.toDate();
                    let location = thisEvent.location;
                    let date = formatDate(eventTimestamp);
                    let time = eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes();
                    let eventAttendees = thisEvent.attendees;

                    document.getElementById("eventName").innerHTML = eventName;
                    document.getElementById("eventDescription").innerHTML = eventDescription;
                    document.querySelector('.eventLocation').innerHTML += location;
                    document.querySelector('.numberGoing').innerHTML += thisEvent.attendees.length + " going";
                    document.querySelector('.eventDate').innerHTML += date;
                    document.querySelector('.eventTime').innerHTML += time;

                    // Sets the status of if the user is going or not
                    if (thisEvent.attendees.includes(currentUser.uid)) {
                        document.querySelector('#insert-status').innerHTML = "check_circle";
                        // overwrites the classes of the element by id insert-status
                        document.querySelector('#insert-status').className = "material-icons green";
                    } else {
                        document.querySelector('#insert-status').innerHTML = "cancel";
                        document.querySelector('#insert-status').className = "material-icons red";
                    }

                    eventAttendees.forEach((attendee => {
                        db.collection("users").doc(attendee).get()
                            .then(doc => {
                                document.querySelector('#insert-members').innerHTML += "<div class='attendee'><img class='pfp' src='" + doc.data().profilePicture + "'>" + doc.data().displayName + "</div>";
                            })
                    }))
                })
        })
};
displayEventInfo();

// format date to be displayed on card
function formatDate(date) {
    let d = date.getDate();
    let m = date.getMonth(); //Month from 0 to 11
    let y = date.getFullYear();

    let day = date.getDay(); //Day from 0 to 6

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return "" + dayNames[day] + ", " + monthNames[m] + " " + d;
}

function editEvent() {
    let params = new URL(window.location.href); // get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id
    location.href = "editEvent.html?docID=" + clubID + "&eventID=" + eventID;
}

function changeGoing() {
    let params = new URL(window.location.href); //get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id

    let thisClubRef = db.collection("clubs").doc(clubID);

    thisClubRef.get().then(doc => {
        if (doc.exists) {
            // official clubs route
            eventRef = thisClubRef.collection("events").doc(eventID);
            eventRef.get().then(eventDoc => {
                let peopleGoing = eventDoc.data().attendees;

                if (peopleGoing.includes(currentUser.uid)) {
                    eventRef.update({
                        attendees: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
                    })
                    console.log("removed from list")
                    document.querySelector('#insert-status').innerHTML = "cancel";
                    document.querySelector('#insert-status').className = "material-icons red";
                    updateGoingList(eventRef)
                } else {
                    eventRef.update({
                        attendees: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                    })
                    console.log("added to list")
                    document.querySelector('#insert-status').innerHTML = "check_circle";
                    document.querySelector('#insert-status').className = "material-icons green";
                    updateGoingList(eventRef)
                }
            })
        } else {
            // unnofficial clubs route
            let thisClubRef = db.collection("unofficialClubs").doc(clubID);
            thisClubRef.get().then(doc => {
                if (doc.exists) {
                    // official clubs route
                    eventRef = thisClubRef.collection("events").doc(eventID);
                    eventRef.get().then(eventDoc => {
                        let peopleGoing = eventDoc.data().attendees;

                        if (peopleGoing.includes(currentUser.uid)) {
                            eventRef.update({
                                attendees: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
                            })
                            console.log("removed from list")
                            document.querySelector('#insert-status').innerHTML = "cancel";
                            document.querySelector('#insert-status').className = "material-icons red";
                            updateGoingList(eventRef)
                        } else {
                            eventRef.update({
                                attendees: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                            })
                            console.log("added to list")
                            document.querySelector('#insert-status').innerHTML = "check_circle";
                            document.querySelector('#insert-status').className = "material-icons green";
                            updateGoingList(eventRef)
                        }
                    })
                } else {
                    console.log("club does not exist")
                }
            })
        }
    })
}

function updateGoingList(eventRef) {
    eventRef.get().then(eventDoc => {
        let peopleGoing = eventDoc.data().attendees;
        document.querySelector('.numberGoing').innerHTML = peopleGoing.length + " going";
        document.querySelector('#insert-members').innerHTML = "";
        peopleGoing.forEach((attendee => {
            db.collection("users").doc(attendee).get()
                .then(doc => {
                    document.querySelector('#insert-members').innerHTML += "<div class='attendee'><img class='pfp' src='" + doc.data().profilePicture + "'>" + doc.data().displayName + "</div>";
                })
        }))
    })
}