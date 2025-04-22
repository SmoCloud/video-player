const form = document.querySelector("#create_course");

function sendData() {
    const formData = new FormData(form);

    fetch('http://localhost:8080/api/create_course', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success: ', data);
        if (data.uploaded) {
            alert("Course created.");
        }
        else {
            alert("Video upload failed. Are you logged in?");
        }
    })
    .catch(error => console.log('Error: ', error));
}

form.addEventListener("submit", event => {
    event.preventDefault();
    // console.log(form);
    sendData();
});