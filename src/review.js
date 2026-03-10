import { db } from "./firebaseConfig.js";
import { auth } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import * as bootstrap from "bootstrap";

//-----------------------------------------------------------
// Get hike ID from Local Storage
// Go to firestore to get the name of the hike (using this ID)
// and display in title of the page
//-----------------------------------------------------------
var hikeDocID = localStorage.getItem("hikeDocID");
displayHikeName(hikeDocID);

async function displayHikeName(id) {
  try {
    const hikeRef = doc(db, "hikes", id);
    const hikeSnap = await getDoc(hikeRef);

    if (hikeSnap.exists()) {
      const hikeName = hikeSnap.data().name;
      document.getElementById("hikeName").textContent = hikeName;
    } else {
      console.log("No such hike found!");
    }
  } catch (error) {
    console.error("Error getting hike document:", error);
  }
}

let hikeRating = 0;

// Run after page loads
document.addEventListener("DOMContentLoaded", () => {
  manageStars();

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.addEventListener("click", writeReview);
});

function manageStars() {
  const stars = document.querySelectorAll(".star");

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      stars.forEach((s, i) => {
        s.textContent = i <= index ? "star" : "star_outline";
      });

      hikeRating = index + 1;
      console.log("Current rating:", hikeRating);
    });
  });
}

//---------------------------------------------------------------------
// Function to write review data into Firestore
//---------------------------------------------------------------------

async function writeReview() {
  console.log("Inside write review");

  const hikeTitle = document.getElementById("title").value;
  const hikeLevel = document.getElementById("level").value;
  const hikeSeason = document.getElementById("season").value;
  const hikeDescription = document.getElementById("description").value;

  const hikeFlooded = document.querySelector(
    'input[name="flooded"]:checked',
  )?.value;

  const hikeScrambled = document.querySelector(
    'input[name="scrambled"]:checked',
  )?.value;

  console.log("inside write review, rating =", hikeRating);
  console.log("hikeDocID =", hikeDocID);

  if (!hikeTitle || !hikeDescription) {
    alert("Please complete all required fields.");
    return;
  }

  const user = auth.currentUser;

  if (user) {
    try {
      const userID = user.uid;

      await addDoc(collection(db, "hikes", hikeDocID, "reviews"), {
        userID: userID,
        title: hikeTitle,
        level: hikeLevel,
        season: hikeSeason,
        description: hikeDescription,
        flooded: hikeFlooded,
        scrambled: hikeScrambled,
        rating: hikeRating,
        timestamp: serverTimestamp(),
      });

      console.log("Review successfully written!");

      const thankYouModalEl = document.getElementById("thankYouModal");
      const thankYouModal = new bootstrap.Modal(thankYouModalEl);
      thankYouModal.show();

      thankYouModalEl.addEventListener(
        "hidden.bs.modal",
        () => {
          window.location.href = `eachHike.html?docID=${hikeDocID}`;
        },
        { once: true },
      );
    } catch (error) {
      console.error("Error adding review:", error);
    }
  } else {
    console.log("No user is signed in");
  }
}
