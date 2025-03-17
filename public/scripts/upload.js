const form = document.querySelector("#upload-form");

async function sendData() {
    const formData = new FormData(form);

    await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success: ', data);
    })
    .catch(error => console.log('Error: ', error));
}

form.addEventListener("submit", event => {
    event.preventDefault();
    console.log(form);
    sendData();
});