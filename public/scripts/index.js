document.getElementById('search-btn').addEventListener('click', () => {
    fetch('http://localhost:8080/index.html')
        .then(response => response.json())
        .then(data => {
            document.getElementById('results-output').textContent = data;

        })
        .catch(error => console.error(`Error fetching data: ${error}`));
});