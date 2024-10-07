let videoTitle = document.getElementById("searchButton").onclick = function(){
    videoTitle = document.getElementById("videoTitle").value;
    console.log(videoTitle);
    if(videoTitle)
        window.location.href = "player.html";
}

const player = document.getElementById("vp");