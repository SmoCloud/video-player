document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form from refreshing the page

    let username = document.getElementById("usr").value.trim(); // Get entered username
    let password = document.getElementById("pwd").value.trim(); // Get entered password

    console.log("Username:", username);
    console.log("Password:", password);

    // Validate inputs
    if (username === "") {
        alert("Username field cannot be empty!");
        return;
    }

    if (password === "") {
        alert("Password field cannot be empty!");
        return;
    }

    // Simulated login validation (Replace this with actual authentication logic)
    if (username === "admin@admin" && password === "admin") { 
        alert("Login successful!");
        window.location.href = "index.html"; // Redirect to index.html
    } else {
        alert("Invalid username or password. Please try again.");
    }
});
