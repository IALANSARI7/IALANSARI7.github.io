const http = require('http');
const fs = require('fs');
const path = require('path');
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    // Handle root path
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = path.extname(filePath);
    
    // List of allowed extensions
    const allowedExtensions = ['.html', '.js', '.css'];
    
    // If extension is not in allowed list or path doesn't exist, redirect to profile.html
    if (!allowedExtensions.includes(extname) || !fs.existsSync(filePath)) {
        filePath = './profile.html';
    }
    let contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
    }
    fs.readFile(filePath, (error, content) => {
        if (!error) {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        } else {
            // Fallback to profile.html if there's an error
            fs.readFile('./index.html', (err, content) => {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content, 'utf-8');
            });
        }
    });
});
const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});