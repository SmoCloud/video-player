let videoTitle = document.getElementById("searchButton").onclick = function() {
    videoTitle = document.getElementById("videoTitle").value;
    console.log(videoTitle);
    if(videoTitle)
        window.location.href = "player.html";
}

document.getElementById("fruitninja").onclick = function() {
    window.location.href = "player.html";
}

// document.getElementById("vp").setAttribute("max-width: ");

const player = document.getElementById("vp");
const login = document.getElementById("login-btn");
let username;
let password;

login.onclick = function() {
    username = document.getElementById("usr");
    if(username === "") {
        window.alert("Username field cannot be empty!");
    }
    password = document.getElementById("pwd");
    if(password === "") {
        window.alert("Password field cannot be empty!");
    }
}