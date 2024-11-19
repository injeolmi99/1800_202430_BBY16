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

// checks if club is official or unofficial, then displays its info
function displayEventInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id

    // new and improved way to check club bc storing previousPage url in session storage was unreliable and hack-y
    let collection;
    let officialClubsList = db.collection("clubs").doc(clubID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(clubID);

    officialClubsList.get()
        .then(doc => {
            if (doc.exists) {
                // if official club, set collection to "clubs"
                collection = "clubs";
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
            } else if (!collection) {
                console.error("Club doesn't exist!");
            }
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