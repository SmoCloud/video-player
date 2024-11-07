let videoTitle; // stores video title

// get search button element from player
const search = document.getElementById("searchButton");

// function is called when search button is clicked
search.onclick = function() {

    // gets title of video entered in search bar
    videoTitle = document.getElementById("videoTitle").value;
    console.log(videoTitle);    // log to console for testing purposes

    // only change to player window if there is something in the search bar
    if(videoTitle)
        window.location.href = "player.html";
}