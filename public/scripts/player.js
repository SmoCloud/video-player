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
        console.log(JSON.parse(data.comments));
        JSON.parse(data.comments).forEach(aComment => {
            document.getElementById("comments-container").innerHTML += `<hr><p>${aComment.username}</p><pre>        ${aComment.comment}</pre>`;
        });

        // TODO: Future additions for like counter and views counter, add front-end elements
        // document.getElementById("like-counter").textContent = data.vData.likes;
        // document.getElementById("view-counter").textContent = data.vData.views;

        var player = videojs(document.getElementById("my-video"), {}, () => {
            player.src({
                src: `videos/${data.vData.url}`,
                type: data.vData.v_mimetype
            });
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
            
            // TODO:
            // Update like button to reflect that it has been clicked
            // Update like counter
            // document.getElementById("like-counter").textCounter = data.vData.likes;
        })
        .catch(error => console.log('Error:', error));
    });

    document.getElementById("dislike-btn").addEventListener("click", () => {
        const dataBody = {
            "disliked": document.getElementById("dislike-btn").value
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
            console.log(data, "Video disliked");

            // TODO:
            // Update dislike button to reflect that it has been clicked
            // Update dislike counter
            // document.getElementById("like-counter").textCounter = data.vData.likes;
        })
        .catch(error => console.log('Error:', error));
    });

    document.getElementById('searchbtn').addEventListener('click', () => {
        const searchTerm = document.getElementById('search').value.trim();
        if (searchTerm) {
            window.location.href = `/index.html?search=${encodeURIComponent(searchTerm)}`;
        }
    });    

    document.getElementById("comment-submit-btn").addEventListener("click", () => {
        const dataBody = {
            "commented": document.getElementById("new-comment").value
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
            console.log(data, "Comment posted.");
            const commentInput = document.createElement("textarea");
            commentInput.id = 'new-comment';
            commentInput.setAttribute('class', 'comment-input');
            commentInput.placeholder = 'Write a comment...';
            const commentArea = document.getElementById("comment-area");
            commentArea.replaceChild(commentInput, commentArea.children[1]);
            document.getElementById("comments-container").innerHTML = '';
            data.comments.forEach(aComment => {
                document.getElementById("comments-container").innerHTML += `<hr><p>${aComment.username}</p><pre>        ${aComment.comment}</pre>`;
            });
        })
        .catch(error => console.log(error));
    });
});