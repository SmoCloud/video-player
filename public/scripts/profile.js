function showPasswordModal() {
    document.getElementById("passwordModal").style.display = "block";
}

function closePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
}

function updatePassword() {
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
    alert("New password and confirm password do not match.");
    return;
    }

    console.log("Old Password:", oldPassword);
    console.log("New Password:", newPassword);
    alert("Password updated successfully!");

    closePasswordModal();
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
        editButton.setAttribute('name', 'save');
    } else {
        saveChanges(field);
        editButton.setAttribute('name', 'edit');
        editButton.textContent = "Edit";
    }
}

function saveChanges(field) {
    const inputField = document.getElementById(`${field}-input`);
    const newValue = inputField.value.trim();

    if (newValue === "") {
        alert("Field cannot be empty.");
        return;
    }

    console.log(`${field} updated:`, newValue);
    alert(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
    inputField.setAttribute("readonly", "true");
}

document.getElementById("username-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        saveChanges("username");
        document.getElementById("username-edit-btn").textContent = "Edit";
    }
});

document.getElementById("bio-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        saveChanges("bio");
        document.getElementById("bio-edit-btn").textContent = "Edit";
    }
});

document.addEventListener("click", function (event) {
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