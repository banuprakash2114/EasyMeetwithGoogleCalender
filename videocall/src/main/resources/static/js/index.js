// Function to handle loading and displaying users
function loadAndDisplayUsers() {
  const connectedUser = localStorage.getItem('connectedUser');
 // if (!connectedUser) {
    // Redirect to login page if user is not connected
   // window.location = 'login.html';
   // return;  // Ensure that the function doesn't proceed further if the user is not connected
  //}

  const userStatus = document.getElementById("userStatus");
  const loadingContainer = document.getElementById("loadingContainer");

  // Show loading screen
  loadingContainer.style.display = "flex";

  // Fetch the list of users from the backend
  fetch("http://localhost:8080/api/v1/users")
    .then((response) => response.json())
    .then((users) => {
      loadingContainer.style.display = "none";
      userStatus.innerHTML = ''; // Clear previous user list if any

      if (users && users.length > 0) {
        users.forEach(user => {
          const userElement = document.createElement('div');
          userElement.style.display = "flex";
          userElement.style.alignItems = "center";
          userElement.style.marginBottom = "10px"; // Spacing between users

          const contactLogo = document.createElement('img');
          contactLogo.src = "/image/contact.png";
          contactLogo.alt = "Contact Icon";
          contactLogo.style.width = "30px";
          contactLogo.style.height = "30px";
          contactLogo.style.marginRight = "10px";

          const userInfo = document.createElement('span');
          userInfo.textContent = `${user.username} (${user.email})`;
          userInfo.style.fontSize = "1rem";
          userInfo.style.fontWeight = "bold";
          userInfo.style.color = "#333";

          const bulbIcon = document.createElement('img');
          bulbIcon.src = "/image/bulb.png";
          bulbIcon.alt = "Bulb Icon";
          bulbIcon.style.width = "20px";
          bulbIcon.style.height = "20px";
          bulbIcon.style.marginLeft = "10px";

          userElement.appendChild(contactLogo);
          userElement.appendChild(userInfo);
          userElement.appendChild(bulbIcon);

          userStatus.appendChild(userElement);
        });
      } else {
        userStatus.textContent = "No users connected";
      }
    })
    .catch((error) => {
      console.error("Failed to load users:", error);
      loadingContainer.style.display = "none";
      userStatus.textContent = "Failed to load users";
    });
}

// Handle Logout by making a POST call to the backend
function handleLogout() {
  const loadingContainer = document.getElementById("loadingContainer");
  loadingContainer.style.display = "flex";

  fetch("http://localhost:8080/api/v1/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "User logout request",
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Logout successful:", data);

      localStorage.removeItem("connectedUser");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("status");

      loadingContainer.style.display = "none";
      window.location.href = "/login.html"; // Adjust the path to your login page
    })
    .catch((error) => {
      console.error("Logout failed:", error);
      loadingContainer.style.display = "none";
    });
}

// Call loadAndDisplayUsers when the page loads
document.addEventListener("DOMContentLoaded", function () {
  loadAndDisplayUsers();

  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }

  // Attach event listener to new meeting button
  const newMeetingBtn = document.getElementById("newMeetingBtn");
  if (newMeetingBtn) {
    newMeetingBtn.addEventListener("click", handleNewMeeting);
  }
});

// Function to handle creating a new meeting
function handleNewMeeting() {
  const connectedUser = JSON.parse(localStorage.getItem('connectedUser'));
  if (connectedUser) {
    // Dynamically constructing the URL
    const url = `videocall.html?username=${encodeURIComponent(connectedUser.username)}`;
    window.open(url, '_blank');
  } else {
    alert('User not logged in');
  }
}

const newMeetingBtn = document.getElementById("newMeetingBtn");
newMeetingBtn.addEventListener("click", handleNewMeeting);

function handleJoinMeeting(event) {
  event.preventDefault();  // Prevent form submission

  const roomId = document.getElementById("meetingId").value;  // Get the room ID
  const connectedUser = JSON.parse(localStorage.getItem('connectedUser'));  // Retrieve the connected user from localStorage

  if (roomId && connectedUser) {
    // Construct the URL with the room ID and username
    const url = `videocall.html?roomID=${roomId}&username=${connectedUser.username}`;

    // Open the URL in a new tab
    window.open(url, "_blank");
  } else {
    alert("Please make sure you're logged in and entered a valid meeting ID.");
  }
}

// Google API functions for calendar integration
function start() {
    gapi.client.init({
        apiKey: 'AIzaSyCuI8nCHItP32KBbrM1NeYphzdRjv4rulg',
        clientId: '164257842675-aksqluat6fub2tohjp9tjfdkbn9er894.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/calendar',
    }).then(function() {
        console.log('API client ready');
    }).catch(function(error) {
        console.error('Initialization error:', error);
    });
}

function authenticate() {
    return gapi.auth2.getAuthInstance()
      .signIn({ scope: "https://www.googleapis.com/auth/calendar" })
      .then(function () {
        console.log("Sign-in successful");
      }, function (err) {
        console.error("Error signing in", err);
      });
}

function loadClient() {
    gapi.client.setApiKey("AIzaSyCuI8nCHItP32KBbrM1NeYphzdRjv4rulg");
    return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/calendar/v3/rest")
      .then(function () {
        console.log("GAPI client loaded for Calendar API");
      }, function (err) {
        console.error("Error loading GAPI client", err);
      });
}

function createEvent() {
    const event = {
      "summary": "Sample Meeting",
      "location": "Online",
      "description": "A meeting scheduled via EasyMeet",
      "start": {
        "dateTime": "2025-01-25T09:00:00-07:00", // Example start time
        "timeZone": "America/Los_Angeles"
      },
      "end": {
        "dateTime": "2025-01-25T10:00:00-07:00", // Example end time
        "timeZone": "America/Los_Angeles"
      }
    };

    const request = gapi.client.calendar.events.insert({
      "calendarId": "primary",
      "resource": event
    });

    request.execute(function(event) {
      console.log("Event created: " + event.htmlLink);
    });
}

gapi.load('client:auth2', start);

//
