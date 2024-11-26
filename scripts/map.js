function showMap() {
    //------------------------------------------
    // Defines and initiates basic mapbox data
    //------------------------------------------
    // TO MAKE THE MAP APPEAR YOU MUST
    // ADD YOUR ACCESS TOKEN FROM
    // https://account.mapbox.com
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5qZW9sbWk5OSIsImEiOiJjbTN5cjBrNGoxdjlqMmlvYjBxYmZ2ajR2In0.QolTQid4w4FiVh5_IfKRZw';
    const map = new mapboxgl.Map({
        container: 'map', // Container ID
        style: 'mapbox://styles/mapbox/streets-v11', // Styling URL
        center: [-122.964274, 49.236082], // Starting position
        zoom: 8 // Starting zoom
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
        addHikePins(map);

        //--------------------------------------
        // Add interactive pin for the user's location
        //--------------------------------------
        addUserPin(map);
        
    });
}
showMap();   // Call it! 

function addHikePins(map){
    map.loadImage(
        'https://cdn.iconscout.com/icon/free/png-256/pin-locate-marker-location-navigation-16-28668.png',
        (error, image) => {
            if (error) throw error;

            // Add the image to the map style.
            map.addImage('eventpin', image); // Pin Icon

            // READING information from "events" collection in Firestore
            db.collection('hikes').get().then(allEvents => {
                const features = []; // Defines an empty array for information to be added to

                allEvents.forEach(doc => {
                    lat = doc.data().lat;
                    lng = doc.data().lng;
                    console.log(lat, lng);
                    coordinates = [lng, lat];
                    console.log(coordinates);
                    // Coordinates
                    event_name = doc.data().name; // Event Name
                    preview = doc.data().details; // Text Preview
                    // img = doc.data().posterurl; // Image
                    // url = doc.data().link; // URL

                    // Pushes information into the features array
                    features.push({
                        'type': 'Feature',
                        'properties': {
                            'description': 
                            `<strong>${event_name}</strong><p>${preview}</p> 
                            <br> <a href="/hike.html?id=${doc.id}" target="_blank" 
                            title="Opens in a new window">Read more</a>`
                        },
                        'geometry': {
                            'type': 'Point',
                            'coordinates': coordinates
                        }
                    });
                });

                // Adds features (in our case, pins) to the map
                // "places" is the name of this array of features
                map.addSource('places', {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': features
                    }
                });

                // Creates a layer above the map displaying the pins
                map.addLayer({
                    'id': 'places',
                    'type': 'symbol',
                    'source': 'places',
                    'layout': {
                        'icon-image': 'eventpin', // Pin Icon
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
            });
        }
    );
} 