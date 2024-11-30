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

// create eventDates object
var eventDates = {};
var time = {};

// displays all events for ALL CLUBS on their respective date in the calendar object 
function displayEvents(collection) {
  // ensure objects are empty (for the filter to work properly without duplicating events)
  eventDates = {};
  time = {};
  let clubCollection = db.collection(collection)

  // create a promise array in order to ensure the calendar object is only initialized once all events are loaded in
  var promises = [];

  clubCollection.get() // returns object with all documents in collection
    .then(allClubs => {
      allClubs.forEach(club => {
        let eventCollection = clubCollection.doc(club.id).collection("events");

        // push all async calls into promise array
        promises.push(
          eventCollection.get()
            .then(clubEvents => {
              clubEvents.forEach(event => {
                // firestore timestamp object returns as seconds, so convert to JS Date object
                var eventTimestamp = event.data().date.toDate();
                // only extract the date
                var date = formatDate(eventTimestamp);
                // console.log(date);
                if (!eventDates[date]) {
                  eventDates[date] = [];
                }
                if (!time[date]) {
                  time[date] = [];
                }
                time[date].push(eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes());
                eventDates[date].push(club.data().name + ": " + event.data().event + "<br><span class='material-icons location'>location_on</span>" + event.data().location);
                // console.log(eventDates[date]);
              })
            }).catch(error => {
              console.error("Failed to fetch events for " + club.data.name().name);
            })
        )
      })

      // after all promises returned, initialize calendar object with events from firestore properly loaded in
      Promise.all(promises).then(() => {
        initializeCalendar();
        console.log("Calendar successfully loaded!");
      })
        .catch(error => {
          console.error("Failed to initialize calendar.");
        })
    });
}
// displayEvents("clubs");
// displayEvents("unofficialClubs");

// display specifically only the user's events
function displayUserEvents(collection) {
  eventDates = {};
  time = {};
  // create a promise array in order to ensure the calendar object is only initialized once all events are loaded in
  var promises = [];

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      let currentUser = db.collection("users").doc(user.uid);
      currentUser.get().then(userDoc => {
        let userClubs = userDoc.data().clubs;
        userClubs.forEach(club => { //iterate thru each club
          // NOTE TO SELF: here, because we are fetching club from the array inside of user, it is a String and not a reference. So we cannot call club.data()
          let clubRef = db.collection(collection).doc(club);
          let clubEvents = db.collection(collection).doc(club).collection("events");
          promises.push(
            clubEvents.get().then(events => {
              events.forEach(event => {
                // firestore timestamp object returns as seconds, so convert to JS Date object
                var eventTimestamp = event.data().date.toDate();
                // only extract the date
                var date = formatDate(eventTimestamp);
                // console.log(date);
                if (!eventDates[date]) {
                  eventDates[date] = [];
                }
                if (!time[date]) {
                  time[date] = [];
                }

                promises.push(
                  clubRef.get()
                    .then((club) => {
                      time[date].push(eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes());
                      eventDates[date].push(club.data().name + ": " + event.data().event + "<br><span class='material-icons location'>location_on</span>" + event.data().location);
                      // console.log(eventDates[date]);
                    })
                )
              })
            }).catch(error => {
              console.error("Failed to fetch club events");
            })
          )
        })

        // promise has to be INSIDE of the currentUser.get() callback or else it will load too fast. bc of the nature of our method of fetching club ID as a String from clubs array inside of user doc, we need to add in ANOTHER async get call to get the actual club document separately
        Promise.all(promises).then(() => {
          initializeCalendar();
          console.log("User events loaded");
        }).catch(error => {
          console.error("Failed to fetch user events and initialize calendar");
        })

      })
    } else {
      console.log("No user is logged in.");
    }
  })
}
displayUserEvents("clubs");
displayUserEvents("unofficialClubs");

function dropdownChoice() {
  if (this.value == "allEvents") {
    displayEvents("clubs");
    displayEvents("unofficialClubs");
  } else if (this.value == "yourEvents") {
    displayUserEvents("clubs");
    displayUserEvents("unofficialClubs");
  }
}
document.getElementById("filter").onchange = dropdownChoice;

// calendar base script source: https://codepen.io/alvarotrigo/pen/NWyNgoy
function initializeCalendar() {
  // set maxDates
  var maxDate = {
    1: new Date(new Date().setMonth(new Date().getMonth() + 11)),
    2: new Date(new Date().setMonth(new Date().getMonth() + 10)),
    3: new Date(new Date().setMonth(new Date().getMonth() + 9))
  }

  flatpickr = $('#calendar .placeholder').flatpickr({
    // calendar always visible
    inline: true,
    minDate: 'today',
    maxDate: maxDate[3]
    ,
    showMonths: 1,
    // enable only dates with events to be clickable
    enable: Object.keys(eventDates),
    disableMobile: "true",
    // flatpickr event hook for when user selects a date, passes in selected date(s), date as a string, and the flatpickr instance
    onChange: function (date, str, inst) {
      var contents = '';
      if (date.length) {
        for (i = 0; i < eventDates[str].length; i++) {
          // l - day of week
          // F - month
          // J - day
          contents += '<div class="event"><div class="date">' + flatpickr.formatDate(date[0], 'l F J') + " @ " + time[str][i] + '</div><div class="location">' + eventDates[str][i] + '</div></div>';
        }
      }
      $('.calendar-events').html(contents)
    },
    // can customize abbreviations for each date
    locale: {
      weekdays: {
        shorthand: ["S", "M", "T", "W", "T", "F", "S"],
        longhand: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ]
      }
    }
  })

  // logic for clearing the selection if clicking outside the calendar widget
  document.addEventListener("click", function (e) {
    var calendar = document.querySelector(".cal-modal");
    if (!calendar.contains(e.target)) {
      flatpickr.clear();
    }
  });

  eventCalendarResize($(window));

  // event listens for when window is resized and adjusts the calendar's layout; passes in the window object and eventCalendarResizes as a callback function
  $(window).on('resize', function () {
    eventCalendarResize($(this))
  })

  // resizes the calendar based on window size, but we have set it to 1 for all screen sizes
  function eventCalendarResize($el) {
    var width = $el.width()
    if (flatpickr.selectedDates.length) {
      flatpickr.clear()
    }

    // display one month regardless of screen size
    if (flatpickr.showMonths !== 1) {
      flatpickr.set('showMonths', 1)
      flatpickr.set('maxDate', maxDate[1])
      $('.flatpickr-calendar').css('width', '')

      // keeping this in case we decide to display more months at a time
      // if(width >= 992 && flatpickr.config.showMonths !== 3) {
      //   flatpickr.set('showMonths', 3)
      //   flatpickr.set('maxDate', maxDate[3])
      // }
      // if(width < 992 && width >= 768 && flatpickr.config.showMonths !== 2) {
      //   flatpickr.set('showMonths', 2)
      //   flatpickr.set('maxDate', maxDate[2])
      // }
      // if(width < 768 && flatpickr.config.showMonths !== 1) {
      //   flatpickr.set('showMonths', 1)
      //   flatpickr.set('maxDate', maxDate[1])
      //   $('.flatpickr-calendar').css('width', '')
    }
  }
}

// format date to be compatible with flatpickr
function formatDate(date) {
  let d = date.getDate();
  let m = date.getMonth() + 1; //Month from 0 to 11
  let y = date.getFullYear();
  return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}

// this is broken its not the same width :(
function matchCalendarWidth() {
  $(".calendar-events").css({
    'width': ($(".cal-modal").outerWidth() + 'px')
  });
}
matchCalendarWidth();