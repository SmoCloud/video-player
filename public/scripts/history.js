document.addEventListener("DOMContentLoaded", () => {
    fetch(`http://localhost:8080/api/history/${JSON.parse(sessionStorage.user).user_id}`)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        
        const container = document.getElementById("watched-videos");

                data.results.forEach(video => {
                    container.innerHTML += `
    <tr>
        <td>
            <div id="videoURL" value="${video.video_id}">${video.title}</div>
            <br>
            <button id="videoID" name="video" type="submit" value="${video.video_id}"><img id="${video.url}" class="thumbnails" src="thumbnails/${video.thumbnail}" title="${video.title}" width="480" height="320"></button>
        </td>
    </tr>
    <hr>`;
                });
    })
    .catch(error => console.log(error))
});