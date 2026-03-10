import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

// Get the document ID from the URL
function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("docID");
}

// Fetch the hike and display its name and image
async function displayHikeInfo() {
  const id = getDocIdFromUrl();

  try {
    const hikeRef = doc(db, "hikes", id);
    const hikeSnap = await getDoc(hikeRef);

    const hike = hikeSnap.data();
    const name = hike.name;
    const code = hike.code;

    // Update the page
    document.getElementById("hikeName").textContent = name;
    const img = document.getElementById("hikeImage");
    img.src = `./images/${code}.jpg`;
    img.alt = `${name} image`;
  } catch (error) {
    console.error("Error loading hike:", error);
    document.getElementById("hikeName").textContent = "Error loading hike.";
  }
}

displayHikeInfo();

document.addEventListener("DOMContentLoaded", () => {
  const writeReviewBtn = document.getElementById("writeReviewBtn");
  writeReviewBtn.addEventListener("click", saveHikeDocumentIDAndRedirect);
});

function saveHikeDocumentIDAndRedirect() {
  const params = new URL(window.location.href);
  const hikeID = params.searchParams.get("docID");

  if (!hikeID) {
    console.warn("No hike ID found in URL. Cannot continue.");
    return;
  }

  // Save the hike ID locally;  provide the key, and the value
  localStorage.setItem("hikeDocID", hikeID);

  // Redirect to the review page
  window.location.href = "review.html";
}

async function populateReviews() {
  console.log("test");
  const reviewCardTemplate = document.getElementById("reviewCardTemplate");
  const reviewCardGroup = document.getElementById("reviewCardGroup");

  // Get hike ID from the URL (e.g. ?docID=abc123)
  const params = new URL(window.location.href);
  const hikeID = params.searchParams.get("docID");

  if (!hikeID) {
    console.warn("No hike ID found in URL.");
    return;
  }

  try {
    // Sub-collection path: hikes/{hikeID}/reviews
    const reviewsRef = collection(db, "hikes", hikeID, "reviews");

    // Optional: order by timestamp (recommended)
    // const q = query(reviewsRef, orderBy("timestamp", "desc"));
    // const querySnapshot = await getDocs(q);

    const querySnapshot = await getDocs(reviewsRef);

    console.log("Found", querySnapshot.size, "reviews");

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const title = data.title || "(No title)";
      const level = data.level || "(Not specified)";
      const season = data.season || "(Not specified)";
      const description = data.description || "";
      const flooded = data.flooded ?? "(unknown)";
      const scrambled = data.scrambled ?? "(unknown)";
      const rating = Number(data.rating ?? 0);

      // Format the time
      let time = "";
      if (data.timestamp?.toDate) {
        time = data.timestamp.toDate().toLocaleString();
      }

      // Clone the template and fill in the fields
      const reviewCard = reviewCardTemplate.content.cloneNode(true);

      reviewCard.querySelector(".title").textContent = title;
      reviewCard.querySelector(".time").textContent = time;
      reviewCard.querySelector(".level").textContent = `Level: ${level}`;
      reviewCard.querySelector(".season").textContent = `Season: ${season}`;
      reviewCard.querySelector(".scrambled").textContent =
        `Scrambled: ${scrambled}`;
      reviewCard.querySelector(".flooded").textContent = `Flooded: ${flooded}`;
      reviewCard.querySelector(".description").textContent =
        `Description: ${description}`;

      // Star rating
      let starRating = "";
      const safeRating = Math.max(0, Math.min(5, rating));
      for (let i = 0; i < safeRating; i++) {
        starRating += '<span class="material-icons">star</span>';
      }
      for (let i = safeRating; i < 5; i++) {
        starRating += '<span class="material-icons">star_outline</span>';
      }
      reviewCard.querySelector(".star-rating").innerHTML = starRating;

      reviewCardGroup.appendChild(reviewCard);
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
}

populateReviews();
