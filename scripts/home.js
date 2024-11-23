var currentUser;
var allEvents = [];

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

function insertName() {
    // check if the user is logged in:
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // console.log(user.uid); // log UID of the logged-in user
            currentUser = db.collection("users").doc(user.uid); // go to the Firestore document of the user
            currentUser.get().then(userDoc => {
                // get the user name
                let userName = userDoc.data().name;
                // console.log(userName);
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

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const currentUser = db.collection("users").doc(user.uid);
            currentUser.get().then(userDoc => {
                let userClubs = userDoc.data().clubs;
                // console.log(userClubs);

                let promises = [];

                userClubs.forEach(club => { //iterate thru each club
                    // create promise so that the array isn't accessed before it is fully populated, then chain .then()
                    let promise = new Promise((resolve, reject) => {
                        let officialClubEvents = db.collection("clubs").doc(club).collection("events"); // NOT club.id because club is simply a String containing the ID of the club, from the user's clubs array
                        let unofficialClubEvents = db.collection("unofficialClubs").doc(club).collection("events");
                        let clubData = db.collection("clubs").doc(club);
                        let unofficialClubData = db.collection("unofficialClubs").doc(club);
                        let clubName;
                        let clubID;

                        clubData.get().then(doc => { // check official clubs list for doc
                            if (doc.exists) {
                                clubName = doc.data().name;
                                clubID = doc.id;
                            } else {
                                return unofficialClubData.get().then(doc => {
                                    if (!clubName && doc.exists) { // if !clubName hasn't been assigned yet, doc is in unofficial clubs
                                        clubName = doc.data().name;
                                        clubID = doc.id;
                                    }
                                });
                            }
                        }).then(() => {
                            return officialClubEvents.get().then(events => {
                                events.forEach(event => {
                                    let eventData = event.data();
                                    let thisEvent = {
                                        ID: event.id,
                                        clubID: clubID,
                                        clubName: clubName,
                                        date: eventData.date.toDate(),
                                        title: eventData.event,
                                        location: eventData.location,
                                        attendees: eventData.attendees
                                    };
                                    allEvents.push(thisEvent); // pushing to an allEvents array first so that we can sort by date before displaying them
                                });
                            }).catch(error => {
                                console.error("Failed to fetch official events");
                            });
                        }).then(() => {
                            // repeat for unofficial clubs
                            return unofficialClubEvents.get().then(events => {
                                events.forEach(event => {
                                    let eventData = event.data();
                                    let thisEvent = {
                                        ID: event.id,
                                        clubID: clubID,
                                        clubName: clubName,
                                        date: eventData.date.toDate(),
                                        title: eventData.event,
                                        location: eventData.location,
                                        attendees: eventData.attendees
                                    };
                                    allEvents.push(thisEvent);
                                });
                            }).catch(error => {
                                console.error("Failed to fetch unofficial events");
                            });
                        }).then(() => {
                            resolve();
                        }).catch(error => {
                            reject(error);
                        });
                    });
                    promises.push(promise);
                });

                // once promise resolves, then we sort the allEvents array and display the cards
                Promise.all(promises).then(() => {
                    allEvents.sort((event1, event2) => {
                        return event1.date.getTime() - event2.date.getTime();
                    }); // sort by date - getTime() returns milliseconds

                    allEvents.forEach(eventCard => {
                        let newcard = cardTemplate.content.cloneNode(true);
                        // only extract the date
                        let date = formatDate(eventCard.date);
                        // only extract the time
                        let time = eventCard.date.getHours() + ":" + (eventCard.date.getMinutes() < 10 ? "0" : "") + eventCard.date.getMinutes();

                        newcard.querySelector('.nameOfHostingClub').innerHTML = eventCard.clubName;
                        newcard.querySelector(".nameOfHostingClub").addEventListener("click", () => {
                            location.href = "eachClub.html?docID=" + eventCard.clubID;
                        });
                        newcard.querySelector('.eventName').innerHTML = eventCard.title;
                        newcard.querySelector(".eventName").addEventListener("click", () => {
                            location.href = "eachEvent.html?docID=" + eventCard.clubID + "&eventID=" + eventCard.ID;
                        });
                        newcard.querySelector('.eventLocation').innerHTML += eventCard.location;
                        newcard.querySelector('.eventDate').innerHTML += date;
                        newcard.querySelector('.eventTime').innerHTML += time;
                        newcard.querySelector('.goingCheck').innerHTML += '<label id="' + eventCard.clubID + eventCard.ID + 'Label" for="going">' + eventCard.attendees.length + (eventCard.attendees.length == 1 ? ' person is' : ' people are') + ' going. Are you?</label><input id="' + eventCard.clubID + eventCard.ID + 'Check" type="checkbox" name="going" value="' + eventCard.clubID + '">'

                        newcard.querySelector('#' + eventCard.clubID + eventCard.ID + 'Check').onclick = () => updateGoing(eventCard.clubID, eventCard.ID);
                        document.getElementById(collection + "-go-here").appendChild(newcard);

                        // had to move this down below cause asyncronousness is messing with me :(
                        if (eventCard.attendees.includes(currentUser.id)) {
                            document.getElementById(eventCard.clubID + eventCard.ID + "Check").checked = true
                        }
                    });
                }).catch(error => {
                    console.error("Failed to fetch all club events", error);
                });
            }).catch(error => {
                console.error("Error fetching user data:", error);
            });
        } else {
            console.log("No user is logged in.");
        }
    });
}
displayCardsDynamically("events");

function displayClubsDynamically(collection) {
    let cardTemplate = document.getElementById("clubsListTemplate");
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = db.collection("users").doc(user.uid); // go to the Firestore document of the user
            currentUser.get().then(doc => {
                userDoc = doc;
                db.collection(collection).get()
                    .then(allClubs => {
                        allClubs.forEach(doc => { //iterate thru each doc
                            if (userDoc.data().clubs.includes(doc.id)) {
                                var title = doc.data().name;       // get value of the "name" key
                                var docID = doc.id;
                                var img = doc.data().image;
                                let newcard = cardTemplate.content.cloneNode(true);

                                newcard.querySelector('.clubGroupButton').style.backgroundImage = "url('./images/clubImages/" + img + "')";
                                newcard.querySelector('.nameTag').innerHTML = title;

                                newcard.querySelector('.nameTag').style.cursor = "pointer";
                                // looks redundant, but because of the hover overlay i think this is needed for it to work on mobile
                                newcard.querySelector(".clubGroupButton").addEventListener("click", () => {
                                    location.href = "eachClub.html?docID=" + docID;
                                });
                                newcard.querySelector(".nameTag").addEventListener("click", () => {
                                    location.href = "eachClub.html?docID=" + docID;
                                });
                                document.getElementById("clubs-go-here").appendChild(newcard);
                            }
                        })
                    })
            })

        }
    })
}
displayClubsDynamically("clubs");
displayClubsDynamically("unofficialClubs");

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

function updateGoing(clubId, eventID) {
    // console.log(clubId)

    // because i'm using a local array to display the events, need to manually update the attendees field in the local allEvents array as well
    let eventCard = allEvents.find((event => event.ID == eventID && event.clubID == clubId));
    if (!eventCard) {
        console.error("event doesn't exist");
        return;
    }

    let thisClubRef = db.collection("clubs").doc(clubId);

    // console.log(currentUser.id)

    thisClubRef.get().then(doc => {
        if (doc.exists) {
            // this path for official clubs
            eventRef = thisClubRef.collection("events").doc(eventID);
            eventRef.get().then(eventDoc => {
                let peopleGoing = eventDoc.data().attendees;
                if (peopleGoing.includes(currentUser.id)) {
                    // remove user from event attendess
                    eventRef.update({
                        attendees: firebase.firestore.FieldValue.arrayRemove(currentUser.id)
                    })
                    console.log("removed from list")

                    // cut out user from array
                    for (let i = 0; i < eventCard.attendees.length; i++) {
                        if (eventCard.attendees.includes(currentUser.id)) {
                            eventCard.attendees.splice(i, 1);
                            break;
                        }
                    }
                    updateLabel(clubId, "clubs", eventID);
                } else {
                    // add user to attendees
                    eventRef.update({
                        attendees: firebase.firestore.FieldValue.arrayUnion(currentUser.id)
                    })

                    eventCard.attendees.push(currentUser.id);

                    console.log("added to list")
                    updateLabel(clubId, "clubs", eventID);
                }

            })
        } else {
            // start over here for unnoficial clubs
            thisClubRef = db.collection("unofficialClubs").doc(clubId);
            thisClubRef.get().then(doc => {
                if (doc.exists) {
                    eventRef = thisClubRef.collection("events").doc(eventID);
                    eventRef.get().then(eventDoc => {
                        let peopleGoing = eventDoc.data().attendees;
                        if (peopleGoing.includes(currentUser.id)) {
                            // remove user from event attendess
                            eventRef.update({
                                attendees: firebase.firestore.FieldValue.arrayRemove(currentUser.id)
                            })

                            for (let i = 0; i < eventCard.attendees.length; i++) {
                                if (eventCard.attendees.includes(currentUser.id)) {
                                    eventCard.attendees.splice(i, 1);
                                    break;
                                }
                            }
        
                            console.log("removed from list")
                            updateLabel(clubId, "unofficialClubs", eventID);
                        } else {
                            // add user to attendees
                            eventRef.update({
                                attendees: firebase.firestore.FieldValue.arrayUnion(currentUser.id)
                            })

                            eventCard.attendees.push(currentUser.id);

                            console.log("added to list")
                            updateLabel(clubId, "unofficialClubs", eventID);
                        }
                    })
                } else {
                    console.log("club does not exist")
                }
            })
        }
    })
}

// suppport function to update the label of the club template
function updateLabel(clubId, clubType, eventID) {
    // clubType refers to it being official (clubs) or unnoficial (unnoficail clubs)
    let eventRef = db.collection(clubType).doc(clubId).collection("events").doc(eventID);

    eventRef.get().then(doc => {
        let membersGoing = doc.data().attendees;

        document.getElementById(clubId + eventID + 'Label').innerHTML = membersGoing.length + (membersGoing.length == 1 ? ' person is' : ' people are') + ' going. Are you?'
    })
}