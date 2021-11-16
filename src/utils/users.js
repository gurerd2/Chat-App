const users = []

// ADD USER
// *******************
const addUser = ({socketID, username, room}) => {
	// clean the data
	username = username.trim().toLowerCase()
	username = username.charAt(0).toUpperCase() + username.slice(1)  //capitalize first letter
	room = room.trim().toLowerCase()
	room = room.charAt(0).toUpperCase() + room.slice(1)  //capitalize first letter

	// validate the data
	if (!username || !room) {
		return {
			error: "User name and room are required."

		}
	}

	// check for existing user
	const existingUser = users.find((user) => {
		return user.room === room && user.username === username
	})

	// validate user
	if (existingUser) {
		return {
			error: "User name is already in use"
		}
	}

	// add user
	const user = {socketID, username, room}
	users.push(user)
	return {user}

}



// DELETE USER
//***********************
const removeUser = (socketID) => {
	// find user in array
	const index = users.findIndex((user) => user.socketID === socketID)

	// remove user
	if (index !== -1) {
		return users.splice(index,1)[0]  // remove one item at index, returns an array of removed items, 
										// want to return the item removed (only one item) 
										// so return index [0] of removed items
										// NOTE: splice is faster than filter since filter keeps going 
										// to the end even if finds item
	}
}



// GET USER
//********************************
const getUser = (socketID) => {
// return user or undefined
	return users.find((user) => user.socketID === socketID)
}



// GET USERS FROM ROOM
//**********************************
const getUsersInRoom = (room) => {
// return array of users or empty array
	return users.filter(user => user.room === room)
}

module.exports = {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom
}