# video-player
Our video player project.

# Contributors:
LoganZ3, zc1778, HunterWillis12, SmoCloud, Neptunes22

# Note:
All of the node modules can be installed using powershell or git BASH. This can be done from within the VS Code integrated terminal window or independently using the Windows PowerShell or Git BASH that is included with the git download (these shells use linux-like commands, rather than Windows commands, and offer more functionality and ease of use).

# Dependencies
- Node.js : 
    - Comes with npm
    - Installed at 'https://nodejs.org/en'
    - Node Modules :
        - All node modules can be installed by running 'npm install' from inside of the directory that contains the package.json folder (the root directory of this project).
        - List of node modules: 
            - CORS              ^2.8.5
            - crypto            ^1.0.1
            - date-fns          ^4.1.0
            - ejs               ^3.1.10
            - express           ^4.21.2
            - express-session   ^1.18.1
            - formidable        ^3.5.2
            - mysql2            ^3.12.0
            - uuid              ^11.0.2
            - video.js          ^8.19.1

# Get Started:
- Run server.js from the command line using 'node server' or 'node --watch server' to have the server hot reload whenever any file being watched changes.
- Additionally, you could also do 'npm start' as an equivalent to 'node server' or 'npm run dev' as an equivalent to 'node --watch server'. 
- The console will output a message displaying what port the server is listening on. 
- From there, open your browser and type 'localhost:SERVER-PORT' where 'SERVER-PORT' is the port number in the console window, and voila! You have launched a local server.

# TODO
- Find a place to host website and acquire unique domain name
- Introduce some security/encryption of data passed from the front-end to the back-end and stored in database (user account passwords, video upload file names, etc.)
- Finish building video player API (passwords and password hashing)
- Containerize within Docker
- Test Test Test!
- Interact with YouTube API (likely using node.js)*



* This is less a goal and more of a hope, that we can reach the point that we actually start thinking about and trying to do this.