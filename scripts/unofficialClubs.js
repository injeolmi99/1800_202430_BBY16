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
    db.collection(collection).orderBy("members", "desc").get()   
        .then(allClubs => {

            allClubs.forEach(doc => { //iterate thru each doc
                var title = doc.data().name;       // get value of the "name" key
                var docID = doc.id;
                var img = doc.data().image;
                let newcard = cardTemplate.content.cloneNode(true);

                newcard.querySelector('.clubGroupButton').style.backgroundImage = "url('./images/" + img + ".jpg')";
                newcard.querySelector('.nameTag').innerHTML = title;

                newcard.querySelector('.nameTag').style.cursor = "pointer";
                // looks redundant, but because of the hover overlay i think this is needed for it to work on mobile
                newcard.querySelector(".clubGroupButton").addEventListener("click", () => {
                    location.href = "eachClub.html?docID=" + docID;
                });
                newcard.querySelector(".nameTag").addEventListener("click", () => {
                    location.href="eachClub.html?docID=" + docID;
                });
                document.getElementById(collection + "-go-here").appendChild(newcard);
            })
        })
}

function myFunction() {
  // Declare variables

  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById('myInput');
  filter = input.value.toUpperCase();
  //div = document.getElementById("clubsList");
  div1 = document.getElementById("unofficialClubs-go-here");
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

function filterSport() {
  // Declare variables

  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById('sport');
  filter = input.value.toUpperCase();
  //div = document.getElementById("clubsList");
  div1 = document.getElementById("unofficialClubs-go-here");
  div2 = div1.getElementsByClassName("clubGroup")


  // Loop through all list items, and hide those who don't match the search query
  db.collection(collection).get()
    .then(allClubs => {

      allClubs.forEach(doc => {
        var type = doc.data().category;
        document.getElementById("sport").addEventListener("click", function (e) {
          for (i = 0; i < div2.length; i++) {
            a = div2[i].getElementsByClassName("nameTag")[0];
            txtValue = type;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
              div2[i].style.display = "";
            } else {
              div2[i].style.display = "none";
            }
          }
        });

      })
    })
}