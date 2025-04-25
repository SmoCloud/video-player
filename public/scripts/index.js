document.addEventListener("DOMContentLoaded", () => {
    fetch('http://localhost:8080/api')
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data.results, data.results.length);
        const recommendeds = document.getElementById('recommended');
        recommendeds.innerHTML += '<hr>'
        for (var i = 0; i < data.results.length; i++) {
            recommendeds.innerHTML += 
    `<tr>
        <td>
            <div id="videoURL" value="${data.results[i].video_id}">${data.results[i].title}</div>
            <br>
            <button id="videoID" name="video" type="submit" value="${data.results[i].video_id}"><img id="${data.results[i].url}" class="thumbnails" src="thumbnails/${data.results[i].thumbnail}" title="${data.results[i].title}" width="480" height="320"></button>
        </td>
    </tr>
    <hr>`;
        }
        document.getElementById("username").textContent = JSON.parse(sessionStorage.user).username !== "undefined" ? JSON.parse(sessionStorage.user).username : "";
    })
    .catch(error => console.log('Error:', error));

    document.getElementById("searchbtn").addEventListener("click", () => {
        // fetch request to search api using the content of the search input element goes here
    });

    if (typeof(sessionStorage.user) !== "undefined") {
        document.getElementById("liked-videos").style.display = "flex";
        document.getElementById("recently-watched").style.display = "flex";
    }
});