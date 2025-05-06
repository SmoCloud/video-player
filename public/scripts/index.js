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
});

document.getElementById("searchbtn").addEventListener("click", () => {
    const query = document.getElementById("search").value.trim();
    if (!query) return;

    fetch(`http://localhost:8080/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            console.log('Search Results:', data.results);
            const recommendeds = document.getElementById('recommended');
            recommendeds.innerHTML = '<hr>'; // clear current videos

            for (let i = 0; i < data.results.length; i++) {
                recommendeds.innerHTML += 
    `<tr>
        <td>
            <div id="videoURL" value="${data.results[i].video_id}">${data.results[i].title}</div>
            <br>
            <button id="videoID" name="video" type="submit" value="${data.results[i].video_id}">
                <img id="${data.results[i].url}" class="thumbnails" src="thumbnails/${data.results[i].thumbnail}" title="${data.results[i].title}" width="480" height="320">
            </button>
        </td>
    </tr>
    <hr>`;
            }
        })
        .catch(error => console.log('Search Error:', error));
});

document.addEventListener("DOMContentLoaded", () => {
    const queryParams = new URLSearchParams(window.location.search);
    const searchTerm = queryParams.get("search");

    if (searchTerm) {
        fetch(`http://localhost:8080/api/search/${encodeURIComponent(searchTerm)}`)
            .then(response => response.json())
            .then(data => {
                console.log("Search results:", data);
                // Clear existing results and display new ones
                const container = document.getElementById("videos-container");
                container.innerHTML = ""; // clear existing content

                data.forEach(video => {
                    const div = document.createElement("div");
                    div.innerHTML = `
                        <h3>${video.title}</h3>
                        <video width="320" height="240" controls>
                            <source src="videos/${video.url}" type="${video.v_mimetype}">
                            Your browser does not support the video tag.
                        </video>
                    `;
                    container.appendChild(div);
                });
            })
            .catch(error => console.error("Error loading search results:", error));
    }
});
    
    