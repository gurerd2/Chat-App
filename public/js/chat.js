// client side of chat app

const socket = io()  // have access to io function because put socket.io.js in script tag in index.html
					// io() returns any messages sent from server

// Elements for this app from the DOM
// note that by convention people put a $ in front of variables that represent DOM elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton =  document.querySelector('#sendLocation')
const $messagesDiv = document.querySelector('#messages')  // where on page want the messageTemplate to be rendered
const $locationDiv = $messagesDiv  // where on page want the location template to be rendered
const $sidebar = document.querySelector('#sidebar')


// Templates defined in the HTML
const messageTemplate = document.querySelector('#messageTemplate').innerHTML
const locationTemplate = document.querySelector('#locationTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML

// Options

// when user clicks "join", control moves to chat.html with the following: 
//     ?username=<some user name>&room=<room name>  which is in location.search
// the query library can be used to parse this to get the username and room
const {username, room} = Qs.parse(location.search, {  ignoreQueryPrefix: true })  
							// options object -> ignore the question mark at beginning

// AUTO SCROLL MESSAGES
//**************************************
const autoscroll = () => {

// get new message -- they are added to bottom so use lastChild
const $newMessage = $messagesDiv.lastElementChild 

// get height of new message 
// offsetHeight doesn't include margins, so have to add that in also
const newMessageStyles = getComputedStyle($newMessage)  // get all css styles for element
const newMessageMargin = parseInt(newMessageStyles.marginBottom)
const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

// get visible height of div for messages
const visibleHeight = $messagesDiv.offsetHeight

// get height of container for messages
const messageContainerHeight = $messagesDiv.scrollHeight  // returns total height we are able to scroll 
														//through --> this may be larger than visible height
														// user will only see what is within visible window
														// depending on where scroll  currently is

// find out where user currently is in message container
const scrollOffset = $messagesDiv.scrollTop + visibleHeight
									// scrollTop is distance between top of container and top of scrollbar
									// a scrollTop of 0 means the user is at the top of the message container 
									// Note: there is no scrollbottom so have to do it this way
									// scrollbar height is the same as the visible height of the container

// if user is at bottom, then scroll to bottom including new message
// otherwise stay where user is (they may be looking at previous messages at top of message container)
// and you don't want the scroll to constantly be jumping back down when new messages come in
if ((messageContainerHeight - newMessageHeight) <= scrollOffset) {
	$messagesDiv.scrollTop = messageContainerHeight  // scroll to bottom of messages
}



}

socket.on('message', (message) => {
	//console.log(message)
	const html = Mustache.render(messageTemplate, {  // send an object to be rendered 
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')   
	})
	$messagesDiv.insertAdjacentHTML('beforeend',html)  // insert the html in the const html, at the end of the div

	autoscroll()
})

// template to RENDER LOCATION URL
//**************************************
socket.on('locationMessage', (message) => {
	const html = Mustache.render(locationTemplate, {  // send an object to be rendered 
		username: message.username,
		locationURL: message.url,
		createdAt: moment(message.createdAt).format('h:mm a') 
	})
	$locationDiv.insertAdjacentHTML('beforeend',html) 

	autoscroll()
})

// UPDATE USERS IN SIDEBAR
// ***************************************
socket.on('roomData', ({room, users}) => {
	const html = Mustache.render(sidebarTemplate,{
		room,
		users
	})
	$sidebar.innerHTML =  html
})


// USER SEND MESSAGE
// *****************************************
$messageForm.addEventListener('submit', (event) => {
	event.preventDefault();

	$messageFormButton.setAttribute('disabled','disabled')  // disable button until message is sent

	const msg = event.target.elements.inputMsg.value // event.target is the form, 
													//inputMsg is the name given to the input field
	socket.emit('sendmessage', msg, (error) => {
		$messageFormButton.removeAttribute('disabled')  // enable button whether is an error or not
		$messageFormInput.value = ''  // clear input 
		$messageFormInput.focus()   // move focus to input box

		if (error) {
			return console.log(error)
		}
		
		//console.log("Message delivered!")  
	})
})

// USER SEND LOCATION
//***************************************************
document.querySelector("#sendLocation").addEventListener('click', () => { // location button 
	if (!navigator.geolocation) {
		return alert("Geolocation is not supported by your browser.")
	}

	$locationButton.setAttribute('disabled','disabled')  // disable button until location is sent
														// set attribute "disabled" to the value "disabled"


	navigator.geolocation.getCurrentPosition( (position) => {
		const lat = position.coords.latitude
		const long = position.coords.longitude
		socket.emit("sendLocation",{
			latitude: lat,
			longitude: long
		}, (error) => {
			if (error) {
				return console.log(error)
			}
			$locationButton.removeAttribute('disabled')  // enable button whether is an error or not
			//console.log("Location Delivered!")
		})
	})

	
})

// USER JOIN ROOM
// ***********************************************
socket.emit('join', {username, room}, (error) => {  // third parameter is acknowledgement function
	if (error) {
        alert(error)
        location.href = '/'  // send back to root of site -- the join page
    }
})




// socket.on('countUpdated', (count) => {
//  	console.log("the count has been updated to "+count)  // message appears in browser console for client
//  })


// document.querySelector("#increment").addEventListener('click', () => {
// 	console.log("clicked!")
// 	socket.emit('increment') // send message to server
// })