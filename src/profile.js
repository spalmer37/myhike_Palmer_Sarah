import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig.js";

// -------------------------------------------------------------
// Function to populate user info in the profile form
// Fetches user data from Firestore and fills in the form fields
// Assumes user is already authenticated
// and their UID corresponds to a document in the "users" collection
// of Firestore.
// Fields populated: name, school, city
// Form field IDs: nameInput, schoolInput, cityInput
// -------------------------------------------------------------
async function populateUserInfo(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      const { name = "", school = "", city = "" } = userData;

      document.getElementById("nameInput").value = name;
      document.getElementById("schoolInput").value = school;
      document.getElementById("cityInput").value = city;
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error getting user document:", error);
  }
}

//call the function to run it
// populateUserInfo();

//-------------------------------------------------------------
// Function to enable editing of user info form fields
//-------------------------------------------------------------
document.querySelector("#editButton").addEventListener("click", editUserInfo);
function editUserInfo() {
  //Enable the form fields
  document.getElementById("personalInfoFields").disabled = false;
}

//-------------------------------------------------------------
// Function to save updated user info from the profile form
//-------------------------------------------------------------
document.querySelector("#saveButton").addEventListener("click", saveUserInfo); //Add event listener for save button
async function saveUserInfo() {
  const user = auth.currentUser; // ✅ get the currently logged-in user
  if (!user) {
    alert("No user is signed in. Please log in first.");
    return;
  }
  //enter code here

  //a) get user entered values
  const userName = document.getElementById("nameInput").value; //get the value of the field with id="nameInput"
  const userSchool = document.getElementById("schoolInput").value; //get the value of the field with id="schoolInput"
  const userCity = document.getElementById("cityInput").value; //get the value of the field with id="cityInput"
  //b) update user's document in Firestore
  await updateUserDocument(user.uid, userName, userSchool, userCity);
  //c) disable edit
  document.getElementById("personalInfoFields").disabled = true;
}

//-------------------------------------------------------------
// Updates the user document in Firestore with new values
// Parameters:
//   uid (string)  – user’s UID
//   name, school, city (strings)
//-------------------------------------------------------------
async function updateUserDocument(uid, name, school, city) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { name, school, city });
    console.log("User document successfully updated!");
  } catch (error) {
    console.error("Error updating user document:", error);
  }
}

async function renderSavedHikes(userId) {
  const hikeCardGroup = document.getElementById("hikeCardGroup");
  const newcardTemplate = document.getElementById("savedCardTemplate");

  // Clear existing cards
  hikeCardGroup.innerHTML = "";

  try {
    const userRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userRef);

    if (!userDocSnap.exists()) {
      console.log("User does not exist:", userId);
      hikeCardGroup.innerHTML = "<p>User does not exist.</p>";
      return;
    }

    const userData = userDocSnap.data();
    const bookmarks = userData.bookmarks || [];

    if (bookmarks.length === 0) {
      hikeCardGroup.innerHTML = "<p>No saved hikes found.</p>";
      return;
    }

    for (const hikeId of bookmarks) {
      try {
        const hikeRef = doc(db, "hikes", hikeId);
        const hikeDocSnap = await getDoc(hikeRef);

        if (!hikeDocSnap.exists()) {
          console.log("No hike document for ID", hikeId);
          continue;
        }

        const hikeData = hikeDocSnap.data();
        const newcard = newcardTemplate.content.cloneNode(true);
        newcard.querySelector(".card-title").innerText = hikeData.name;
        newcard.querySelector(".card-text").textContent =
          hikeData.details || `Located in ${hikeData.city}.`;
        newcard.querySelector(".card-length").innerText = hikeData.length;
        newcard.querySelector(".card-image").src =
          `./images/${hikeData.code}.jpg`;
        newcard.querySelector("a").href = "eachHike.html?docID=" + hikeId;
        hikeCardGroup.appendChild(newcard);
      } catch (hikeError) {
        console.error("Error loading hike:", hikeId, hikeError);
      }
    }
  } catch (error) {
    console.error("Error rendering saved hikes:", error);
    hikeCardGroup.innerHTML =
      "<p>Something went wrong while loading saved hikes.</p>";
  }
}

function initProfilePage() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Redirect to login page if no user is signed in
      window.location.href = "login.html";
      return;
    }

    await populateUserInfo(user.uid);
    await renderSavedHikes(user.uid);
  });
}

initProfilePage();
