if (typeof(sessionStorage.user) !== "undefined") {
    window.location.href = "profile.html";
}
let username;   // stores the entered username
let password;   // stores the entered password

// get element for login button
const loginBtn = document.getElementById("login-btn");

// function is called when login button is clicked
loginBtn.onclick = () => {
    username = document.getElementById("usr").value;    // get entered username
    // console.log(username);  // log username to console for testing
    password = document.getElementById("pwd").value;    // get entered password
    // console.log(password);  // log password to console for testing

    // while username field is empty
    if(username === "" || username === null) {
        window.alert("Username field cannot be empty!");    // alert that username cannot be empty
    }

    // while password field is empty
    else if(password === "" || password === null) {
        window.alert("Password field cannot be empty!");    // alert that password cannot be empty
    }

    const dataBody = {
        "name": username,
        "pass": password
    };

    fetch(`http://localhost:8080/api/login`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataBody)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.user);
        if (data.usrMatch === true && data.pwdMatch === true) {
            alert(`Login for ${username} successful!`);
            sessionStorage.user = JSON.stringify(data.user);
            // console.log(JSON.parse(sessionStorage.user).username);
            window.location.href = 'index.html';
        }
        else if (data.usrMatch !== true || data.pwdMatch !== true) {
            alert(`Username or password is incorrect.`);
        }
    })
    .catch(error => console.log(error));
}