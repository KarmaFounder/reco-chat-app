import axios from 'axios';
import fs from 'fs';

// CONFIGURATION
const OKENDO_USER_ID = 'fd194de9-39a9-4961-b62b-fc96789a2231'; // Your Subscriber ID (from live vote URL)
const PRODUCT_ID = '8108827246639'; // Your "testing 123" Product ID
const OUTPUT_FILE = 'okendo_reviews_live.json';

async function fetchReviews() {
  console.log(`Fetching reviews for Product ID: ${PRODUCT_ID}...`);

  try {
    // Okendo widget internally calls: `${storeBaseUrl}/products/${productId}/reviews?...`
    const base = `https://api.okendo.io/v1/stores/${OKENDO_USER_ID}`;
    const url1 = `${base}/products/${PRODUCT_ID}/reviews?limit=100&orderBy=date+desc`;
    const url2 = `${base}/products/shopify-${PRODUCT_ID}/reviews?limit=100&orderBy=date+desc`;

    console.log(`Trying primary URL: ${url1}`);
    let response = await axios.get(url1);
    let data = response.data;

    // Fallback to /products/shopify-... if needed
    if (!data.reviews || data.reviews.length === 0) {
      console.log('Primary URL returned no reviews, trying Shopify-prefixed variant...');
      response = await axios.get(url2);
      data = response.data;
      console.log(`Secondary URL response keys:`, Object.keys(data || {}));
    }

    // Global reviews fallback (all reviews for this store)
    if (!data.reviews || data.reviews.length === 0) {
      const urlAll = `${base}/reviews?limit=100&orderBy=date+desc`;
      console.log('Product endpoints returned no reviews, trying global reviews URL:', urlAll);
      response = await axios.get(urlAll);
      data = response.data;
      console.log('Global reviews response keys:', Object.keys(data || {}));
    }

    if (!data.reviews || data.reviews.length === 0) {
      console.log('No reviews found via any API endpoint. (Store may be in preview mode or reviews not yet indexed).');
      console.log('Raw response keys:', Object.keys(data || {}));
      console.log('Raw response preview:', JSON.stringify(data, null, 2).slice(0, 1000));
      return;
    }

    console.log(`Found ${data.reviews.length} reviews.`);

    // Transform to our Convex format
    const formattedReviews = data.reviews.map(r => ({
      id: r.reviewId,
      external_id: r.reviewId,
      product: PRODUCT_ID,
      author_name: r.reviewer.displayName || "(Anonymous)",
      rating: r.rating,
      fit_feedback: r.attributes && r.attributes.find(a => a.label === "Fit") ? r.attributes.find(a => a.label === "Fit").value : "",
      review_body: r.body,
      created_at: r.dateCreated
    }));

    // Save for inspection
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(formattedReviews, null, 2));
    console.log(`Saved ${formattedReviews.length} reviews to ${OUTPUT_FILE}`);
    
    console.log('\nSample Review:', formattedReviews[0]);

  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
    }
  }
}

fetchReviews();