//* Initialize a connection to the server using Socket.IO
const socket = io();

//* Get references to various DOM elements for messaging functionality
const messageInput = document.getElementById('message-input');  // Input field for typing messages
const messageArea = document.querySelector('.message-area');  // Area where messages are displayed
const userInfo = document.querySelector('.user-info');   // Element used to display notifications such as users joining or leaving
const displayRoomID = document.getElementById('room-id');  // Element displaying the current room ID of user
const inputRoomID = document.getElementById('room-id-input');   // Input field for entering a room ID
const aiCheckbox = document.getElementById('ai-checkbox'); // Checkbox element to chat with AI



//* Load audio files for different user interactions
// 'incomingMsg' plays when a new message is received
const incomingMsg = new Audio('../audio/incoming-msg.mp3');
// 'userJoin' plays when a user joins
const userJoin = new Audio('../audio/user-join.mp3');
// 'userLeft' plays when a user leaves
const userLeft = new Audio('../audio/user-left.mp3');
// plays when an AI sends a response
const incomingMsgForAi = new Audio('../audio/ai-incoming-msg.mp3');

//* Prompt the user to enter their name, repeating until a valid name is provided
let name;
do {
  name = prompt('Please enter your name');
} while (!name);


//* Listen for keyup events on the message input field
messageInput.addEventListener('keyup', (e) => {
  const message = e.target.value;
  // Ignore empty messages or messages that are only whitespace
  if (message.trim() === '') return
  // Send the message if the Enter key is pressed
  if (e.key === 'Enter') {
    sendMessage(e.target.value);
    messageInput.value = '';   // Clear the input field
  }
})


/*
* Appends a message to the message area
? @param {Object} msg - The message object containing the name and message text
? @param {string} type - The type of message (e.g., 'incoming', 'outgoing') used to set the CSS class
*/
function appendMessage(msg, type) {
  // Create a new div element to hold the message
  const mainDiv = document.createElement('div');
  // Define the CSS class for the message based on its type
  const className = type;
  // Create the HTML markup for the message content
  const markup = `
  <h4>${msg.name}: </h4>
  <p>${msg.message}</p>
  `
  // Set the inner HTML of the div to the message markup
  mainDiv.innerHTML = markup;
  // Add the appropriate CSS classes to the div
  mainDiv.classList.add(className, 'message');
  // Append the new message div to the message area
  messageArea.appendChild(mainDiv);
}

/*
*  Appends user information (such as a join or leave notification) to the message area
? @param {string} name - The name of the user
? @param {string} message - The message to display (e.g., 'has joined', 'has left')
*/
function appendUserInfo(name, statusMessage) {
  const userInfoDiv = document.createElement('div');
  const className = 'user-info';
  userInfoDiv.classList.add(className);
  const markup = `
  <p>${name} ${statusMessage}</p>
  `
  userInfoDiv.innerHTML = markup;
  messageArea.appendChild(userInfoDiv);
}


/*
 * Appends a AI response to the message area.
? @param {string} msg - The message text to be appended.
? @param {string} type - The type of message ('outgoing' or 'incoming').
 */
function appendAiResponse(msg, type) {
  const mainDiv = document.createElement('div');
  const className = type;
  // Format the message by replacing newline characters with HTML line breaks
  const formattedMsg = msg.replace(/\n/g, '<br>'); // Replace \n with <br>
  const markup = `
    <h4>${type === 'outgoing' ? 'You' : 'ChatterBee'}:</h4>
    <p>${formattedMsg}</p>
  `;
  mainDiv.innerHTML = markup;
  mainDiv.classList.add(className, 'message');
  messageArea.appendChild(mainDiv);
}

/*
* Sends a message and updates the UI
? @param {string} message - The message text to send
 */
function sendMessage(message) {
  // Create a message object with the user's name and trimmed message text
  const msg = {
    name: name,
    message: message.trim(),
  }
  // Append the message to the UI as an outgoing message
  appendMessage(msg, 'outgoing');
   // Check if the AI checkbox is checked
  if (aiCheckbox.checked) {
    // Send the prompt to the server to generate a response using Gemini
    socket.emit('promptForGemini', message.trim());
  } else {
    // Send the message to the server along with the trimmed room ID
    socket.emit('message', msg, inputRoomID.value.trim());
  }
  // Scroll to the bottom of the message area to show the latest message
  scrollToBottom();
}

//* Update the displayed room ID with the socket's connection ID when connected
socket.on('connect', () => {
  displayRoomID.innerHTML = socket.id;
})

//* Handle incoming AI response: append to UI, play notification sound, and scroll to bottom
socket.on('aiResponse', (response) => {
  if (aiCheckbox.checked) {
    appendAiResponse(response, 'incoming');
    incomingMsgForAi.play();
    scrollToBottom();
  }
})

/*
 * Handles incoming messages.
? @param {Object} msg - The incoming message object containing the message text and other details.
 */
socket.on('message', (msg) => {
  if (!aiCheckbox.checked) {
    appendMessage(msg, 'incoming');  // Append incoming message to the message area as an incoming message
    incomingMsg.play();  // Play incoming message notification sound
    scrollToBottom();   // Scroll to the bottom of the message area to show the latest message
  }
})


//* Handle user joined event: play join sound and append user join information to UI
socket.on('userJoined', (newUser) => {
  if(!aiCheckbox.checked){
    userJoin.play();  // Play user join notification sound
    appendUserInfo(newUser, 'joined');  // Append user join information to the message area
  }
});

//* Handle user left event: play leave sound and append user leave information to UI
socket.on('userLeft', (user) => {
  if(!aiCheckbox.checked){
    userLeft.play();   // Play user leave notification sound
    appendUserInfo(user, 'left');  // Append user leave information to the message area
  }
})

//* Emit a 'newUserJoined' event to notify the server that a new user with the given name has joined
socket.emit('newUserJoined', name);

//* Scrolls the message area to the bottom to show the latest messages
function scrollToBottom() {
  messageArea.scrollTop = messageArea.scrollHeight;
}