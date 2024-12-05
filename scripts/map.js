const eventList = [];
const features = [];
var count = 0;

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

function showMap() {
    //------------------------------------------
    // Defines and initiates basic mapbox data
    //------------------------------------------
    // TO MAKE THE MAP APPEAR YOU MUST
    // ADD YOUR ACCESS TOKEN FROM
    // https://account.mapbox.com
    // Source: https://bcit-cst.notion.site/M01-How-to-implement-Mapbox-to-show-the-location-of-posts-eg-hikes-and-the-location-of-the-user-1306dfaf038a81e9b495ef984340b27e
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5qZW9sbWk5OSIsImEiOiJjbTN5cjBrNGoxdjlqMmlvYjBxYmZ2ajR2In0.QolTQid4w4FiVh5_IfKRZw';
    const map = new mapboxgl.Map({
        container: 'map', // Container ID
        style: 'mapbox://styles/mapbox/streets-v11', // Styling URL
        center: [-122.964274, 49.236082], // Starting position
        zoom: 10 // Starting zoom
    });

    // Add user controls to map, zoom bar
    map.addControl(new mapboxgl.NavigationControl());

    //------------------------------------------------
    // Add listener for when the map finishes loading.
    // After loading, we can add map features
    //------------------------------------------------
    map.on('load', () => {

        //---------------------------------
        // Add interactive pins for the hikes
        //---------------------------------
        addEventPins(map, "clubs");
        addEventPins(map, "unofficialClubs");

        //--------------------------------------
        // Add interactive pin for the user's location
        //--------------------------------------
        addUserPin(map);

    });
}
showMap();   // Call it! 

function addEventPins(map, collection) {
    map.loadImage(
        './images/mapPin.png',
        (error, image) => {
            if (error) throw error;

            // Add the image to the map style.
            map.addImage(collection + '-eventpin', image); // Pin Icon

            let clubCollection = db.collection(collection);

            // READING information from "events" collection in Firestore

            let promise;

            clubCollection.get().then(allClubs => {

                allClubs.forEach(club => {
                    promise = new Promise((resolve, reject) => {
                        let club_name = club.data().name;
                        let eventCollection = clubCollection.doc(club.id).collection("events");

                        eventCollection.orderBy("lat").get()
                            .then(events => {
                                events.forEach(event => {
                                    pushToEventList(club.id, club_name, event);
                                })
                            })
                            .then(() => {
                                resolve();
                            })
                    }).catch(error => {
                        reject(error);
                    })
                })
                promise.then(() => {
                    count++;
                    // global variable count is only set to 2 once both official and unofficial clubs are iterated through, and then events are sorted and displayed. a bit hacky, but the best workaround we could find
                    if (count == 2) {
                        processMarkers(map);
                    }
                })
            })
        })
}

function pushToEventList(clubID, club_name, event) {
    // push to local eventList array to be processed by processMarkers()
    if (event.data().date.toDate() < new Date()) {
        // if before the current date, skip the current iteration of the loop
        return;
    }

    lat = event.data().lat;
    lng = event.data().lng;
    console.log(lat, lng);
    coordinates = [lng, lat];
    console.log(coordinates);
    // Coordinates
    event_title = event.data().event; // Event Name
    preview = event.data().description; // Text Preview

    let thisEvent = {
        club_name: club_name,
        coordinates: coordinates,
        event_title: event_title,
        preview: preview,
        url: `?docID=${clubID}&eventID=${event.id}`
    }

    eventList.push(thisEvent);
}

function processMarkers(map) {
    let previousCoordinates;
    let description = "";
    let eventCount = 0;

    // sort events so that events with the same coordinates are adjacent in the array
    eventList.sort((a, b) => {
        // if lng is the same, compare latitude
        if (a.coordinates[0] === b.coordinates[0]) {
            return a.coordinates[1] - b.coordinates[1];
        }
        
        // if lng is different, compare lng
        return a.coordinates[0] - b.coordinates[0];
    });

    console.log(eventList);

    for (const event of eventList) {
        // handling first event separately as well as accounting for the edge case where there is only one event
        if (eventCount == 0) {
            description = `<strong>${event.club_name}: ${event.event_title}</strong><p>${event.preview} <a href="/eachEvent.html${event.url}" target="_blank" title="Opens in a new window">» More Details</a></p>`;
            previousCoordinates = event.coordinates.slice(); // copy the array instead of creating an alias
            eventCount++; // increment event count

            if (eventList.length > 1) {
                continue;
            } else {
                pushToFeatures(description, previousCoordinates);
            }
        }

        // check if not the first event and if the event coordinates of this event + the previous event are the same
        if (eventCount != 0 && JSON.stringify(event.coordinates) === JSON.stringify(previousCoordinates)) {
            description += `<strong>${event.club_name}: ${event.event_title}</strong><p>${event.preview} <a href="/eachEvent.html${event.url}" target="_blank" title="Opens in a new window">» More Details</a></p>`;
            previousCoordinates = event.coordinates.slice();
            eventCount++;

            // continue to concatenate as long as there are events left to read
            if (eventCount < eventList.length) {
                continue;
            } else {
                pushToFeatures(description, previousCoordinates); // if this is the last event to process, display current marker            
            }
        } else {
            // if event coordinates are different, push the previous marker
            pushToFeatures(description, previousCoordinates);

            // start a new string description
            description = `<strong>${event.club_name}: ${event.event_title}</strong><p>${event.preview} <a href="/eachEvent.html${event.url}" target="_blank" title="Opens in a new window">» More Details</a></p>`;
            previousCoordinates = event.coordinates.slice();
            eventCount++;

            // if last event, display current marker
            if (eventCount == eventList.length) {
                pushToFeatures(description, previousCoordinates);
            }
        }
    }

    console.log(features);

    // once all markers are processsed, display the map
    displayMap(map, "events")
}

function pushToFeatures(description, coordinates) {
    // pushes map marker to the local features array prior to being displayed on the map
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

function displayMap(map, collection) {
    // Adds features (in our case, pins) to the map
    // "places" is the name of this array of features
    map.addSource(collection + '-places', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': features
        }
    });

    // Creates a layer above the map displaying the pins
    map.addLayer({
        'id': collection + '-places',
        'type': 'symbol',
        'source': collection + '-places',
        'layout': {
            'icon-image': 'clubs-eventpin', // Pin Icon
            'icon-size': 0.06, // Pin Size
            'icon-allow-overlap': true // Allows icons to overlap
        }
    });

    // When one of the "places" markers are clicked,
    // create a popup that shows information 
    // Everything related to a marker is save in features[] array
    map.on('click', collection + '-places', (e) => {
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
    map.on('mouseenter', collection + '-places', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Defaults cursor when not hovering over the places layer
    map.on('mouseleave', collection + '-places', () => {
        map.getCanvas().style.cursor = '';
    });
}

//-----------------------------------------------------
// Add pin for showing where the user is.
// This is a separate function so that we can use a different
// looking pin for the user
//------------------------------------------------------
function addUserPin(map) {
    map.loadImage(
        'https://cdn-icons-png.flaticon.com/512/61/61168.png',
        (error, image) => {
            if (error) throw error;

            // Add the image to the map style with width and height values
            map.addImage('userpin', image, {
                width: 10,
                height: 10
            });

            // Adds user's current location as a source to the map
            navigator.geolocation.getCurrentPosition(position => {
                const userLocation = [position.coords.longitude, position.coords.latitude];
                console.log(userLocation);
                if (userLocation) {
                    map.addSource('userLocation', {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': [{
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': userLocation
                                },
                                'properties': {
                                    'description': 'Your location'
                                }
                            }]
                        }
                    });

                    // Creates a layer above the map displaying the user's location
                    map.addLayer({
                        'id': 'userLocation',
                        'type': 'symbol',
                        'source': 'userLocation',
                        'layout': {
                            'icon-image': 'userpin', // Pin Icon
                            'icon-size': 0.05, // Pin Size
                            'icon-allow-overlap': true // Allows icons to overlap
                        }
                    });

                    // Map On Click function that creates a popup displaying the user's location
                    map.on('click', 'userLocation', (e) => {
                        // Copy coordinates array.
                        const coordinates = e.features[0].geometry.coordinates.slice();
                        const description = e.features[0].properties.description;

                        new mapboxgl.Popup()
                            .setLngLat(coordinates)
                            .setHTML(description)
                            .addTo(map);
                    });

                    // Change the cursor to a pointer when the mouse is over the userLocation layer.
                    map.on('mouseenter', 'userLocation', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });

                    // Defaults
                    // Defaults cursor when not hovering over the userLocation layer
                    map.on('mouseleave', 'userLocation', () => {
                        map.getCanvas().style.cursor = '';
                    });
                }
            });
        }
    )
}