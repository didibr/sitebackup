
  //DOCUMENT HEADER PROJECT SEARCH
  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;  
    searchInput.addEventListener("input", function () {
      const search = this.value.toLowerCase();
      const cards = document.querySelectorAll(".project-card");
  
      cards.forEach(card => {
        const title = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
        const description = card.querySelector(".card-text")?.textContent.toLowerCase() || "";
  
        if (title.includes(search) || description.includes(search)) {
          card.parentElement.style.display = "block";
        } else {
          card.parentElement.style.display = "none";
        }
      });
    });
  });
  

  
 