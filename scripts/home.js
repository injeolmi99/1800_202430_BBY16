var currentUser;

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
            currentUser = db.collection("users").doc(user.uid);
            currentUser.get().then(userDoc => {
                let userClubs = userDoc.data().clubs;
                console.log(userClubs);
                userClubs.forEach(club => { //iterate thru each club
                    let officialClubEvents = db.collection("clubs").doc(club).collection("events"); // because club is simply a String containing the ID of the club, from the user's clubs array
                    let unofficialClubEvents = db.collection("unofficialClubs").doc(club).collection("events");
                    let clubData = db.collection("clubs").doc(club);
                    let unofficialClubData = db.collection("unofficialClubs").doc(club);
                    let clubName;
                    let clubID;
                    clubData.get().then(doc => {
                        if (doc.exists) {
                            clubName = doc.data().name;
                            clubID = doc.id;
                        } else {
                            return unofficialClubData.get();
                        }
                    }).then(doc => {
                        if (doc != null) {
                            clubName = doc.data().name;
                            clubID = doc.id;
                        }
                    })
                        .then(() => {
                            promises.push(
                                officialClubEvents.get().then(events => {
                                    events.forEach(event => {
                                        let newcard = cardTemplate.content.cloneNode(true);
                                        // firestore timestamp object returns as seconds -> convert
                                        var eventTimestamp = event.data().date.toDate();
                                        // only extract the date
                                        var date = formatDate(eventTimestamp);
                                        var time = eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes();
                                        
                                        newcard.querySelector('.nameOfHostingClub').innerHTML = clubName;
                                        newcard.querySelector(".nameOfHostingClub").addEventListener("click", () => {
                                            location.href = "eachClub.html?docID=" + clubID;
                                        });
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
                                    console.error("Failed to fetch official club events");
                                })
                            )
                            promises.push(
                                unofficialClubEvents.get().then(events => {
                                    events.forEach(event => {
                                        let newcard = cardTemplate.content.cloneNode(true);
                                        // firestore timestamp object returns as seconds -> convert
                                        var eventTimestamp = event.data().date.toDate();
                                        // only extract the date
                                        var date = formatDate(eventTimestamp);
                                        var time = eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes();

                                        newcard.querySelector('.nameOfHostingClub').innerHTML = clubName;
                                        newcard.querySelector(".nameOfHostingClub").addEventListener("click", () => {
                                            location.href = "eachClub.html?docID=" + clubID;
                                        });
                                        newcard.querySelector('.eventName').innerHTML = event.data().event;
                                        newcard.querySelector('.eventLocation').innerHTML += event.data().location;
                                        newcard.querySelector('.eventDate').innerHTML += date;
                                        newcard.querySelector('.eventTime').innerHTML += time;
                                        document.getElementById(collection + "-go-here").appendChild(newcard);
                                    })
                                }).catch(error => {
                                    console.error("Failed to fetch unoffical club events");
                                })
                            )
                        })
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

                                newcard.querySelector('.clubGroupButton').style.backgroundImage = "url('./images/" + img + ".jpg')";
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
