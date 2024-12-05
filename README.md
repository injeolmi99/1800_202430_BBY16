# Project Title

## 1. Project Description
State your app in a nutshell, or one-sentence pitch. Give some elaboration on what the core features are.  
This browser based web application to ... 

## 2. Names of Contributors
List team members and/or short bio's here... 
* Mykyta Bozhanov!!!! too excited to write something!!!!!!!
* Alison Kim || I have the cutest dogs in the world!!
* Jonny Twist I like cheese and things similar
	
## 3. Technologies and Resources Used
List technologies (with version numbers), API's, icons, fonts, images, media or data sources, and other resources that were used.
* HTML, CSS, JavaScript
* Bootstrap 5.0 (Frontend library)
* Firebase 8.0 (BAAS - Backend as a Service)
* Flatpickr v4.6.13 - Calendar Source Code: https://codepen.io/alvarotrigo/pen/NWyNgoy
* Images from Adobe Stock images and Unsplash: https://stock.adobe.com/ca/photos, https://unsplash.com/

## 4. Complete setup/installion/usage
State what a user needs to do when they come to your project.  How do others start using your code or application?
Here are the steps ...
* Best to use this site https://bby-team16.web.app/ for using the app. The live serve will not work without the API keys so it is not recommended.
* Log in with any email, set a password, enter a name. (returning users should remember their email and password)
* From here you are free to do whatever you want but here are some suggestions:
*   Edit your profile to represent yourself
*   Join or create a club of interest
*   Create an event for your own club
*   Browse upcoming events on the calendar and map

## 5. Known Bugs and Limitations
Here are some known bugs:
* The database needs reworking as it is inefficient (not a bug just a little slow)

## 6. Features for Future
What we'd like to build in the future:
* Friending 
* Notifications for new events for clubs
* Club announcements
* Chat
* Rehaul the index page to be more informative and welcoming
* Weekly view for calendar
	
## 7. Contents of Folder
Content of the project folder:

```
 Top level of project folder: 
├── .gitignore               # Git ignore file
├── addEvent.html            # Form to add an event to a club
├── calendar.html            # The calendar page
├── clubsList.html           # Shows all the official and unofficial clubs based on which toggle is selected
├── createAClub.html         # Form to create a club. this is only accessible if the user has not yet made 2 clubs.
├── eachClub.html            # This is a dynamically generated page that gets filled with a single club's content based on which club is selected.
├── eachEvent.html           # This is a dynamically generated page that gets filled with a single event's content based on which event is selected.
├── editClub.html            # This is the form to edit club details like name, type, image, description
├── home.html                # The page that displays the users clubs and upcoming events
├── index.html               # landing HTML file, this is what users see when you come to url
├── login.html               # the page the index page takes you to so you can login or create a new account
├── map.html                 # The map to see the locations of events
├── membersList.html         # Displays all the members and their descriptions
├── postLoginSkeleton.html   # just a skeleton page and is not visible during regular paths using the app.
├── profile.html             # Diplays user info and allows editing of some fields
└── README.md

It has the following subfolders and files:
├── .git                     # Folder for git repo
├── images                   # Folder for images
    ├── clubImages           # Folder for club image options
        /AC01.jpg            # club images came from a bit of unsplash and a bit of adobe stock
        /CC01.jpg
        /default.jpg
        /GC01.jpg
        /MC01.jpg
        /MC02.jpg
        /SC01.jpg
        /SP1.jpg
        /SP2.jpg
    ├── icons                # Folder for user icon (profile picture) options
        /elmo.jpg            # We were planning to use this as a joke but never got around to it
        /pfp1.png            # all pfp#.png came from adobe stock images
        /pfp2.png
        /pfp3.png
        /pfp4.png
        /pfp5.png
        /pfp6.png
        /pfp7.png
        /pfp8.png
        /pfp9.png
        /pfp10.png
        /pfp11.png
        /pfp12.png
        /pfp13.png
        /pfp14.png
        /pfp15.png
        /pfp16.png
        /pfp17.png
        /pfp18.png
        /pfp19.png
        /pfp20.png
        /pfp21.png
        /pfp22.png
        /pfp23.png
        /pfp24.png
        /pfp25.png
        /pfp26.png
        /pfp27.png
        /pfp28.png
        /pfp29.png
        /pfp30.png
    /map-icon-white.png                # Bottom images from Icon8, Flaticon and adobe stock
    /mapPin.png 
    /white-account-icon.png 
    /white-calendar-icon.png 
    /white-people-icon.png 
├── scripts                  # Folder for scripts
    /addEvent.js             # 
    /authentication.js       # Used to authenticate users if they are first time or returning
    /calendar.js             # 
    /clubsList.js            # 
    /createAClub.js          # 
    /eachClub.js             # 
    /eachEvent.js            # 
    /editClub.js             # 
    /editEvent.js            # 
    /firebaseAPI_Team16.js   # Used to get and store data in firstore we will see if it is included in the submission.
    /home.js                 # 
    /map.js                  # 
    /memberList.js           # 
    /profile.js              # 
    /script.js               # Used on the index page to log users out
    /skeleton.js             # Inserts the top and bottom navbars
├── styles                   # Folder for styles
    /addEvent.css            # 
    /calendar.css            # 
    /clubsList.css           # 
    /createAclub.css         # 
    /eachClub.css            # 
    /eachEvent.css           # 
    /editClub.css            # 
    /generalStyle.css        # This inludes styles that run across most pages
    /home.css                # 
    /login.css               # 
    /memberList.css          # 
    /postLoginSkeleton.css   # 
    /profile.css             # 
    /style.css               # styling for index.html



```