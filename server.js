const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {};

io.on('connection', (socket) => {
    socket.on('set username', (username) => {
        users[socket.id] = username;
        io.emit('user list', users);
    });

    socket.on('public message', (encrypted) => {
        socket.broadcast.emit('public message', encrypted);
    });

    socket.on('private message', ({ to, encrypted }) => {
        socket.to(to).emit('private message', {
            from: socket.id,
            encrypted
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('user list', users);
    });
});

server.listen(3000, () => {
    console.log('✅ Server is running at http://localhost:3000');
});
