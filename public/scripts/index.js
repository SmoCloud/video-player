const thumbs = JSON.parse(document.querySelector('#json-data').innerHTML);
const thumbnails = document.querySelectorAll('img.thumbnails');
console.log(thumbs);
console.log(thumbnails);
for (const key in thumbs) {
    console.log(thumbs[key]);
    thumbnails[key].addEventListener('click', async () => {
        await fetch("http://localhost:8080/player.html", 
        {
            method: "GET",
            // body: JSON.stringify(thumbs[key]),
            headers: {
                "Content-type": "text/html; charset=UTF-8",
                "origin": "http://localhost:8080/index.html"
            }
        })
        .then((response) => response)
        .then((json) => console.log(json));
        // window.location.href="/player.html";
    });
};