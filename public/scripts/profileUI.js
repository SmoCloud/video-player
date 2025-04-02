document.addEventListener("DOMContentLoaded", () => {
    // console.log(sessionStorage.user);
    document.getElementById("username-input").value = JSON.parse(sessionStorage.user).username;
    document.getElementById("password-input").value = JSON.parse(sessionStorage.user).password;
    document.getElementById("bio-input").value = JSON.parse(sessionStorage.user).bio;
    document.getElementById("dob").value = JSON.parse(sessionStorage.user).DoB;
});

document.getElementById("password-edit-btn").addEventListener("click", () => {
    document.getElementById("passwordModal").style.display = "block";
});

document.getElementById("password-update-btn").addEventListener("click", () => {
    document.getElementById("passwordModal").style.display = "hidden";
});

document.getElementById("logout-btn").addEventListener("click", () => {
    const data = { 
        "loggedIn": (typeof(sessionStorage) !== "undefined") ? true : false,
        "logout": true
    };
    fetch('http://localhost:8080/api/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        sessionStorage.clear();
        localStorage.clear();
        console.log('Success:', data);
        window.location.href = 'index.html';
    })
    .catch(error => console.log('Error:', error));
    alert(`Logged out successfully!`);
});

document.querySelectorAll('.can-edit').forEach(editField => {
    console.log("Name of editfield: ", editField.value);
    editField.addEventListener("click", () => {
        const inputField = document.getElementById(`${editField.value}-input`);
        const editButton = document.getElementById(`${editField.value}-edit-btn`);
        const saveButton = document.getElementById(`${editField.value}-save-btn`);
    
        if (inputField.hasAttribute("readonly")) {
            inputField.toggleAttribute("readonly");
            inputField.focus();
            editButton.toggleAttribute("hidden");
            saveButton.toggleAttribute("hidden");      
        } else {
            inputField.toggleAttribute("readonly");
        }
        
    });
    console.log(editField.getAttribute("class"));
});

document.querySelectorAll('.can-save').forEach(saveField => {
    console.log(saveField.getAttribute("class"));
    saveField.addEventListener("click", () => {
        console.log("Attempting to save data...");
        const inputField = document.getElementById(`${saveField.value}-input`);
        const editButton = document.getElementById(`${saveField.value}-edit-btn`);
        const saveButton = document.getElementById(`${saveField.value}-save-btn`);
    
        if (!inputField.hasAttribute("readonly")) {
            inputField.toggleAttribute("readonly");
            inputField.focus();
            editButton.toggleAttribute("hidden");
            saveButton.toggleAttribute("hidden");      
        } else {
            inputField.toggleAttribute("readonly");
        }
        console.log(inputField.value);
        const data = { 
            "loggedIn": (typeof(sessionStorage) !== "undefined") ? true : false,
            "save": true,
        };
        saveField.value === "username" ? data.username = inputField.value : data.bio = inputField.value;
        console.log(data);
        fetch('http://localhost:8080/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            if (typeof(data.username) !== "undefined" && data.user) {
                sessionStorage.user = data.user;
            }
        })
        .catch(error => console.log('Error:', error));
    });
});

document.addEventListener("click", (event) => {
    const usernameInput = document.getElementById("username-input");
    const bioInput = document.getElementById("bio-input");

    if (!usernameInput.contains(event.target) && !document.getElementById("username-edit-btn").contains(event.target)) {
        usernameInput.setAttribute("readonly", "true");
        document.getElementById("username-edit-btn").textContent = "Edit";
    }

    if (!bioInput.contains(event.target) && !document.getElementById("bio-edit-btn").contains(event.target)) {
        bioInput.setAttribute("readonly", "true");
        document.getElementById("bio-edit-btn").textContent = "Edit";
    }
});
