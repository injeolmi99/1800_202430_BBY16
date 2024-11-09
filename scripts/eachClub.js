function displayClubInfo() {
    let params = new URL( window.location.href ); //get URL of search bar
    let ID = params.searchParams.get( "docID" ); //get value for key "id"
    console.log( ID );

    db.collection( "clubs" )
        .doc( ID )
        .get()
        .then( doc => {
            thisClub = doc.data();
            clubName = thisClub.name;
            clubDescription = thisClub.description;
            clubMembers = thisClub.members;

            document.getElementById("clubName").innerHTML = clubName;
            document.getElementById( "clubDescription" ).innerHTML = clubDescription;
            
            // let imgEvent = document.querySelector( ".club-img" );
            // imgEvent.src = "../images/" + [would need some kind of identifier] + ".jpg";
        });
}
displayClubInfo();

// function saveClubDocumentIDAndRedirect(){
//     let params = new URL(window.location.href) //get the url from the search bar
//     let ID = params.searchParams.get("docID");
//     localStorage.setItem("clubID", ID);
// }