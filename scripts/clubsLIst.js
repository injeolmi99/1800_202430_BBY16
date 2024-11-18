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

function displayCardsDynamically(collection) {
    let cardTemplate = document.getElementById("clubsListTemplate");
    db.collection(collection).get()
        .then(allClubs => {

            allClubs.forEach(doc => { //iterate thru each doc
                var title = doc.data().name;       // get value of the "name" key
                var docID = doc.id;
                var img = doc.data().image;
                let newcard = cardTemplate.content.cloneNode(true);

                newcard.querySelector('.clubGroupButton').style.backgroundImage = "url('./images/clubImages/" + img + "')";
                newcard.querySelector('.nameTag').innerHTML = title;

                newcard.querySelector('.nameTag').style.cursor = "pointer";
                // looks redundant, but because of the hover overlay i think this is needed for it to work on mobile
                newcard.querySelector(".clubGroupButton").addEventListener("click", () => {
                    location.href = "eachClub.html?docID=" + docID;
                });
                newcard.querySelector(".nameTag").addEventListener("click", () => {
                    location.href = "eachClub.html?docID=" + docID;
                });
                document.getElementById(collection + "-go-here").appendChild(newcard);
            })
        })
}

function toggleClubs() {
    if (document.getElementById("officialToggle").classList.contains("active")) {
        document.getElementById("clubs-go-here").style.display = "flex";
        document.getElementById("unofficialClubs-go-here").style.display = "none";
        document.getElementById("createClubButton").style.display = "none";
    }

    if (document.getElementById("unofficialToggle").classList.contains("active")) {
        document.getElementById("unofficialClubs-go-here").style.display = "flex";
        document.getElementById("clubs-go-here").style.display = "none";
        document.getElementById("createClubButton").style.display = "block";
    }

    // just to update search results
    searchClubs();
}

function searchClubs() {
    // Declare variables

    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('searchInput');
    filter = input.value.toUpperCase();
    //div = document.getElementById("clubsList");

    let div1;
    let div2;

    if (document.getElementById("officialToggle").classList.contains("active")) {
        div1 = document.getElementById("clubs-go-here");
    } else if (document.getElementById("unofficialToggle").classList.contains("active")) {
        div1 = document.getElementById("unofficialClubs-go-here");
    }

    div2 = div1.getElementsByClassName("clubGroup")
    div2 = div1.getElementsByClassName("clubGroup")

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < div2.length; i++) {
        a = div2[i].getElementsByClassName("nameTag")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            div2[i].style.display = "";
        } else {
            div2[i].style.display = "none";
        }
    }
}

function loadClubs() {
    window.onload = (e) => {
        displayCardsDynamically("clubs");
        displayCardsDynamically("unofficialClubs");
        // since our page always toggles to official on load by default
        document.getElementById("unofficialClubs-go-here").style.display = "none";
        document.getElementById("createClubButton").style.display = "none";
    }
} loadClubs();

function createClubCheck() {
    firebase.auth().onAuthStateChanged(user => {
        currentUser = db.collection("users").doc(user.uid);
        currentUser.get().then(userDoc => {
            let userData = userDoc.data()
            if (userData.clubsMade != null && userData.clubsMade >= 2) {
                alert("You have made the maximum number of clubs per user (2)")
            } else {
                location.href = 'createAClub.html'
            }
        })
    })
}