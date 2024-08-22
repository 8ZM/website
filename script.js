// add class active to header on scroll
let header = document.querySelector("header")
window.onscroll = function () {
    if (this.scrollY >= 50) {
        header.classList.add("active")
    }
    else {
        header.classList.remove("active")
    }
}

// Responsive
let nav_links = document.getElementById("links");
function open_close_menu() {
    nav_links.classList.toggle("active")
}

if (document.URL.includes("404")) {
    window.location.href = "/error.html";
}