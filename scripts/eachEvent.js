var currentUser;
var map;
const features = [];

function removeUnloggedinUsers() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("user detected");
            currentUser = user;
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

// checks if club is official or unofficial, then displays its info
function displayEventInfo() {
    let params = new URL(window.location.href); //get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id

    // new and improved way to check club bc storing previousPage url in session storage was unreliable and hack-y
    let collection;
    let clubMembers;
    let clubName;
    let admin;
    let officialClubsList = db.collection("clubs").doc(clubID);
    let unofficialClubsList = db.collection("unofficialClubs").doc(clubID);

    officialClubsList.get()
        .then(doc => {
            if (doc.exists) {
                // if official club, set collection to "clubs"
                collection = "clubs";
                clubMembers = doc.data().members;
                clubName = doc.data().name;
                admin = doc.data().admin;
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
                clubMembers = doc.data().members;
                clubName = doc.data().name;
                admin = doc.data().admin;
            } else if (!collection) {
                console.error("Club doesn't exist!");
            }

            firebase.auth().onAuthStateChanged(user => {
                // If a user is logged in then go inside else fail
                if (user) {

                    // Searches for the users ID in the club members array and acts accordingly
                    if (clubMembers.includes(user.uid) && user.uid == admin) {
                        document.getElementById("Admin-edit-button-goes-here").innerHTML = "<button onclick='editEvent()'><span class='material-icons'>settings</span> Edit Event</button>";
                        document.getElementById("Admin-delete-button-goes-here").innerHTML = "<button id='delete-event' onclick='deleteEvent()'><span class='material-icons'>warning</span> Delete Event</button>";
                    }

                    // only shows the ability to join the event if the user is a member of the club (anyone else can see the events data so this doesnt do much)
                    if (clubMembers.includes(user.uid)) {
                        document.getElementById("going").style.display = "inline";
                    }
                } else {
                    console.log("Failed at user check / none logged in?");
                }
            })
        })
        .then(() => {
            db.collection(collection).doc(clubID).collection("events").doc(eventID)
                .get()
                .then(doc => {
                    thisEvent = doc.data();
                    let eventName = thisEvent.event;
                    let eventDescription = thisEvent.description;
                    let eventTimestamp = thisEvent.date.toDate();
                    let location = thisEvent.location;
                    let date = formatDate(eventTimestamp);
                    let time = eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes();
                    let eventAttendees = thisEvent.attendees;

                    document.getElementById("eventName").innerHTML = eventName;
                    document.getElementById("eventDescription").innerHTML = eventDescription;
                    document.querySelector('.eventLocation').innerHTML += location;
                    document.querySelector('.numberGoing').innerHTML += thisEvent.attendees.length + " going";
                    document.querySelector('.eventDate').innerHTML += date;
                    document.querySelector('.eventTime').innerHTML += time;

                    document.querySelector('#clubName').innerHTML = `<a href="/eachClub.html?docID=${clubID}">» ${clubName} «</a>`;

                    lat = thisEvent.lat;
                    lng = thisEvent.lng;
                    coordinates = [lng, lat];

                    description = "Find Us Here!";
                    pushToFeatures(description, coordinates);

                    showMap();

                    // Sets the status of if the user is going or not
                    if (thisEvent.attendees.includes(currentUser.uid)) {
                        document.querySelector('#insert-status').innerHTML = "check_circle";
                        // overwrites the classes of the element by id insert-status
                        document.querySelector('#insert-status').className = "material-icons green";
                    } else {
                        document.querySelector('#insert-status').innerHTML = "check_circle";
                        document.querySelector('#insert-status').className = "material-icons red";
                    }

                    eventAttendees.forEach((attendee => {
                        db.collection("users").doc(attendee).get()
                            .then(doc => {
                                document.querySelector('#insert-members').innerHTML += "<div class='attendee'><img class='pfp' src='" + doc.data().profilePicture + "'>" + doc.data().displayName + "</div>";
                            })
                    }))
                })
        })
};
displayEventInfo();

// format date to be displayed on card
function formatDate(date) {
    let d = date.getDate();
    let m = date.getMonth(); //Month from 0 to 11
    let y = date.getFullYear();

    let day = date.getDay(); //Day from 0 to 6

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return "" + dayNames[day] + ", " + monthNames[m] + " " + d;
}

function editEvent() {
    let params = new URL(window.location.href); // get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id
    location.href = "editEvent.html?docID=" + clubID + "&eventID=" + eventID;
}

function changeGoing() {
    let params = new URL(window.location.href); //get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id

    let thisClubRef = db.collection("clubs").doc(clubID);

    thisClubRef.get().then(doc => {
        if (doc.exists) {
            // official clubs route
            eventRef = thisClubRef.collection("events").doc(eventID);
            eventRef.get().then(eventDoc => {
                let peopleGoing = eventDoc.data().attendees;

                if (peopleGoing.includes(currentUser.uid)) {
                    eventRef.update({
                        attendees: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
                    })
                    console.log("removed from list")
                    document.querySelector('#insert-status').innerHTML = "check_circle";
                    document.querySelector('#insert-status').className = "material-icons red";
                    updateGoingList(eventRef)
                } else {
                    eventRef.update({
                        attendees: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                    })
                    console.log("added to list")
                    document.querySelector('#insert-status').innerHTML = "check_circle";
                    document.querySelector('#insert-status').className = "material-icons green";
                    updateGoingList(eventRef)
                }
            })
        } else {
            // unnofficial clubs route
            let thisClubRef = db.collection("unofficialClubs").doc(clubID);
            thisClubRef.get().then(doc => {
                if (doc.exists) {
                    // official clubs route
                    eventRef = thisClubRef.collection("events").doc(eventID);
                    eventRef.get().then(eventDoc => {
                        let peopleGoing = eventDoc.data().attendees;

                        if (peopleGoing.includes(currentUser.uid)) {
                            eventRef.update({
                                attendees: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
                            })
                            console.log("removed from list")
                            document.querySelector('#insert-status').innerHTML = "check_circle";
                            document.querySelector('#insert-status').className = "material-icons red";
                            updateGoingList(eventRef)
                        } else {
                            eventRef.update({
                                attendees: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                            })
                            console.log("added to list")
                            document.querySelector('#insert-status').innerHTML = "check_circle";
                            document.querySelector('#insert-status').className = "material-icons green";
                            updateGoingList(eventRef)
                        }
                    })
                } else {
                    console.log("club does not exist")
                }
            })
        }
    })
}

function updateGoingList(eventRef) {
    eventRef.get().then(eventDoc => {
        let peopleGoing = eventDoc.data().attendees;
        document.querySelector('.numberGoing').innerHTML = peopleGoing.length + " going";
        document.querySelector('#insert-members').innerHTML = "";
        peopleGoing.forEach((attendee => {
            db.collection("users").doc(attendee).get()
                .then(doc => {
                    document.querySelector('#insert-members').innerHTML += "<div class='attendee'><img class='pfp' src='" + doc.data().profilePicture + "'>" + doc.data().displayName + "</div>";
                })
        }))
    })
}

function deleteEvent() {
    let params = new URL(window.location.href); // get URL of search bar
    let clubID = params.searchParams.get("docID"); //get value for club id
    let eventID = params.searchParams.get("eventID"); //get value for event id
    let collection = "clubs"

    // Stolen from create a club js (thats our code for anyone wondering)
    Swal.fire({
        icon: "warning",
        title: "Are you sure you want to delete the event?",
        text: "Events cannot be retrieved after deletion!",
        showDenyButton: true,
        confirmButtonColor: "#85ac9f",
        denyButtonColor: "#EB7875",
        confirmButtonText: "Keep event",
        denyButtonText: "Delete event"
    }).then((result) => {
        if (result.isDenied) {
            deleteIt(clubID, eventID, collection);
        }
    })
}

function deleteIt(clubID, eventID, collection) {
    // this all happens only if the user hits Delete event on the sweet alert or whatever it is called
    db.collection(collection).doc(clubID).collection("events").doc(eventID).get().then(doc => {
        if (doc.exists) {
            // delete event then redirect to club page Eachclub
            //console.log("official")
            db.collection(collection).doc(clubID).collection("events").doc(eventID).delete().then(() => {
                window.location.href = "eachClub.html?docID=" + clubID;
            })
        } else {
            // unofficial clubs path
            collection = "unofficialClubs";
            db.collection(collection).doc(clubID).collection("events").doc(eventID).get().then(doc => {
                if (doc.exists) {
                    // delete event then redirect to unnoficial club page Eachclub
                    //console.log("unofficial")
                    db.collection(collection).doc(clubID).collection("events").doc(eventID).delete().then(() => {
                        window.location.href = "eachClub.html?docID=" + clubID;
                    })
                } else {
                    // At this point this should never run but just incase :)
                    console.log("Event does not exist");
                }
            })
        }
    })
}

function showMap() {
    //------------------------------------------
    // Defines and initiates basic mapbox data
    //------------------------------------------
    // TO MAKE THE MAP APPEAR YOU MUST
    // ADD YOUR ACCESS TOKEN FROM
    // https://account.mapbox.com
    // Source: https://bcit-cst.notion.site/M01-How-to-implement-Mapbox-to-show-the-location-of-posts-eg-hikes-and-the-location-of-the-user-1306dfaf038a81e9b495ef984340b27e
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5qZW9sbWk5OSIsImEiOiJjbTN5cjBrNGoxdjlqMmlvYjBxYmZ2ajR2In0.QolTQid4w4FiVh5_IfKRZw';
    map = new mapboxgl.Map({
        container: 'map', // Container ID
        style: 'mapbox://styles/mapbox/streets-v11', // Styling URL
        center: [-123.0010006, 49.2494324], // Starting position
        zoom: 10 // Starting zoom
    });

    // Add user controls to map, zoom bar
    map.addControl(new mapboxgl.NavigationControl());

    //------------------------------------------------
    // Add listener for when the map finishes loading.
    // After loading, we can add map features
    //------------------------------------------------
    map.on('load', () => {

        //--------------------------------------
        // Add interactive pins for the event and user's location
        //--------------------------------------
        addEventPin(map);
    });
}

function pushToFeatures(description, coordinates) {

    features.push({
        'type': 'Feature',
        'properties': {
            'description': description
        },
        'geometry': {
            'type': 'Point',
            'coordinates': coordinates
        }
    })
}

function addEventPin(map) {
    map.loadImage(
        './images/mapPin.png',
        (error, image) => {
            if (error) throw error;
            map.addImage('eventpin', image); // Pin Icon
        }
    )
    
    displayMap(map);
}

function displayMap(map) {
    // Adds features (in our case, pins) to the map
    // "places" is the name of this array of features
    map.addSource('place', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': features
        }
    });

    // Creates a layer above the map displaying the pins
    map.addLayer({
        'id': 'place',
        'type': 'symbol',
        'source': 'place',
        'layout': {
            'icon-image': 'eventpin', // Pin Icon
            'icon-size': 0.06, // Pin Size
            'icon-allow-overlap': true // Allows icons to overlap
        }
    });

    // When one of the "places" markers are clicked,
    // create a popup that shows information 
    // Everything related to a marker is save in features[] array
    map.on('click', 'place', (e) => {
        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;

        // Ensure that if the map is zoomed out such that multiple 
        // copies of the feature are visible, the popup appears over 
        // the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'place', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Defaults cursor when not hovering over the places layer
    map.on('mouseleave', 'place', () => {
        map.getCanvas().style.cursor = '';
    });
}