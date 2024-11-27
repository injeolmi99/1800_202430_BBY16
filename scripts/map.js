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
        // addEventPins(map, "unofficialClubs");

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
            clubCollection.get().then(allClubs => {
                const features = [];

                allClubs.forEach(club => {
                    let eventCollection = clubCollection.doc(club.id).collection("events");

                    eventCollection.get()
                        .then(events => {
                            events.forEach(event => {
                                lat = event.data().lat;
                                lng = event.data().lng;
                                console.log(lat, lng);
                                coordinates = [lng, lat];
                                console.log(coordinates);
                                // Coordinates
                                event_title = event.data().event; // Event Name
                                preview = event.data().description; // Text Preview

                                // Pushes information into the features array
                                features.push({
                                    'type': 'Feature',
                                    'properties': {
                                        'description':
                                            `<strong>${event_title}</strong><p>${preview}</p> 
                                            <br> <a href="/eachEvent.html?docID=${club.id}&eventID=${event.id}" target="_blank" 
                                            title="Opens in a new window">Read more</a>`
                                    },
                                    'geometry': {
                                        'type': 'Point',
                                        'coordinates': coordinates
                                    }
                                });
                            });
                            console.log(features);
                        })
                })
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
                        'icon-image': collection + '-eventpin', // Pin Icon
                        'icon-size': 0.1, // Pin Size
                        'icon-allow-overlap': true // Allows icons to overlap
                    }
                });

                // When one of the "places" markers are clicked,
                // create a popup that shows information 
                // Everything related to a marker is save in features[] array
                map.on('click', 'places', (e) => {
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
                map.on('mouseenter', 'places', () => {
                    map.getCanvas().style.cursor = 'pointer';
                });

                // Defaults cursor when not hovering over the places layer
                map.on('mouseleave', 'places', () => {
                    map.getCanvas().style.cursor = '';
                });
            })
        })
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