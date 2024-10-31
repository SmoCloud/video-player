<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="styles.css">
        <title>Login</title>
    </head>
    <body>
        <section class="border">
            <div class="navbar">
                <img src="imgs/basic logo.jpeg">
                <a href="login.php">Login</a>
                <a href="index.html">Home</a>
            </div>
            <h1 style="text-align: center;">Login/Create Account</h1>
        </section>
        <form class="login-box" action="login.php" method="post">
            <div class="username">
                <label for="usr">Username: </label>
                <input id="usr" name="usr" style="width: 50%;">
            </div>
            <div class="password">
                <label for="pwd">Password: </label>
                <input id="pwd" name="pwd" style="width: 50%;">
            </div>
            <button id="login-btn" name="login" style="border-radius: 5px;" value="Login"></button>
            <button id="create-acct-btn" name="create" style="border-radius: 5px;" value="Create Account"></button>
        </form>
        <script src="scripts/login.js"></script>
    </body>
</html>

<?php   
    $servername = 'localhost';  // declare the server name (ip address)
    $username = 'guest';    // declare name of user to log in to the database (I made 'guest' account myself, as it doesn't naturally exist w/ the software stack I used (AMPPS))
    $password = ''; // password for guest account is not set, and guest only has search permissions
    $dbname = 'accounts';  // name of database to link to on the sql server

    $conn = new mysqli($servername, $username, $password, $dbname); // establish connection to sql server
    // port and socket can be specified but don't have to be if using a software stack like ampps (at least, that's how it seems)
    if ($conn->connect_error) { // if there's an error trying to connect
        die("Connection to database failed: {$conn->connect_error}");   // die() kills the connection and displays the error message
    }
    
    $randid = rand(1, 51);  // gets a random video index from the database

    /*

    ***** This code creates a database on the server and populates it by reading a local sql file
    and passing each sql line as a query to the sql database connected to earlier. Only works if user account
    that is connected to database has CREATE permissions inside of the mysql server (the guest account does not) *****

        $sqlLine = "CREATE DATABASE IF NOT EXISTS yt_videos";   // 'stage' query line
        $conn->query($sqlLine); // query database with the staged query line in $sqlLine

        if($conn->query($sqlLine) === true) {   // continue if the query was successful
            ;
        }

        else {  // else there was an error with the query
            echo "Failed to create database: {$conn->error}<br>";
        }
        
        
        $dbSelect = $conn->select_db('yt_videos');  // attempt to connect to a new database on the same sql server
        if (!$dbSelect) {   // if connection was not made, display the error
            die("Connection to database failed: {$conn->connect_error}");
        }

        // else connection successful 

        $sqlScript = file('db/videos.sql'); // stage sql file to read from

        $query = '';    // will hold the current query line parsed from the $sqlScript file
        foreach($sqlScript as $line) {  // iterates through each element in $sqlScript using $line
            $start = substr(trim($line), 0, 2); // catch first two characters to check for a sql comment {'--', '/*', '//'}
            $end = substr(trim($line), -1, 1);  // catch last character to check for a sql statement end (semicolon ;)
            if(empty($line) || $start == '--' || $start == '/*' || $start == '//') {
                continue;   // continue to next iteration of loop and do not appent $line to query
            }

            // else
            $query .= $line;    // append $line to query
            if($end == ';') { // if end of sql statment is found
                if(!$conn->query($query)) { // attempt to do query and if the query was not successful, display error
                    echo "Error executing query: {$conn->error}<br>";  
                }
                // else query was successful
                $query = ''; // reset query
            }
        }
        echo 'SQL file imported successfully.<br>';
    */

    $sql = 'SELECT id, username, password FROM accounts'; // gets all video ids' titles, and urls from the videos database
    $result = $conn->query($sql);   // select query will return a mapped object containing the results of the query
    $usernames = [];   // empty array to append usernames
    $ids = [];  // empty array to append user ids
    if($result->num_rows > 0) { // if the number of rows of the sql result is greater than 0
        while($row = $result->fetch_assoc()) {  // fetch the next associated row from the current read position (starts at row 0, the first row from the query select results)
            array_push($usernames, $row['username']);   // push url from the current row into $usernames array
            array_push($ids, $row['id']);   // push id from current row into $ids array
        }
    }
    else {  // else query had no results
        echo '0 results found';
    }

    @$login = $_POST['login']; // $_POST is a method of retrieving data from a form element in an html document
    $login = $login === 'Login' ? true : false; // ternary statement checks if submit was clicked and sets true if it was, false if not
    if($login) {   // if submit button of form was clicked
        @$usr = $_POST['usr'];   // get the entered username
        @$pwd = $_POST['pwd'];  // get the entered password
        if(!strlen($usr) > 0) { // if they didn't enter a name
            // display a message indicating that a username is required
            echo "<br><hr><p style='font-size:1.5rem'>Error: Username field cannot be empty!</p><hr>";
        }
        else {  // else a username was entered
            foreach($usernames as $user) {
                if($usr === $user) {    // if entered username is found in database (is valid)
                    $query = "SELECT id, password FROM accounts WHERE id = {$id}";
                    $result = $conn->query($query);
                    $password = $result['password'];
                    if($pwd === $password) {
                        echo "<p style='font-size:1.5rem;'>Welcome, {$usr}</p><br>";
                    }
                    else {
                        echo "<p style='font-size:1.5rem;'>Invalid password for account {$usr}. Try again</p><br>";
                    }
                }
                else {  // else entered username not valid
                    echo "<p style='font-size:1.5rem;'>Account {$usr} does not exist.</p><br>";
                }
            }
        }
    }

    $conn->close(); // close sql connection
?>