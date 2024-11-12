function displayClubInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    let collection;
    let previousPage = sessionStorage.getItem("previousPage")

    if (previousPage.includes("clubsList.html")) {
        collection = "clubs";
    } else if (previousPage.includes("unofficialClubs.html")) {
        collection = "unofficialClubs";
    }

    db.collection(collection)
        .doc(ID)
        .get()
        .then(doc => {
            thisClub = doc.data();
            clubName = thisClub.name;
            clubDescription = thisClub.description;
            clubMembers = thisClub.members;
            clubAdmin = thisClub.admin;

            //this is for displaying the Join or leave club button since it needs to change based on your status with the club
            // I dont understand why but the shorter method of getting userID isn't working on other pages
            // So I used this machine!
            firebase.auth().onAuthStateChanged(user => {
                // If a user is logged in then go inside else fail
                if (user) {

                    // Searches for the users ID in the club members array and acts accordingly
                    if(clubMembers.includes(user.uid) && user.uid == clubAdmin) {
                        //Line after this can be removed whenever just a place holder to tell JT when it works
                        document.getElementById("insertJoinOrLeave").innerHTML = "Admin Cannot leave their own club";

                        document.getElementById("Admin-edit-button-goes-here").innerHTML = "<button onclick='editClub()'>Edit Club</button>";
                        document.getElementById("insert-add-event").innerHTML = "<button onclick='addEvent()'>Add event</button>";
                    } else if (clubMembers.includes(user.uid)) {
                        // console.log("Here");
                        document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()'>Leave</button>";
                    } else {
                        // console.log("not in club");
                        document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()'>Join</button>";
                    }

                } else {
                    console.log("Failed at user check / none logged in?");
                    document.getElementById("insertJoinOrLeave").innerHTML = "ERROR!!!";
                }
            })

            document.getElementById("clubName").innerHTML = clubName;
            document.getElementById("clubDescription").innerHTML = clubDescription;

            // let imgEvent = document.querySelector( ".club-img" );
            // imgEvent.src = "../images/" + [would need some kind of identifier] + ".jpg";
        });
}
displayClubInfo();

// fetch events of the current club to display in event gallery
function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("eventCardTemplate");
    const promises = [];

    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    let clubEvents = db.collection("clubs").doc(ID).collection("events");
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
    Promise.all(promises).then(() => {
        console.log("User events loaded");
    }).catch(error => {
        console.error("Failed to fetch user events");
    })
}
displayCardsDynamically("events");

// // This is executed when the button is pressed doesnt work perfectly rn (I dont remember if I (jt) put that it doensnt work perfectly or if it was a note left for me... I just made it work for the unnofficial clubs as well though)
function leaveOrJoin() {
    let params = new URL(window.location.href); // get URL of search bar
    let ID = params.searchParams.get("docID"); // get value for key "id"

    let thisClubID = db.collection("clubs").doc(ID);

    thisClubID.get().then(doc => {
        if (doc.exists) {
            let thisClub = doc.data();

            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    // Get user document from Firestore (just saving myself typing later)
                    let userDocRef = db.collection("users").doc(user.uid);

                    // needed this beast to get into the users data
                    userDocRef.get().then(userDoc => {
                        if (userDoc.exists) {
                            let userData = userDoc.data();
                            let userClubs = userData.clubs || []; // Ensure userClubs is an array

                            // check if the user is in the clubs member array
                            if (thisClub.members.includes(user.uid)) {
                                // If they are then we wll remove them
                                thisClubID.update({
                                    // This is how you remove a specific value from an array list w/ firestore
                                    members: firebase.firestore.FieldValue.arrayRemove(user.uid)
                                }).then(() => {
                                    console.log("User removed from the club members list.");

                                    userDocRef.update({
                                        // removing the club from the user
                                        clubs: firebase.firestore.FieldValue.arrayRemove(ID)
                                    }).then(() => {
                                        console.log("Club ID removed from user's club list.");
                                        // change the button to match the users status with club
                                        document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()'>Join</button>"
                                    }).catch(error => {
                                        console.error("Error updating user document: ", error);
                                    });
                                }).catch(error => {
                                    console.error("Error updating club document: ", error);
                                });
                            } else {
                                // Else the user is not in the club so we add them
                                thisClubID.update({
                                    // This is how to add to array without changing other values (its not .push())
                                    members: firebase.firestore.FieldValue.arrayUnion(user.uid)
                                }).then(() => {
                                    console.log("User added to the club members list.");

                                    userDocRef.update({
                                        // This is how to add to array without changing other values (its not .push())
                                        clubs: firebase.firestore.FieldValue.arrayUnion(ID)
                                    }).then(() => {
                                        console.log("Club ID added to user's club list.");
                                        // change the button to match the users status with club
                                        document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()'>Leave</button>"
                                    }).catch(error => {
                                        console.error("Error updating user document: ", error);
                                    });
                                }).catch(error => {
                                    console.error("Error updating club document: ", error);
                                });
                            }
                        } else {
                            console.log("User document not found in Firestore.");
                        }
                    }).catch(error => {
                        console.error("Error getting user document: ", error);
                    });
                } else {
                    console.log("Failed at user check / none logged in?");
                }
            });
        } else {
            console.log("not an official club... switching to check unnoficial list...");
            //Branch off of here for unnoficial clubs
            thisClubID = db.collection("unofficialClubs").doc(ID);
            thisClubID.get().then(doc => {
                if (doc.exists) {
                    let thisClub = doc.data();

                    firebase.auth().onAuthStateChanged(user => {
                        if (user) {
                            // Get user document from Firestore (just saving myself typing later)
                            let userDocRef = db.collection("users").doc(user.uid);

                            // needed this beast to get into the users data
                            userDocRef.get().then(userDoc => {
                                if (userDoc.exists) {
                                    let userData = userDoc.data();
                                    let userClubs = userData.clubs || []; // Ensure userClubs is an array

                                    // check if the user is in the clubs member array
                                    if (thisClub.members.includes(user.uid)) {
                                        // If they are then we wll remove them
                                        thisClubID.update({
                                            // This is how you remove a specific value from an array list w/ firestore
                                            members: firebase.firestore.FieldValue.arrayRemove(user.uid)
                                        }).then(() => {
                                            console.log("User removed from the club members list.");

                                            userDocRef.update({
                                                // removing the club from the user
                                                clubs: firebase.firestore.FieldValue.arrayRemove(ID)
                                            }).then(() => {
                                                console.log("Club ID removed from user's club list.");
                                                // change the button to match the users status with club
                                                document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()'>Join</button>";
                                            }).catch(error => {
                                                console.error("Error updating user document: ", error);
                                            });
                                        }).catch(error => {
                                            console.error("Error updating club document: ", error);
                                        });
                                    } else {
                                        // Else the user is not in the club so we add them
                                        thisClubID.update({
                                            // This is how to add to array without changing other values (its not .push())
                                            members: firebase.firestore.FieldValue.arrayUnion(user.uid)
                                        }).then(() => {
                                            console.log("User added to the club members list.");

                                            userDocRef.update({
                                                // This is how to add to array without changing other values (its not .push())
                                                clubs: firebase.firestore.FieldValue.arrayUnion(ID)
                                            }).then(() => {
                                                console.log("Club ID added to user's club list.");
                                                // change the button to match the users status with club
                                                document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()'>Leave</button>";
                                            }).catch(error => {
                                                console.error("Error updating user document: ", error);
                                            });
                                        }).catch(error => {
                                            console.error("Error updating club document: ", error);
                                        });
                                    }
                                } else {
                                    console.log("User document not found in Firestore.");
                                }
                            }).catch(error => {
                                console.error("Error getting user document: ", error);
                            });
                        } else {
                            console.log("Failed at user check / none logged in?");
                        }
                    });
                } else {
                    console.log("The club was not found in official or unofficial clubs lists")
                }
            })
        }
    }).catch(error => {
        console.error("Error getting club document: ", error);
    });
}

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

function editClub() {
    let params = new URL(window.location.href); // get URL of search bar
    let clubID = params.searchParams.get("docID"); // get value for key "id"
    console.log("now edditing club");
    location.href = "editClub.html?docID=" + clubID;
}

function addEvent() {
    console.log("here");
}

// function saveClubDocumentIDAndRedirect(){
//     let params = new URL(window.location.href) //get the url from the search bar
//     let ID = params.searchParams.get("docID");
//     localStorage.setItem("clubID", ID);
// }