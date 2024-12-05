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
            displayAdmin(collection);
        })
};
displayClubInfo();

function displayAdmin(collection) {
    // displays admin of club separately in members list
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"

    db.collection(collection)
    .doc(ID)
    .get()
    .then(doc => {
        thisClub = doc.data();
        // display club image & name
        let clubImage = thisClub.image;
        let clubName = thisClub.name;
        let clubAdmin = thisClub.admin;

        db.collection("users").doc(clubAdmin).get().then(adminRef => {
            if (adminRef.exists) {
                let adminPFP = adminRef.data().profilePicture
                let adminDisplay = adminRef.data().displayName
                let adminName = adminRef.data().name
                let adminDesc = adminRef.data().description
                document.getElementById("insert-admin").innerHTML = '<div class="topBar"><img src="' + adminPFP + '" alt="Profile missing" class="pfp"> ' + adminDisplay + ' ( ' + adminName + ' ) </div><div class="userDescription">' + adminDesc + '</div>'
            } else {
                document.getElementById("insert-admin").innerHTML = "This club has no admin";
            }
        })

        document.getElementById("clubImage").style.backgroundImage = "url('./images/clubImages/" + clubImage + "')"
        document.getElementById("clubName").innerHTML = clubName;
        displayCardsDynamically(collection);
    })
}

function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("memberCardTemplate");

    let params = new URL(window.location.href);
    let ID = params.searchParams.get("docID");


    db.collection(collection).doc(ID).get()
        .then(club => {
            let members = club.data().members;
            let admin = club.data().admin;

            members.forEach(userID => {
                db.collection("users").doc(userID).get()
                    .then(userDoc => {
                        if (userDoc.exists && userID != admin) {
                            let newcard = cardTemplate.content.cloneNode(true);
                            let userData = userDoc.data();
                            newcard.querySelector('.topBar').innerHTML =
                                '<img src="' + userData.profilePicture + '" alt="Profile missing" class="pfp"> ' + userData.displayName + ' (' + userData.name + ') ';
                            newcard.querySelector('.userDescription').innerHTML = userData.description;
                            document.getElementById("insert-members").appendChild(newcard);
                        } else if (userDoc.exists && userID == admin) {
                            console.log("admin found")
                        } else {
                            console.log("user with sought ID does not exist")
                        }
                    }).catch(error => {
                        console.log("Failed to fetch user data:", error);
                    });
            });
        }).catch(error => {
            console.log("Failed to fetch club data:", error);
        });
}