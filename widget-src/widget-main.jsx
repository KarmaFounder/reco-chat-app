import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

console.log("Widget Main: Starting...");


// Entry point for the Shopify Theme App Extension widget.
// This expects the Liquid block to render a container like:
// <div id="reco-chat-root" data-product-id="{{ product.id }}" data-product-handle="{{ product.handle }}" data-product-title="{{ product.title }}"></div>

const container = document.getElementById("reco-chat-root");
console.log("Widget Main: Container found?", !!container);

if (container) {
  const {
    productId,
    productHandle,
    productTitle,
    productName,
    productImageUrl,
    productPrice,
    productType,
    inputHeader,
    showHeader,
    shopDomain,
  } = container.dataset;

  const resolvedProductName = productName || productTitle || "Seamless Sculpt Brief Bodysuit";

  const root = ReactDOM.createRoot(container);
  root.render(
    <App
      embedMode={true}
      initialWidgetMode={false}
      productName={resolvedProductName}
      productImageUrl={productImageUrl}
      productPrice={productPrice}
      productType={productType}
      disableProductFilter={true}
      // productId/productHandle are reserved for future Convex filtering wiring
      // and are not yet used inside App.
      productId={productId}
      productHandle={productHandle}
      inputHeader={inputHeader}
      showHeader={showHeader === "true"}
      shopDomain={shopDomain}
    />
  );
}
