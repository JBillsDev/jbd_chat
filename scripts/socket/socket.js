// Create a socket variable.
const socket = io({
  autoConnect: false
});

// Get the form elements used for submission.
const connect_button = document.getElementById('connect-button');
const input = document.getElementById('input');
const input_button = document.getElementById('input-button');
const messages = document.getElementById('messages');
const nickname = document.getElementById('nickname');
const user_activity = document.getElementById('user-activity');

// User's current nickname.
let user_name = 'User';
nickname.value = user_name;

// Used to determine and transmit the current typing status of the user.
let typing = false;
let typing_timeout_id = undefined;
const typing_timeout_duration = 5000;

// Check for connection.
let connection_check_id = undefined;

/* Interval used to ensure the ui updates to reflect the current
connection status in the event of dropping or regaining of connection. */
function connectionCheck() {
  connection_check_id = setInterval(() => {
    if (socket.connected) {
      connect_button.textContent = "Disconnect";
      input.removeAttribute('disabled');
      input_button.removeAttribute('disabled');
    } else {
      connect_button.textContent = "Connect";
      input.setAttribute('disabled', '');
      input_button.setAttribute('disabled', '');
    }
  }, 200);
}

// Callback for the connect/disconnect button.
connect_button.onclick = (event) => {
  if (socket.connected) {
    socket.disconnect();
    connect_button.textContent = "Disconnect";
  } else {
    socket.connect();
    connect_button.textContent = "Connect";
  }
};

connectionCheck();

function emitTypingMessage() {
  // Create the typing message.
  let typing_message = 'user typing';
  // Adjust if the user has stopped typing.
  if (!typing) {
    typing_message = typing_message + ' end';
  }

  // Emit the typing message to the server.
  socket.emit(typing_message, nickname.value);
}

// Cancel the typing status message of the user.
function typingTimeout() {
  typing = false;
  emitTypingMessage();
}

// Callback for keypresses within the message input field.
input.onkeydown = (event) => {
  const name = nickname.value;
  if (event.key == 'Enter' || name == '') {
    typingTimeout()
    return;
  }

  if (typing) {
    clearTimeout(typing_timeout_id);
    typing_timeout_id = setTimeout(typingTimeout, typing_timeout_duration);
  } else {
    typing = true;
    emitTypingMessage();
    typing_timeout_id = setTimeout(typingTimeout, typing_timeout_duration);
  }
};

// Add the specified message to the message list.
function appendMessage(message) {
  var item = document.createElement('li');
  item.textContent = message;
  messages.appendChild(item);
}

// Add the form's submission callback.
document.getElementById('form').addEventListener('submit', (e) => {
  // Prevent default submission callbacks.
  e.preventDefault();

  const name = nickname.value;

  // Prevent submitting if there is no input or name.
  if (input.value && name != '') {
    const message = name + ' >  ' + input.value;
    // Submit the user's message.
    socket.emit('chat message', message);

    // Clear the user input field.
    input.value = '';
  }
});

// Callback for received chat message.
socket.on('chat message', (message) => {
  appendMessage(message);
  console.log(socket)
  window.scrollTo(0, document.body.scrollHeight);
});

// Callback for received chat message.
socket.on('disconnect message', (message) => {
  appendMessage(message);
  console.log(socket)
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('name request', () => {
  socket.emit('name response', user_name);
});

// Callback for a user's name being changed.
socket.on('nickname change', (names) => {
  // Conver the string into an object.
  names = JSON.parse(names);

  // Return if the old username cannot be found.
  if (document.getElementById(names.from) == null) {
    return;
  }

  let child = document.getElementById(names.from);

  // Remove the node if the user's new name is empty.
  if (names.to == '') {
    user_activity.removeChild(child);
  } else {
    child.id = names.to;
    child.textContent = `${names.to} is typing...`;
  }
});

// Callback for received user is typing message.
socket.on('user typing', (user_name) => {
  const item = document.createElement('li');
  item.id = user_name;
  item.textContent = `${user_name} is typing...`;
  user_activity.appendChild(item);
});

// Callback for received user is finished typing message.
socket.on('user typing end', (user_name) => {
  const item = document.getElementById(user_name);
  if (item == null) {
    return;
  }

  user_activity.removeChild(item);
});

// Add callback for nickname input field.
nickname.oninput = (event) => {
  const name = document.getElementById('nickname').value;

  if (name != user_name) {
    const names = {
      from: user_name,
      to: nickname.value
    };

    socket.emit('nickname change', JSON.stringify(names));

    user_name = name;
  }
};