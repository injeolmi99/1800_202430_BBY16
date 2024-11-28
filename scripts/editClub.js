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

// use url to get club id then use id to get docs data then input data into text fields to be editted
// include a finish and cancel button

function displayClubData() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    let collection;
    let officialClubsList = db.collection("clubs").doc(ID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(ID);

    // injects the options into the image-selection placeholder 
    console.log($('#image-selection').load('./text/club_image_options.html'));

    // copied over club iterating logic from eachClub.js
    officialClubsList.get()
        .then(doc => {
            if (doc.exists) {
                collection = "clubs";
            } else {
                return unofficialClubsList.get();
            }
        })
        .then(doc => {
            if (!collection && doc.exists) {
                collection = "unofficialClubs";
            } else if (!collection) {
                console.error("Club doesn't exist!");
            }
        })
        .then(() => {
            db.collection(collection)
                .doc(ID)
                .get()
                .then(doc => {
                    thisClub = doc.data();
                    clubName = thisClub.name;
                    clubDescription = thisClub.description;
                    clubImage = thisClub.image;
                    clubType = thisClub.category;

                    document.getElementById("insertClubName").innerHTML = '<input type="text" name="clubName" id="clubName" value="' + clubName + '" maxlength="25" required="required">';
                    // event listener idea came from microsoft copilot when I was trying to find a way to restrict characters during live input
                    document.getElementById('clubName').addEventListener('input', function () {
                        // replaces any user input that is not A-Za-z0-9 ',.!?:/ with an empty space (appears nothing is happneing)
                        this.value = this.value.replace(/[^A-Za-z0-9 ',.!?:/]/g, '');
                    });
                    document.getElementById("insertDescription").innerHTML = "<textarea name='description' id='description' maxlength='800' pattern='[a-zA-Z0-9 ]' required='required'>" + clubDescription + "</textarea>";
                    // event listener idea came from microsoft copilot when I was trying to find a way to restrict characters during live input
                    document.getElementById('description').addEventListener('input', function () {
                        // replaces any user input that is <>{}\ with an empty space so users cannot input weird stuff (hopefully this is enough) (appears nothing is happneing)
                        // little regex stuff https://stackoverflow.com/questions/10911797/how-to-restrict-the-text-field-to-enter-only-digits
                        this.value = this.value.replace(/[<>{}\\]/g, '');
                        if (this.value.includes("$(")) {
                            console.log("here")
                            this.value = this.value.replace("$(", "$ (")
                        }
                    });

                    // displays the image that is currently in use for the club
                    document.getElementById("displayImage").src = "./images/clubImages/" + clubImage

                    // getting info on what club images we have works even if we add more
                    let dropdown = document.getElementById("image");
                    let options = dropdown.options;

                    // displays which image is currently selected on page load
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value == clubImage) {
                            dropdown.selectedIndex = i;
                            break;
                        }
                    }

                    // getting info on what club categories we have works even if we add more
                    let dropdown2 = document.getElementById("clubType");
                    let options2 = dropdown2.options;
                    
                    // displays what the current club type is (category)
                    for (let i = 0; i < options2.length; i++) {
                        if (options2[i].value == clubType) {
                            dropdown2.selectedIndex = i;
                            break;
                        }
                    }
                })
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
                        let newClubImage = document.getElementById("image").value;
                        let newClubType = document.getElementById("clubType").value;

                        thisClubID.update({
                            name: newClubName,
                            description: newClubDescription,
                            image: newClubImage,
                            category: newClubType
                        }).then(() => {
                            console.log("documents successfully updateded");
                            location.href = "eachClub.html?docID=" + ID;

                        }).catch(error => {
                            console.error("Error updating club data: ", error);
                        })
                    } else {
                        // This one is a little redundent since non admin users should have been removed by now
                        // but just incase
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
                                let newClubImage = document.getElementById("image").value;

                                thisClubID.update({
                                    name: newClubName,
                                    description: newClubDescription,
                                    image: newClubImage
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

function showImage() {
    document.getElementById("displayImage").src = "./images/clubImages/" + document.getElementById("image").value
}
