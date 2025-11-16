// ---------------------------
// Firebase config & initialization
// ---------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJfAyK_wma5RaTv6DODRgCDExnFuLXK00",
  authDomain: "ngolay-project.firebaseapp.com",
  projectId: "ngolay-project",
  storageBucket: "ngolay-project.appspot.com",
  messagingSenderId: "236457585222",
  appId: "1:236457585222:web:9133bb46a97ef678d23847",
  measurementId: "G-34BC1Z5PPM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------------------
// Wishlist cache
// ---------------------------
let wishlistIds = [];

// ---------------------------
// DOMContentLoaded
// ---------------------------
document.addEventListener("DOMContentLoaded", async () => { 
  const categoryHeading = document.querySelector('section h2');
  let category = 'Clothes'; // default

  if (categoryHeading) {
    category = categoryHeading.textContent.trim();
    category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  const dashboard = document.querySelector('.product-grid');

  // Load wishlist once
  const wishSnapshot = await getDocs(collection(db, "wishlist"));
  wishlistIds = wishSnapshot.docs.map(d => d.data().id || d.id);

  // Load products
  const productsCol = collection(db, "products");
  const snapshot = await getDocs(productsCol);
  const allProducts = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  let products = allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());

  if (products.length === 0) {
    dashboard.innerHTML = '<p style="text-align:center;">No products in this category yet.</p>';
  } else {
    displayProducts(products, dashboard);
  }

  // ---------------------------
  // SEARCH FILTER
  // ---------------------------
  const searchBarInput = document.querySelector("#search-bar input");
  if (searchBarInput) {
    searchBarInput.addEventListener("input", e => {
      const query = e.target.value.toLowerCase();
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(query))
      );
      displayProducts(filtered, dashboard);
    });
  }
});

// ---------------------------
// Reusable function to render product cards (wishlist style)
// ---------------------------
function displayProducts(products, dashboard) {
  dashboard.innerHTML = '';

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);

    const imgSrc = product.imageBase64
      ? `data:image/jpeg;base64,${product.imageBase64}` 
      : (product.images && product.images[0]) || "placeholder.jpg";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${product.name}" class="product-link">
      <h3>${product.name}</h3>
      <p>Nu. ${product.price.toFixed(2)}</p>
      <div class="product-actions">
        <a href="#" class="cart-btn">🛒</a>
        <a href="#" class="wishlist-btn">${wishlistIds.includes(product.id) ? '♥' : '♡'}</a>
      </div>
    `;

    dashboard.appendChild(card);

    // Product detail click
    card.querySelector('.product-link').addEventListener('click', e => {
      e.preventDefault();
      window.location.href = `product_detail.html?id=${product.id}`;
    });

    // Add to Cart
    card.querySelector('.cart-btn').addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      await addDoc(collection(db, "cart"), { ...product, quantity: 1 });
      alert(`${product.name} added to cart!`);
    });

    // Add / Remove Wishlist
    const wishlistBtn = card.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();

      const docRef = doc(db, "wishlist", product.id);

      if (wishlistIds.includes(product.id)) {
        await deleteDoc(docRef);
        wishlistBtn.textContent = '♡';
        wishlistIds = wishlistIds.filter(id => id !== product.id);
        alert(`${product.name} removed from wishlist!`);
      } else {
        await addDoc(collection(db, "wishlist"), { ...product, id: product.id });
        wishlistBtn.textContent = '♥';
        wishlistIds.push(product.id);
        alert(`${product.name} added to wishlist!`);
      }
    });
  });
}