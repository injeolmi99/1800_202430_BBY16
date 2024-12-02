function removeUnloggedinUsersandClubOwners() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("user detected");
            // validating that the user has not created 2 clubs yet
            // if they have we will remove them
            currentUser = db.collection("users").doc(user.uid);
            currentUser.get().then(userDoc => {
                let userData = userDoc.data()
                // console.log(userData)
                if (userData.clubsMade != null && userData.clubsMade >= 2) {
                    // users owns the max number of clubs or more so we can kick them out of this form
                    Swal.fire({
                        icon: "error",
                        title: "Oops...",
                        text: "You have made the maximum number of clubs per user (2)!",
                        confirmButtonColor: "#4089C0"
                    }).then(() => {
                        history.back();
                    });
                } else if (userData.clubsMade == null) {
                    // the user does not have a clubs made field so we will create one and set to 0
                    currentUser.update({
                        clubsMade: 0
                    })
                } else {
                    console.log("Users current owned clubs: " + userData.clubsMade)
                }
            })
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
removeUnloggedinUsersandClubOwners();

function onPageLoad() {
    // injects the options into the image-selection placeholder 
    $('#image-selection').load('./text/club_image_options.html')
    // couldnt get current image so I forced it to default cause thats the one that shows up when the page is first loaded
    document.getElementById("displayImage").src = "./images/clubImages/default.jpg"
}
onPageLoad();

function createClub() {
    var user = firebase.auth().currentUser;
    // console.log(user)
    let clubName = document.getElementById("clubName").value;
    let clubDescription = document.getElementById("description").value;
    let clubImage = document.getElementById("image").value;
    let clubType = document.getElementById("clubType").value;
    // note to self to remember later: .add returns a promise in this case it is the reference to the club 
    db.collection("unofficialClubs").add({
        name: clubName,
        admin: user.uid,
        description: clubDescription,
        members: [user.uid],
        image: clubImage,
        category: clubType,
        membersCount: 1
        // optional?
        // timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(clubRef => {
        // uses the promise of the add as a path to the new club ID to add the new club to users clubs array
        // console.log("new doc id: " + clubRef.id)
        // also increases the number of clubs made by the user by one
        db.collection("users").doc(user.uid).get().then(userDoc => {
            let userData = userDoc.data();
            // console.log("userData: " + userData)
            let newClubAmount = userData.clubsMade + 1;
            // console.log(userData.clubsMade)
            // console.log("newClubAmount: " + newClubAmount)
            db.collection("users").doc(user.uid).update({
                clubs: firebase.firestore.FieldValue.arrayUnion(clubRef.id),
                clubsMade: newClubAmount
            }).then(() => {
                Swal.fire({
                    title: "Success!",
                    text: "Your club has been added!",
                    icon: "success",
                    confirmButtonText: "Continue",
                    confirmButtonColor: "#4089C0"
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = "home.html";
                    }
                })
            })
        })
    })
}

function confirmCancellation() {
    Swal.fire({
        icon: "warning",
        title: "Are you sure you want to exit?",
        text: "You will lose your progress!",
        showDenyButton: true,
        confirmButtonColor: "#85ac9f",
        denyButtonColor: "#EB7875",
        confirmButtonText: "Keep editing",
        denyButtonText: "Discard"
    }).then((result) => {
        if (result.isDenied) {
            history.back();
        }
    })
}

function showImage() {
    document.getElementById("displayImage").src = "./images/clubImages/" + document.getElementById("image").value
}

// https://stackoverflow.com/questions/10911797/how-to-restrict-the-text-field-to-enter-only-digits
document.getElementById('clubName').addEventListener('input', function () {
    // replaces any user input that is not A-Za-z0-9 ',.!?:/ with an empty space (appears nothing is happneing)
    this.value = this.value.replace(/[^A-Za-z0-9 ',.!?:/]/g, '');
});

document.getElementById('description').addEventListener('input', function () {
    // replaces any user input that is <>{}\ with an empty space so users cannot input weird stuff (hopefully this is enough) (appears nothing is happneing)
    this.value = this.value.replace(/[<>{}\\]/g, '');
    // if users input $( a space gets added between the $ and ( to prevent some possible insertions
    if (this.value.includes("$(")) {
        console.log("here")
        this.value = this.value.replace("$(", "$ (")
    }
});