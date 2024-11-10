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

            //this is for displaying the Join or leave club button since it needs to change based on your status with the club
            // I dont understand why but the shorter method of getting userID isn't working on other pages
            // So I used this machine!
            firebase.auth().onAuthStateChanged(user => {
                // If a user is logged in then go inside else fail
                if (user) {

                    // Searches for the users ID in the club members array and acts accordingly
                    if (clubMembers.includes(user.uid)) {
                        // console.log("Here");
                        document.getElementById("insertJoinOrLeave").innerHTML = "Leave"
                    } else {
                        // console.log("not in club");
                        document.getElementById("insertJoinOrLeave").innerHTML = "Join";
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

// // This is executed when the button is pressed doesnt work perfectly rn
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
                                        document.getElementById("insertJoinOrLeave").innerHTML = "Join";
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
                                        document.getElementById("insertJoinOrLeave").innerHTML = "Leave"
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
            console.log("Club document not found.");
        }
    }).catch(error => {
        console.error("Error getting club document: ", error);
    });
}


// function saveClubDocumentIDAndRedirect(){
//     let params = new URL(window.location.href) //get the url from the search bar
//     let ID = params.searchParams.get("docID");
//     localStorage.setItem("clubID", ID);
// }