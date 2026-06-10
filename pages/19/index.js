let swiper = null;
let fisrtime = 1;
let loadingLock = false;

function hideMiniSearch() {
	document.getElementById("miniInput").blur();
	document.querySelector(".mini-search button").blur();
}

function getDocumentHeight() {
	return Math.max(
		document.body.scrollHeight,
		document.body.offsetHeight,
		document.documentElement.clientHeight,
		document.documentElement.scrollHeight,
		document.documentElement.offsetHeight
	);
}

function showLoading() {
	if (document.getElementById("newsLoading")) return;
	const loading = document.createElement("div");
	loading.id = "newsLoading";
	loading.innerHTML = `
        <div class="news-loading-box">
            <div class="news-spinner"></div>
            <div class="news-loading-text">
                Loading News...
            </div>
        </div>
    `;
	document.body.appendChild(loading);
}

function hideLoading() {
	const loading = document.getElementById("newsLoading");
	if (loading) {
		loading.remove();
	}
	loadingLock = false;
}

function getNews(topicSearc = "") {
	if (loadingLock) return;
	hideMiniSearch();
	loadingLock = true;
	showLoading();
	let topic = document.getElementById("topic").value;
	if (topicSearc !== "") topic = topicSearc;
	const idioma = "en-US";
	const local = "US";
	fetch("https://didisoftwares.ddns.net/gerar-noticia", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			prompt: "NEWS",
			topic,
			idioma,
			local,
			first: fisrtime,
			imageTime:"d"
		})
	})
		.then((res) => res.json())
		.then((data) => {
			//console.log("pop");
			window.RR = data.news;
			populate(data.news);
		})
		.catch((err) => {
			console.error(err);
		})
		.finally(() => {
			hideLoading();
		});
	fisrtime = 0;
}

function populate(news) {
	const dheight = getDocumentHeight();

	const slider = document.getElementById("slider");
	slider.innerHTML = "";
	news.forEach((n) => {
		const slide = document.createElement("div");
		slide.className = "swiper-slide";
		slide.innerHTML = `
    <div class="card">
        <div class="news-date">
            ${n.data || ""}
        </div>
        <img>
        <div class="info">
            <h2></h2>
            <p></p>
            <button class="readmore">
                Read Article
            </button>
        </div>
    </div>
`;
		let titulo = n.titulo;
		let descricao = n.descricao;
		if (dheight < 376) {
			titulo = titulo.substring(0, 62);
			descricao = descricao.substring(0, 170);
		}
		slide.querySelector("img").src = n.imagem || "";
		slide.querySelector("img").crossOrigin = true;
		slide.querySelector("h2").textContent = n.titulo || "";
		slide.querySelector("p").textContent = n.descricao || "";
		slide.querySelector(".readmore").onclick = () => {
			window.open(n.link, "_blank", "noopener,noreferrer");
		};
		slider.appendChild(slide);
	});
	if (swiper) {
		swiper.destroy(true, true);
	}
	swiper = new Swiper(".mySwiper", {
		slidesPerView: 4,
		spaceBetween: 20,
		loop: true,
		grabCursor: true,
		centeredSlides: false,
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev"
		},
		breakpoints: {
			0: {
				slidesPerView: 1
			},
			700: {
				slidesPerView: 2
			},
			1000: {
				slidesPerView: 3
			},
			1300: {
				slidesPerView: 4
			}
		}
	});
}

function setupNewsCards() {
	const cards = document.querySelectorAll(".card");
	cards.forEach((card) => {
		let startX = 0;
		let startY = 0;
		let moved = false;
		card.addEventListener(
			"touchstart",
			(e) => {
				startX = e.touches[0].clientX;
				startY = e.touches[0].clientY;
				moved = false;
			},
			{ passive: true }
		);
		card.addEventListener(
			"touchmove",
			(e) => {
				let dx = Math.abs(e.touches[0].clientX - startX);
				let dy = Math.abs(e.touches[0].clientY - startY);
				if (dx > 15 || dy > 15) {
					moved = true;
				}
			},
			{ passive: true }
		);
		card.addEventListener("click", () => {
			cards.forEach((c) => c.classList.remove("selected"));
			card.classList.add("selected");
		});
		card.addEventListener(
			"touchend",
			() => {
				if (moved) {
					return;
				}
				cards.forEach((c) => c.classList.remove("selected"));
				card.classList.add("selected");
			},
			{ passive: true }
		);
	});
}

getNews();

async function abrirPopupCodigo(u,t="C�digo JS"){if(document.getElementById("pcss"))return;let c=document.createElement("style");c.id="pcss";c.innerHTML=".po{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}.pb{width:min(98vw,1100px);height:min(90vh,800px);background:#1e1e1e;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;border:1px solid #333}.pt{height:50px;background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 15px;font:600 15px Arial;border-bottom:1px solid #333;flex-shrink:0}.px{border:none;background:#ff4b4b;color:#fff;width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:18px}.pe{flex:1;overflow:hidden}.CodeMirror{height:100%!important;font-size:14px}";document.head.appendChild(c);async function s(x){return new Promise(r=>{let a=document.createElement("script");a.src=x,a.onload=r,document.head.appendChild(a)})}async function l(x){return new Promise(r=>{let a=document.createElement("link");a.rel="stylesheet",a.href=x,a.onload=r,document.head.appendChild(a)})}window.CodeMirror||(await l("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css"),await l("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css"),await s("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"),await s("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"));let txt="Error";try{txt=await fetch(u).then(r=>r.text())}catch(e){txt=e+""}let o=document.createElement("div");o.className="po",o.innerHTML=`<div class="pb"><div class="pt"><div>${t}</div><button class="px">?</button></div><div class="pe"><textarea id="pta"></textarea></div></div>`,document.body.appendChild(o);let f=()=>{o.remove(),c.remove()};o.querySelector(".px").onclick=f,o.onclick=e=>{e.target===o&&f()},document.addEventListener("keydown",function e(a){"Escape"===a.key&&(f(),document.removeEventListener("keydown",e))});CodeMirror.fromTextArea(o.querySelector("#pta"),{mode:"javascript",theme:"material-darker",lineNumbers:!0,readOnly:!0,tabSize:2,lineWrapping:!1}).setValue(txt)}

//ShowEditorCode
(() => {
	const b = document.createElement("button");
	b.innerHTML =
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 18 22 12"/><polyline points="8 6 2 6 2 12"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`';
	Object.assign(b.style, {
		position: "fixed",
		right: "66px",
		bottom: "6px",
		width: "52px",
		height: "52px",
		border: "0",
		borderRadius: "50%",
		background: "rgba(255,255,0,.35)",
		backdropFilter: "blur(8px)",
		color: "#fff",
		cursor: "pointer",
		zIndex: "99999",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		boxShadow: "0 4px 12px rgba(0,0,0,.3)"
	});
	b.querySelector("svg").style.width = "26px";
	b.onclick = () =>
		abrirPopupCodigo("https://didisoftwares.ddns.net/19/server.js",
  	"server.js");
	document.body.appendChild(b);
})();

//FullScreem
(() => {
	const b = document.createElement("button");
	b.innerHTML =
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';
	Object.assign(b.style, {
		position: "fixed",
		right: "6px",
		bottom: "6px",
		width: "52px",
		height: "52px",
		border: "0",
		borderRadius: "50%",
		background: "rgba(255,255,255,.35)",
		backdropFilter: "blur(8px)",
		color: "#fff",
		cursor: "pointer",
		zIndex: "99999",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		boxShadow: "0 4px 12px rgba(0,0,0,.3)"
	});
	b.querySelector("svg").style.width = "26px";
	b.onclick = () =>
		document.fullscreenElement
			? document.exitFullscreen()
			: document.documentElement.requestFullscreen();
	document.body.appendChild(b);
})();
