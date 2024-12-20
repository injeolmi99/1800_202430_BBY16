function removeUnloggedinUsers() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("user detected");
        } else {
            Swal.fire({
                title: "No user signed in!",
                text: "Please sign in first!",
                icon: "warning",
                confirmButtonColor: "#4089C0"
            }).then(() => {
                location.href = "login.html";
            })
        }
    })
}
removeUnloggedinUsers();

// checks if club is official or unofficial, then displays its info
function displayClubInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    // new and improved way to check club bc storing previousPage url in session storage was unreliable and hack-y
    let collection;
    let officialClubsList = db.collection("clubs").doc(ID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(ID);

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
            processClubInfo(collection);
        })
};
displayClubInfo();

function processClubInfo(collection) {
    // after determining whether club is an official or unofficial club, process club info to be displayed on page
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"

    db.collection(collection)
    .doc(ID)
    .get()
    .then(doc => {
        thisClub = doc.data();
        let clubImage = thisClub.image;
        let clubName = thisClub.name;
        let clubDescription = thisClub.description;
        let clubMembers = thisClub.members;
        let clubAdmin = thisClub.admin;

        db.collection("users").doc(clubAdmin).get().then(adminRef => {
            if (adminRef.exists) {
                let adminPFP = adminRef.data().profilePicture
                let adminDisplay = adminRef.data().displayName
                document.getElementById("insert-admin").innerHTML += '<img class="pfp" src="' + adminPFP + '" alt=""><span>' + adminDisplay + '</span>'
            } else {
                document.getElementById("insert-admin").innerHTML = "This club has no admin";
            }
        })

        dynamicLeaveOrJoin(clubMembers, clubAdmin)

        // for loop to display 10 members in the members list
        let displayTen = 10;
        for (let i = 0; i < displayTen; i++) {
            if (clubMembers[i] != null && clubMembers[i] != clubAdmin) {
                db.collection("users").doc(clubMembers[i]).get().then(clubMemberData => {
                    let thisMemberData = clubMemberData.data();
                    document.getElementById("insert-members").innerHTML += '<p><img class="pfp" src="' + thisMemberData.profilePicture + '" alt=""><span>' + thisMemberData.displayName + '</span></p>'
                })
            } else if (clubMembers[i] != null && clubMembers[i] == clubAdmin) {
                // this is just to ensure that if the admin's card comes up that it will still display 10 users
                // just because 10 is a better number than 9 :)
                displayTen++;
            }
        }

        document.getElementById("clubImage").style.backgroundImage = "url('./images/clubImages/" + clubImage + "')"
        document.getElementById("clubName").innerHTML = clubName;
        document.getElementById("clubDescription").innerHTML = clubDescription;
        displayCardsDynamically(collection);
    })
}

function dynamicLeaveOrJoin(clubMembers, clubAdmin) {
        //this is for displaying the Join or leave club button since it needs to change based on your status with the club
        // Getting user ID
        firebase.auth().onAuthStateChanged(user => {
            // If a user is logged in then go inside else fail
            if (user) {

                // Searches for the users ID in the club members array and acts accordingly
                if (clubMembers.includes(user.uid) && user.uid == clubAdmin) {
                    //Line after this can be removed whenever just a place holder to tell JT when it works // Thank you sometimes im just forgetful to remove stuff
                    // document.getElementById("insertJoinOrLeave").innerHTML = "Admin cannot leave their own club";

                    document.getElementById("Admin-edit-button-goes-here").innerHTML = "<button onclick='editClub()'><span class='material-icons'>settings</span> Edit Club</button>";
                    document.getElementById("insert-add-event").innerHTML = "<button onclick='addEvent()'>+ Add Event</button>";
                } else if (clubMembers.includes(user.uid)) {
                    // console.log("Here");
                    document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()' style='background-color: #EB7875;'>Leave</button>";
                } else {
                    // console.log("not in club");
                    document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()' style='background-color: #85ac9f;'>Join</button>";
                }

            } else {
                console.log("Failed at user check / none logged in?");
                document.getElementById("insertJoinOrLeave").innerHTML = "ERROR!!!";
            }
        })
}

// fetch events of the current club to display in event gallery
function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("eventCardTemplate");
    const promises = [];

    let params = new URL(window.location.href); //get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for key "id"

    let clubEvents = db.collection(collection).doc(clubID).collection("events");
    promises.push(
        clubEvents.orderBy("date")
            .get()
            .then(events => {
                events.forEach(event => {
                    console.log(event.id);

                    eventD = event.data();

                    let newcard = cardTemplate.content.cloneNode(true);
                    // firestore timestamp object returns as seconds -> convert
                    var eventTimestamp = eventD.date.toDate();
                    // only extract the date
                    var date = formatDate(eventTimestamp);
                    var time = eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes();

                    newcard.querySelector('.eventName').innerHTML = eventD.event;
                    newcard.querySelector('.eventLocation').innerHTML += eventD.location;
                    newcard.querySelector('.eventDate').innerHTML += date;
                    newcard.querySelector('.eventTime').innerHTML += time;
                    newcard.querySelector('.goingCheck').innerHTML += '<p>' + eventD.attendees.length + (eventD.attendees.length == 1 ? ' person is' : ' people are') + ' going.<p>'

                    newcard.querySelector(".eventCard").addEventListener("click", () => {
                        location.href = "eachEvent.html?docID=" + clubID + "&eventID=" + event.id;
                    });
                    document.getElementById("events" + "-go-here").appendChild(newcard);
                })
            }).catch(error => {
                console.error("Failed to fetch club events: " + error);
            })
    )
    Promise.all(promises).then(() => {
        console.log("Club events loaded");
    }).catch(error => {
        console.error("Failed to fetch user events");
    })
}

// you left the note for yourself i'm pretty sure! it seems to work perfectly now, thank you for your hard work as always :D (ak)
function leaveOrJoin() {
    let params = new URL(window.location.href); // get URL of search bar
    let ID = params.searchParams.get("docID"); // get value for key "id"

    // looking back on this I think I should have named this thisClubRef but dont bully me I made it so early into the journey
    // and was barely understanding
    let thisClubID = db.collection("clubs").doc(ID);

    thisClubID.get().then(doc => {
        // this check is commonly found in our code as it determines if the document is in the clubs collection or the unofficial clubs collection
        if (doc.exists) {
            let thisClub = doc.data();
            // should have used a global var to store user on most pages, wish I learned that sooner
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    // passed off to another function which will pass off to another function
                    checkInClubOrNot(thisClub, thisClubID, user)
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
                            checkInClubOrNot(thisClub, thisClubID, user)
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

function checkInClubOrNot(thisClub, thisClubID, user) {
    // Get user document from Firestore (just saving myself typing later)
    let userDocRef = db.collection("users").doc(user.uid);

    // needed this beast to get into the users data -> to update their clubs array
    userDocRef.get().then(userDoc => {
        if (userDoc.exists) {

            // check if the user is in the clubs member array
            if (thisClub.members.includes(user.uid)) {
                // If they are then we wll remove them
                removeUserFromClub(thisClubID, userDocRef, user)
            } else {
                // Else the user is not in the club so we add them
                addUserToClub(thisClubID, userDocRef, user)
            }
        } else {
            console.log("User document not found in Firestore.");
        }
    }).catch(error => {
        console.error("Error getting user document: ", error);
    });
}

function removeUserFromClub(thisClubID, userDocRef, user) {
    let params = new URL(window.location.href); // get URL of search bar
    let ID = params.searchParams.get("docID"); // get value for key "id"

    // remember thisClubID is a reference and not an ID bad naming I know
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
            document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()' style='background-color: #85ac9f;'>Join</button>"
            updateCount(thisClubID)
        }).catch(error => {
            console.error("Error updating user document: ", error);
        });
    }).catch(error => {
        console.error("Error updating club document: ", error);
    });
}

function addUserToClub(thisClubID, userDocRef, user) {
    let params = new URL(window.location.href); // get URL of search bar
    let ID = params.searchParams.get("docID"); // get value for key "id"

    // remember thisClubID is a reference and not an ID bad naming I know
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
            document.getElementById("insertJoinOrLeave").innerHTML = "<button onclick='leaveOrJoin()' style='background-color: #EB7875;'>Leave</button>"
            updateCount(thisClubID)
        }).catch(error => {
            console.error("Error updating user document: ", error);
        });
    }).catch(error => {
        console.error("Error updating club document: ", error);
    });
}

// little function junior to update the membersCount field when someone leaves or joins the club
function updateCount(thisClubID) {
    thisClubID.get().then(doc => {
        thisClubID.update({
            membersCount: doc.data().members.length
        })
        console.log("it is done")
    })
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
    location.href = "editClub.html?docID=" + clubID;
}

function addEvent() {
    let params = new URL(window.location.href); // get URL of search bar
    let clubID = params.searchParams.get("docID"); // get value for key "id"
    location.href = "addEvent.html?docID=" + clubID;
}

function allMembersList() {
    let params = new URL(window.location.href); // get URL of search bar
    let clubID = params.searchParams.get("docID"); // get value for key "id"
    location.href = "memberList.html?docID=" + clubID;
}

// function saveClubDocumentIDAndRedirect(){
//     let params = new URL(window.location.href) //get the url from the search bar
//     let ID = params.searchParams.get("docID");
//     localStorage.setItem("clubID", ID);
// }