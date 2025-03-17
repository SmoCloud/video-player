const form = document.querySelector("#upload-form");

form.addEventListener("submit", event => {
    event.preventDefault();
    const formData = new FormData(form);

    fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => console.log(error));
});