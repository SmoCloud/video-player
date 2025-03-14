document.querySelectorAll("#videoID").forEach(playable => {
    console.log(playable.value);
    playable.addEventListener("click", async () => {
        const url = document.getElementById("videoURL").value;
        console.log(url);
        data = {
            "search": playable.value,
            "videoID": url,
        };
        await fetch(`http://localhost:8080/search=${playable.value}&vID=${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
           response.headers;
        });
        // .then(user => console.log('Success:', user))
        // .catch(error => console.log('Error:', error));
        // alert(`Logged out successfully!`);
        console.log(playable.value);
    });
});