document.addEventListener("DOMContentLoaded", () => {
    const videoID = window.location.href.split('?')[1].split('=')[1];
    console.log(videoID);

    if (typeof(sessionStorage.user) !== "undefined" && JSON.parse(sessionStorage.user).username)
        document.getElementById("username").textContent = JSON.parse(sessionStorage.user).username;

    fetch(`http://localhost:8080/api/player/${videoID}`)
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data.vData);
        document.getElementById("z-source").src = `videos/${data.vData.url}`;
        document.getElementById("z-source").type = data.vData.v_mimetype;
        document.getElementById("video-title").textContent = data.vData.title;
        var player = videojs(document.getElementById("my-video"), {}, () => {
            player.src({
                src: `videos/${data.vData.url}`,
                type: data.vData.v_mimetype
            })
        });
        player.load();
    })
    .catch(error => console.log('Error:', error));

    document.getElementById("like-btn").addEventListener("click", () => {
        const dataBody = {
            "liked": document.getElementById("like-btn").value
        };
        fetch(`http://localhost:8080/api/player`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataBody)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data, "Video liked.");
            // Update like button to reflect that it has been clicked
        })
        .catch(error => console.log('Error:', error));
    });
});