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

// document.querySelectorAll("#videoID").forEach(playable => {
//     console.log(playable.value);
//     playable.addEventListener("click", () => {
//         const url = document.getElementById("videoURL").value;
//         console.log(url);
//         data = {
//             "search": playable.value,
//             "videoID": url,
//         };
//         fetch(`http://localhost:8080/api/${playable.value}`, {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//         })
//         .then(response => response.json())
//         .then(data => console.log('Success:', data.user))
//         .catch(error => console.log('Error:', error));
//         // alert(`Logged out successfully!`);
//         console.log(playable.value);
//     });
// });