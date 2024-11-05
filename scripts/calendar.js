// generate events
var eventDates = {}
// let day1 = formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1)))
// eventDates[day1] = [
//   'Event 1, Location',
//   'Event 2, Location 2'
// ]
// let day2 = formatDate(new Date(new Date().setDate(new Date().getDate() + 40)))
// eventDates[day2] = [
//   'Event 2, Location 3',
// ]

const clubCollection = db.collection("clubs")
var time = {};

function displayEvents(collection) {
  const promises = [];

  clubCollection.get()
    .then(allClubs => {
      allClubs.forEach(club => {
        const eventCollection = club.ref.collection("events");

        promises.push(
          eventCollection.get()
            .then(clubEvents => {
              clubEvents.forEach(event => {
                var eventTimestamp = event.data().date.toDate()
                var date = formatDate(eventTimestamp);
                console.log(eventTimestamp);
                console.log(date);
                if (!eventDates[date]) {
                  eventDates[date] = [];
                }
                time[date] = eventTimestamp.getHours() + ":" + (eventTimestamp.getMinutes() < 10 ? "0" : "") + eventTimestamp.getMinutes();
                eventDates[date].push(club.data().name + ": " + event.data().event + " || " + event.data().location);
                console.log(eventDates[date]);
              })
            })
        )
      })
      Promise.all(promises).then(() => {
        initializeCalendar();
      })
    });
}
displayEvents("clubs");

function initializeCalendar() {
  // set maxDates
  var maxDate = {
    1: new Date(new Date().setMonth(new Date().getMonth() + 11)),
    2: new Date(new Date().setMonth(new Date().getMonth() + 10)),
    3: new Date(new Date().setMonth(new Date().getMonth() + 9))
  }

  var flatpickr = $('#calendar .placeholder').flatpickr({
    inline: true,
    minDate: 'today',
    maxDate: maxDate[3]
    ,
    showMonths: 1,
    enable: Object.keys(eventDates),
    disableMobile: "true",
    onChange: function (date, str, inst) {
      var contents = '';
      if (date.length) {
        for (i = 0; i < eventDates[str].length; i++) {
          contents += '<div class="event"><div class="date">' + flatpickr.formatDate(date[0], 'l J F') + " @ " + time[str] + '</div><div class="location">' + eventDates[str][i] + '</div></div>';
        }
      }
      $('#calendar .calendar-events').html(contents)
    },
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
    var calendar = document.getElementById("calendar");
    if (!calendar.contains(e.target)) {
      flatpickr.clear();
      document.querySelector(".calendar-events").innerHTML = "";
    }
  });

  eventCalendarResize($(window));
  $(window).on('resize', function () {
    eventCalendarResize($(this))
  })

  function eventCalendarResize($el) {
    var width = $el.width()
    if (flatpickr.selectedDates.length) {
      flatpickr.clear()
    }

    // display one month regardless of screen size
    if (flatpickr.config.showMonths !== 1) {
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

function formatDate(date) {
  let d = date.getDate();
  let m = date.getMonth() + 1; //Month from 0 to 11
  let y = date.getFullYear();
  return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
}
