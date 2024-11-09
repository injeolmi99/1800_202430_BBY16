function displayClubInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log(ID);

    db.collection("clubs")
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
                        console.log("Here");
                        document.getElementById("insertJoinOrLeave").innerHTML = "Leave    DO NOT PRESS"
                    } else {
                        console.log("not in club");
                        document.getElementById("insertJoinOrLeave").innerHTML = "Join     DO NOT PRESS";
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

// This is executed when the button is pressed doesnt work perfectly rn
function leaveOrJoin() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"

    let thisClubID = db.collection("clubs").doc(ID);

    let thisClub = thisClubID.get().then(doc => {
        
        let thisClub = doc.data();

        firebase.auth().onAuthStateChanged(user => {
            // maybe check later to ensure admin does not leave club
            if (user) {
                // if user is in club remove them from the club in their club list (in users) and the clubs members list
                // if the user is not in the club add club to their clubs list and the user to the members list
                if (thisClub.members.includes(user.uid)) {
                    //This route if user is in club
                    console.log("Guess what.... I worked")
                } else {
                    //This route if the user is not in club
                    console.log("starting add route");

                    // add user to club members list (somewhat works investigate it switching from array to number)
                    thisClubID.update({
                        members: thisClub.members.push(user.uid)
                    })
                    .then(() => {
                        console.log("Document successfully updated!");
                    })
                    .catch((error) => {
                        console.error("Error updating document: ", error);
                    });

                    //  add club to users club list
                    user.uid.update({
                        // got caught here user.clubs might be incorrect pathing
                        clubs: user.clubs.push(thisClubID)
                    })
                    .then(() => {
                        console.log("Document successfully updated!");
                    })
                    .catch((error) => {
                        console.error("Error updating document: ", error);
                    });
                    console.log("I made it to the bottom :)");
                }
            } else {
                // This route if no user is detected
                console.log("Failed at user check / none logged in?");
            }
        })
    })
}

// function saveClubDocumentIDAndRedirect(){
//     let params = new URL(window.location.href) //get the url from the search bar
//     let ID = params.searchParams.get("docID");
//     localStorage.setItem("clubID", ID);
// }