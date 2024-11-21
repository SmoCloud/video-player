let username;   // stores the entered username
let password;   // stores the entered password


// get element for login button
const loginBtn = document.getElementById("login-btn");

// function is called when login button is clicked
loginBtn.onclick = function() {
    username = document.getElementById("usr").value;    // get entered username
    console.log(username);  // log username to console for testing
    password = document.getElementById("pwd").value;    // get entered password
    console.log(password);  // log password to console for testing

    // while username field is empty
    if(username === ""|| username === null) {
        window.alert("Username field cannot be empty!");    // alert that username cannot be empty
    }

    // while password field is empty
    else if(password === "" || password === null) {
        window.alert("Password field cannot be empty!");    // alert that password cannot be empty
    }

    // if username and password both not empty
    // else {
    //     window.alert("Username and password fields were filled.");  // alert for testing purposes
    //     window.location.href = "index.html";    // change window location to home page
    // }
}