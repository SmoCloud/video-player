const form = document.querySelector("#upload-form");

function sendData() {
    const formData = new FormData(form);

    fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success: ', data);
        if (data.uploaded) {
            alert("Video uploaded.");
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