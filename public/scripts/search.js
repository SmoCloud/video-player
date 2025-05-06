document.addEventListener("DOMContentLoaded", () => {
    const queryParams = new URLSearchParams(window.location.search);
    const searchTerm = queryParams.get("search");
    console.log("Search term from URL:", searchTerm);

    if (searchTerm) {
        fetch(`http://localhost:8080/api/search/${searchTerm}`)
            .then(response => response.json())
            .then(data => {
                console.log("Search results:", data);
                // Clear existing results and display new ones
                const container = document.getElementById("videos-container");

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
            .catch(error => console.error("Error loading search results:", error));
    }
});