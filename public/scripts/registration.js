document.addEventListener("DOMContentLoaded", () => {
    let email;      // stores the entered email
    let username;   // stores the entered username
    let password;   // stores the entered password
    let confirmPassword; //stores the entered confirmation password
    let DoB;    // stores the entered date of birth for account user


    // get element for login button
    document.getElementById("register-btn").addEventListener("click", () => {
        
        // to test without submitting the form, uncomment
        // event.preventDefault();

        email = document.getElementById("email").value;   
        console.log(email);
                
        username = document.getElementById("username").value;    
        console.log(username);  
                
        password = document.getElementById("password").value;    
        console.log(password);  
                
        confirmPassword = document.getElementById("confirmPassword").value; 
        console.log(confirmPassword);    

        DoB = document.getElementById("dob").value;

        if (password !== confirmPassword) {
            window.alert("Passwords must match");
            // event.preventDefault();
        }
        else {
            const bodyData = {
                "email": email,
                "username": username,
                "password": password,
                "dob": DoB
            }
            fetch('http://localhost:8080/api/register', {
                method: "POST", 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyData)
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.user);
            })
            .catch(error => console.log(error))
        }
    });
});