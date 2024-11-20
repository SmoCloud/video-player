let email;      // stores the entered email
let username;   // stores the entered username
let password;   // stores the entered password
let confirmPassword; //stores the entered confirmation password


// get element for login button
const registerBtn = document.getElementById("register-btn");

// function is called when register button is clicked
registerBtn.onclick = function(event) {
    
    //to test without submitting the form, uncomment
    //event.preventDefault();

    const email = document.getElementById("email").value;   
    console.log(email);
            
    const username = document.getElementById("username").value;    
    console.log(username);  
            
    const password = document.getElementById("password").value;    
    console.log(password);  
            
    const confirmPassword = document.getElementById("confirmPassword").value; 
    console.log(confirmPassword);    

    if (password != confirmPassword) {
        window.alert("Passwords must match");
        event.preventDefault();
    }
}