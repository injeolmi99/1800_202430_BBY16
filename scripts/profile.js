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

// INSERTS THE USERNAME INTO THE PROFILE PAGE
var currentUser;
function insertNameFromFirestore() {
    // Check if the user is logged in:
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log(user.uid); // Let's know who the logged-in user is by logging their UID
            currentUser = db.collection("users").doc(user.uid); // Go to the Firestore document of the user
            currentUser.get().then(userDoc => {
                // Get the user name
                let userName = userDoc.data().name;
                console.log(userName);
                let userEmail = userDoc.data().email;
                console.log(userEmail);
                let userDisplayName = userDoc.data().displayName;
                console.log(userDisplayName);
                let userDescription = userDoc.data().description;
                console.log(userDescription);
                let userPic = userDoc.data().profilePicture;
                console.log(userPic)
                //$("#name-goes-here").text(userName); // jQuery
                if(userName != null){
                    document.getElementById("nameInput").value = userName;
                }
                if(displayNameInput != null){
                    document.getElementById("displayNameInput").value = userDisplayName;
                }
                if(userEmail != null){
                    document.getElementById("emailInput").value = userEmail;
                }
                if(userDescription != null){
                    document.getElementById("descriptionInput").value = userDescription;
                }
                // inserts the users profile picture if it is not null else asigns the first one
                if (userPic != null) {
                    document.getElementById('insert-pfp').innerHTML = '<img class="responsive" src="' + userPic + '" alt="">'
                } else {
                    // just hardcoding it to asign the user the first pfp if they do not already have one for some reason
                    currentUser.update({
                        profilePicture: "./images/icons/pfp1.png"
                    }).then(() => {
                        currentUser.get().then(newUserDoc => {
                            let forcedPFP = newUserDoc.data().profilePicture
                            document.getElementById('insert-pfp').innerHTML = '<img class="responsive" src="' + forcedPFP + '" alt="">'
                        })
                    })
                }
                
            })
        } else {
            console.log("No user is logged in."); // Log a message when no user is logged in
        }
    })
}
insertNameFromFirestore();

function editUserInfo() {
    //Enable the form fields
    document.getElementById('personalInfoFields').disabled = false;
    // thow in edit profile pic button
    // Change inner text to a pencil image eventually
    document.getElementById('insert-edit-pic-button').innerHTML = "<button id='change-profile-pic-button' onclick='openAvailablePics()'><span class='material-icons'>edit</span></button>";
 }

 function saveUserInfo() {
    //enter code here
    userName = document.getElementById('nameInput').value;
    userDisplayName = document.getElementById('displayNameInput').value;
    // it is important (at least for now) that the user cannot change their email becuase it is used for authentication purposes
    // userEmail = document.getElementById('emailInput').value;
    userDescription = document.getElementById('descriptionInput').value;

    currentUser.update({
        name: userName,
        // email: userEmail,
        displayName: userDisplayName,
        description: userDescription
    })
    .then(() => {
        console.log("Document successfully updated!");
    })

    // Iterate though each profile pic number to tell if it has been selected 
    let num = 1;
    while (num <= 30) {
        if (document.getElementById("pfp" + num) != null && document.getElementById("pfp" + num).checked) {
            currentUser.update({
                profilePicture: document.getElementById("pfp" + num).value
            }).then(() => {
                // kinda redundent now that live feedback works but its kinda a just incase 
                currentUser.get().then((userDoc) => {
                    let newPFP = userDoc.data().profilePicture;
                    document.getElementById('insert-pfp').innerHTML = '<img class="responsive" src="' + newPFP + '" alt="">'
                })
            })
        }
        num += 1;
    }

    // clear all editable things
    document.getElementById('insert-edit-pic-button').innerHTML = ""
    document.getElementById("insert-profile-options").innerHTML = "";
    document.getElementById('personalInfoFields').disabled = true;
    //a) get user entered values

    //b) update user's document in Firestore

    //c) disable edit 
}

function openAvailablePics() {
    let num = 1;
    //reset the display so we don't keep adding more and more 
    document.getElementById("insert-profile-options").innerHTML = "";
    // Each picture is specifically named so this loop will work
    while (num <= 30) {
        document.getElementById("insert-profile-options").innerHTML += "<input type='radio' id='pfp" + num + "' name='pfp' value='./images/icons/pfp" + num + ".png'><label for='pfp" + num +"'><img onclick='liveUpdatePFP(\"./images/icons/pfp" + num + ".png\")' class='icons-image' src='./images/icons/pfp" + num + ".png' alt='icon missing'></label>"
        num += 1;
    }
}

//function to give instant feedback based on what a user clicks
function liveUpdatePFP(pfp) {
    document.getElementById('insert-pfp').innerHTML = '<img class="responsive" src="' + pfp + '" alt="">'
}

// These next three methods restrict the input on Name, display name, and description
document.getElementById('nameInput').addEventListener('input', function() {
    // replaces any user input that is not A-Za-z -' with an empty space (appears nothing is happneing)
    this.value = this.value.replace(/[^A-Za-z -']/g, '');
});


document.getElementById('displayNameInput').addEventListener('input', function() {
    // replaces any user input that is <>{}\$ with an empty space (appears nothing is happneing)
    this.value = this.value.replace(/[<>{}\\$]/g, '');
});

document.getElementById('descriptionInput').addEventListener('input', function() {
    // replaces any user input that is <>{}\ with an empty space so users cannot input weird stuff (hopefully this is enough) (appears nothing is happneing)
    this.value = this.value.replace(/[<>{}\\]/g, '');
    // if users input $( a space gets added between the $ and ( to prevent some possible insertions
    if (this.value.includes("$(")) {
        this.value = this.value.replace("$(", "$ (")
    }
});