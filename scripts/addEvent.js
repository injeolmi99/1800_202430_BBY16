/*
All the building locations just incase we need them again.
South: 
SW 09 : 49.24857536289865, -123.00274153271305
SE 16 (Gym): 49.248821337536015, -123.00094916404845
SW 05: 49.24974456802986, -123.0026528302279
SE 14 (Library): 49.2494678791054, -123.00086182086471
SE 12: 49.24990032887676, -123.00159234772002
SW 03: 49.25007107444886, -123.00272012119277
SW 01: 49.25099574023467, -123.0030333902101
SE 08: 49.25073797388921, -123.00135710569865
SE 02: 49.25136646079736, -123.00123486535863
SE 06: 49.250885178247934, -123.00032058720731
SE 04: 49.25134720958921, -123.00018418280261
SW 02: 49.25039633236194, -123.00336826173275

North:
NW 04: 49.25222548924861, -123.00326137777313
NW 06: 49.2520930269151, -123.00239623167768
NE 20: 49.252070408319184, -123.00158390914409
NE 18: 49.25205729646503, -123.00066257561633
NE 16: 49.25205322196024, -122.99984796498873
NW 05: 49.252530285598695, -123.0023868047943
NE 24: 49.25246060738597, -123.00112420511353
NE 28: 49.25246352289768, -122.9998690731043
NE 12: 49.25268383925315, -122.99851102168671
NW 03: 49.253269850999274, -123.00262035068683
NE 21: 49.25290541665572, -123.00171361831197
NE 02: 49.25330364399672, -123.00152686035634
NE 04: 49.25332696343335, -123.00061225482666
NE 23: 49.25289322010892, -123.00109099365861
NE 06: 49.25329157404717, -122.99976647678889
NE 08: 49.25322899311032, -122.99923785407121
NE 10: 49.25325002341487, -122.99847399904702
NE 01: 49.2541040499435, -123.00139668750403
NE 09: 49.25402049147764, -122.99871386444704
NE 07: 49.253693522213254, -122.99858584592

Downtown:
Downtown Campus: 49.28349095247658, -123.11525139626357

*/

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

function addEvent() {
    let params = new URL(window.location.href); //get URL of search bar
    let ID = params.searchParams.get("docID"); //get value for key "id"
    console.log("adding event for " + ID);

    let collection;
    let officialClubsList = db.collection("clubs").doc(ID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(ID);

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
            let eventName = document.getElementById("eventName").value;
            // this is needed because if we just get the value raw from the form it'll store in Firestore as a string, which might be fine but i already coded the event display cards to convert from Firestore timestamp to Javascript date object
            let dateBeforeConverting = new Date(document.getElementById("eventDate").value);
            let eventDateTime = firebase.firestore.Timestamp.fromDate(dateBeforeConverting);
            // let eventLocation = document.getElementById("eventLocation").value;
            let eventDescription = document.getElementById("description").value;

            // Idea for how to split string from: https://stackoverflow.com/questions/96428/how-do-i-split-a-string-breaking-at-a-particular-character
            let geo = document.getElementById("eventLocation2").value;
            let fields = geo.split('|');

            let eventLocation = fields[0];
            let latitude = fields[1];
            let longitude = fields[2];

            db.collection(collection)
                .doc(ID)
                .get()
                .then(() => {
                    var user = firebase.auth().currentUser;
                    db.collection(collection).doc(ID).collection("events").add({
                        event: eventName,
                        date: eventDateTime,
                        location: eventLocation,
                        description: eventDescription,
                        lat: latitude,
                        lng: longitude,
                        attendees: [user.uid],
                    }).then(() => {
                        alert("Your event was added successfully!");
                        history.back();
                    })
                })
        })
}