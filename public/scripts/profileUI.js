function showPasswordModal() {
    document.getElementById("passwordModal").style.display = "block";
}

function closePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
    if (typeof(document.getElementById('badPass')) !== "undefined" && document.getElementById('badPass').value !== "false") {
        console.log(document.getElementById('badPass').value);
        alert("Old password and existing passord do not match.");
        return;
    }
}

async function updatePassword(oldPassword) {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
    }

    var data = {"oldPassword": oldPassword, "newPassword": newPassword, "save": true};
    // console.log(data);
    await fetch('http://localhost:8080/profile.html?', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response)
    .then(data => console.log('Success:', data))
    .catch(error => console.log('Error:', error));

    this.closePasswordModal();
}

function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "login.html";
}

function toggleEditable(field) {
    const inputField = document.getElementById(`${field}-input`);
    const editButton = document.getElementById(`${field}-edit-btn`);

    if (inputField.hasAttribute("readonly")) {
        inputField.removeAttribute("readonly");
        inputField.focus();
        editButton.textContent = "Save Changes";
        // editButton.setAttribute('name', `${field}-save`);
    } else {
        saveChanges(field);
        // window.location.href = "login.html";
        // editButton.setAttribute('name', `${field}-edit`);
        editButton.textContent = "Edit";
    }
}

async function saveChanges(field) {
    const inputField = document.getElementById(`${field}-input`);
    const newValue = inputField.value.trim();

    if (newValue === "") {
        alert("Field cannot be empty.");
        return;
    }

    var data = {};
    if (field === "username") {
        data = { "username": newValue, "save": true };
    }
    else if (field === "bio") {
        data = { "bio": newValue, "save": true };
    }
    console.log(data);
    await fetch('http://localhost:8080/profile.html?', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response)
    .then(data => console.log('Success:', data))
    .catch(error => console.log('Error:', error));
    alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
    inputField.setAttribute("readonly", "true");
}

function saveEvent(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        saveChanges("username");
        document.getElementById("username-edit-btn").textContent = "Edit";
    }
}

function updateButton(event) {
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
}