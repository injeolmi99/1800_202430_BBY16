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

// fetch events of clubs user has joined to display in event gallery on home page
function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("eventCardTemplate");
    const promises = [];

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            let currentUser = db.collection("users").doc(user.uid);
            currentUser.get().then(userDoc => {
                let userClubs = userDoc.data().clubs;
                console.log(userClubs);
                userClubs.forEach(club => { //iterate thru each club
                    console.log(club);
                    let clubEvents = db.collection("clubs").doc(club).collection("events");
                    promises.push(
                        clubEvents.get().then(events => {
                            events.forEach(event => {
                                console.log(event.id);
                                let newcard = cardTemplate.content.cloneNode(true);
                                // firestore timestamp object returns as seconds -> convert
                                var eventTimestamp = event.data().date.toDate();
                                // only extract the date
                                var date = formatDate(eventTimestamp);
                                var time = eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes();

                                newcard.querySelector('.eventName').innerHTML = event.data().event;
                                newcard.querySelector('.eventLocation').innerHTML += event.data().location;
                                newcard.querySelector('.eventDate').innerHTML += date;
                                newcard.querySelector('.eventTime').innerHTML += time;
                                document.getElementById(collection + "-go-here").appendChild(newcard);

                                // can add in page for each event later
                                // newcard.querySelector(".clubGroupButton").addEventListener("click", () => {
                                //     sessionStorage.setItem("previousPage", window.location.href);
                                //     location.href = "eachEvent.html?docID=" + docID;
                                // });
                            })
                        }).catch(error => {
                            console.error("Failed to fetch club events");
                        })
                    )
                })
            })
            Promise.all(promises).then(() => {
                console.log("User events loaded");
            }).catch(error => {
                console.error("Failed to fetch user events");
            })
        } else {
            console.log("No user is logged in.");
        }
    })
}
displayCardsDynamically("events");

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
  