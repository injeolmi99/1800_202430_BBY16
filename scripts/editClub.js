// use url to get club id then use id to get docs data then input data into text fields to be editted
// include a finish and cancel button

function displayClubData() {
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

            document.getElementById("insertClubName").innerHTML = "<input type='text' id='clubName' value='" + clubName + "'>";
            document.getElementById("insertDescription").innerHTML = "<textarea id='description'>" + clubDescription + "</textarea>";

            // let imgEvent = document.querySelector( ".club-img" );
            // imgEvent.src = "../images/" + [would need some kind of identifier] + ".jpg";
        });
}
displayClubData();

//not sure why but naming this cancel doesnt work
function goBack() {
    let params = new URL(window.location.href); // get URL of search bar
    let clubID = params.searchParams.get("docID"); // get value for key "id"
    location.href = "eachClub.html?docID=" + clubID;
}

function submitNewClubData() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    let thisClubID = db.collection("clubs").doc(ID);

    thisClubID.get().then(doc => {
        if (doc.exists) {

            let clubData = doc.data();
            let clubAdmin = clubData.admin

            //Validate the the current user ID is the admin... noticed it is easy to edit any page as non admin
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    // Get user document from Firestore (just saving myself typing later)
                    if (user.uid == clubAdmin) {
                        newClubName = document.getElementById("clubName").value;
                        newClubDescription = document.getElementById("description").value;

                        thisClubID.update({
                            name: newClubName,
                            description: newClubDescription
                        }).then(() => {
                            console.log("documents successfully updateded");
                            location.href = "eachClub.html?docID=" + ID;

                        }).catch(error => {
                            console.error("Error updating club data: ", error);
                        })
                    } else {
                        // kick user out of the club editting page (not like this does much)
                        // console.log("you are not the admin of this club")
                        location.href = "clubsList.html";
                    }
                } else {
                    console.log("no user signed in");
                }
            })
        } else {
            let thisClubID = db.collection("unofficialClubs").doc(ID);
            thisClubID.get().then(doc => {
                if (doc.exists) {

                    let clubData = doc.data();
                    let clubAdmin = clubData.admin

                    firebase.auth().onAuthStateChanged(user => {
                        if (user) {
                            if (user.uid == clubAdmin) {
                                newClubName = document.getElementById("clubName").value;
                                newClubDescription = document.getElementById("description").value;

                                thisClubID.update({
                                    name: newClubName,
                                    description: newClubDescription
                                }).then(() => {
                                    console.log("documents successfully updateded");
                                    location.href = "eachClub.html?docID=" + ID;

                                }).catch(error => {
                                    console.error("Error updating club data: ", error);
                                })
                            } else {
                                // kick user out
                                location.href = "clubsList.html";
                            }
                        } else {
                            console.log("no user signed in")
                        }
                    })
                } else {
                    console.log("COULDNT FIND CLUB!")
                }
            })
        }
    })
}