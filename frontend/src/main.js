import { drawNetwork } from "./network.js";

fetch("http://localhost:5000/api/network")
  .then((r) => r.json())
  .then((data) => {
    console.log("nodes:", data.nodes.length, "links:", data.links.length);
    drawNetwork(document.querySelector("#graph"), data);
  })
  .catch((err) => console.error("Could not load network:", err));