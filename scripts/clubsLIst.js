// function getNameFromAuth() {
//     firebase.auth().onAuthStateChanged(user => {
//         // Check if a user is signed in:
//         if (user) {
//             // Do something for the currently logged-in user here: 
//             console.log(user.uid); //print the uid in the browser console
//             console.log(user.displayName);  //print the user name in the browser console
//             userName = user.displayName;

//             //method #1:  insert with JS
//             document.getElementById("name-goes-here").innerText = userName;    

//             //method #2:  insert using jquery
//             //$("#name-goes-here").text(userName); //using jquery

//             //method #3:  insert using querySelector
//             //document.querySelector("#name-goes-here").innerText = userName

//         } else {
//             // No user is signed in.
//             console.log ("No user is logged in");
//         }
//     });
// }
//getNameFromAuth(); //run the function

//CODE ABOVE HERE IS NOT USED AND IS JUST FOR REFERENCE

// function insertNameFromFirestore() {
//     // Check if the user is logged in:
//     firebase.auth().onAuthStateChanged(user => {
//         if (user) {
//             console.log(user.uid); // Let's know who the logged-in user is by logging their UID
//             currentUser = db.collection("users").doc(user.uid); // Go to the Firestore document of the user
//             currentUser.get().then(userDoc => {
//                 // Get the user name
//                 let userName = userDoc.data().name;
//                 console.log(userName);
//                 //$("#name-goes-here").text(userName); // jQuery
//                 document.getElementById("name-goes-here").innerText = userName;
//             })
//         } else {
//             console.log("No user is logged in."); // Log a message when no user is logged in
//         }
//     })
// }
// insertNameFromFirestore();

//=====================================================================
//EVERYTHING ABOVE HERE IS JUST FOR REFERENCE SECOND CHUNK IS IN PROFILE.JS
//====================================================================

function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("clubsListTemplate");
    db.collection(collection).get()   
        .then(allClubs => {
            
            allClubs.forEach(doc => { //iterate thru each doc
                var title = doc.data().name;       // get value of the "name" key
                var docID = doc.id;
                let newcard = cardTemplate.content.cloneNode(true);
                
                newcard.querySelector('.clubGroupButton').innerHTML = title;
                newcard.querySelector(".clubGroupButton").addEventListener("click", () => {
                    sessionStorage.setItem("previousPage", window.location.href);
                    location.href = "eachClub.html?docID=" + docID;
                });
                document.getElementById(collection + "-go-here").appendChild(newcard);
            })
        })
}


// stub, will come back to later
function toggle(clubType) {
    document.getElementById(clubType).addEventListener("click", () => {
        if (clubType = "official")
        {
            
        }
    })   
}