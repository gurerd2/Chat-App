// server side code with Nodejs and Express
const express = require('express')
const path = require('path') 
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)   // note that express actually does this behind the scenes
										// but we are creating it explicity so we have access
										// to the server to pass to the socketio function
const io = socketio(server)
const port = process.env.PORT || 3000;

// set up paths for express
const publicDirectoryPath = path.join(__dirname,'../public'); 
//const viewsPath = path.join(__dirname,'../templates/views'); 
//const partialsPath = path.join(__dirname,'../templates/partials'); 

app.use(express.static(publicDirectoryPath));

// NOTES
// socket.emit --> send to just this client
// socket.broadcast.emit --> send to all but this client
// io.emit --> send to everyone
// io.to.emit --> send to everyone in a specific room
// socket.broadcast.to.emit -->  send to everyone in specific room except for this client

io.on('connection', (socket) => {
	
	console.log("Web Socket opened!")

	socket.on('join', ({username, room}, callback) => {  // 2nd parameter is function with a callback as parameter
		const {error, user} = addUser({socketID: socket.id, username, room})
		if (error) {
			return callback(error)
		}

		socket.join(user.room)  // note, use "user.room" and not "room" since room has been sanitized by addUser
								// and you want to use that version (same goes for username)

		socket.emit('message', generateMessage('Admin',"Welcome!"))  // send to just this client
		socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`)) 
		// send to all connected clients in the room except this one

		// update side bar - add new user
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room)
		})

		callback()  // callback without error


	})

	socket.on('sendmessage', (message, callback) => { // last parameter is callback function
		const filter = new Filter;
		if (filter.isProfane(message)){
			return callback("Profanity is not allowed!")
		}

		const user = getUser(socket.id)
		io.to(user.room).emit("message",generateMessage(user.username,message))   // send to all connected clients
		callback() // let the client know this was received and acted on
							// you can have as many parameters as you want here
	})

	socket.on('sendLocation',(position, callback) => {
		//socket.broadcast.emit('message',`My location is latitude: ${position.latitude}, longitude: ${position.longitude}`)
		const user = getUser(socket.id)
		io.to(user.room).emit('locationMessage',
				generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`))
		callback()
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id)
		if (user) {
			io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left.`))

			// update sidebar - delete this user
			io.to(user.room).emit('roomData',{
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}
	})

	// socket.on('increment', () => {
 // 		const count = 5
 // 		console.log("received increment message on server")
 // 		io.emit('countUpdated',count)   // emits to all connections
 // 	})
})

server.listen(port,()=>{
	console.log(`server is up on port ${port}`);
})



// let count = 0

// io.on('connection', (socket) => {   // on the event "connection" execute the function,  socket is an object
// 									// with methods and info on the connection that just came in
// 	console.log("New web socket connection")

// 	socket.emit('countUpdated', count)   // send a message to the client along with data, just intial message
// 										// only sent once when client connects

// socket.on('increment', () => {
//  		count++
//  		//socket.emit('countUpdated',count)  // emits just to one client/connection
//  		io.emit('countUpdated',count)   // emits to all connections
//  	})
// })