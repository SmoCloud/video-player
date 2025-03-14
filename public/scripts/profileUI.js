document.getElementById("password-edit-btn").addEventListener("click", () => {
    document.getElementById("passwordModal").style.display = "block";
});

document.getElementById("password-update-btn").addEventListener("click", () => {
    document.getElementById("passwordModal").style.display = "hidden";
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    const data = { "logout": true };
    await fetch('http://localhost:8080/profile.html?', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        sessionStorage.clear();
        localStorage.clear();
        response;
    })
    .then(data => console.log('Success:', data))
    .catch(error => console.log('Error:', error));
    alert(`Logged out successfully!`);
});

document.querySelectorAll('.can-edit').forEach(editField => {
    console.log(editField.getAttribute("class"));
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
            inputField.toggleAttribute("readonly")
        }

    });
    console.log(editField.getAttribute("class"));
});

document.querySelectorAll('.can-save').forEach(saveField => {
    console.log(saveField.getAttribute("class"));
    saveField.addEventListener("click", async () => {

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