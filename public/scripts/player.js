document.addEventListener("DOMContentLoaded", () => {
    const videoID = window.location.href.split('?')[1].split('=')[1];
    console.log(videoID);

    fetch(`http://localhost:8080/api/player/${videoID}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
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
});

document.getElementById("like-btn").addEventListener("click", () => {

});