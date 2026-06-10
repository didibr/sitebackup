const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const nlp = require("compromise");
const xml2js = require("xml2js");
const https = require("https");
const CACHE = {};
const PENDING = {};
const CACHE_TIME = 1000 * 60 * 30; //30 min - clean news cache by topic
const MAX_ITEMS = 10;
const MAX_REDIRECTS = 5;
const IMAGE_CACHE_DIR = "/www/pages/19/cache/";
const IMAGE_BASE_URL = "https://didisoftwares.ddns.net/19/cache/";
const IMAGE_FILE_TTL = 1000 * 60 * 60 * 4; //4 Hours - update image topic
const PIXABAY_KEYS = [
    "55936765-6c9edef5cb6cec27cbd506584",
    "55949307-5e5efcca9e7ddf5db7563b834"
];
let PIXABAY_INDEX = 0;
const defaultIdiom = "en-US";
const defaultLang = "US";
const agent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000,
    maxSockets: 20,
    maxFreeSockets: 10,
    timeout: 15000
});
let defaultNews = null;

class Page19 {
    constructor() {
        if (!fs.existsSync(IMAGE_CACHE_DIR)) {
            fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
        }
        this.cleanupImageCache();
        setInterval(() => {
            try {
                this.cleanupUnusedImages();
            } catch (e) {
                //console.error("cleanupUnusedImages:", e);
            }
        }, CACHE_TIME);
    }

    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    cleanText(text, maxLength = 0) {
        if (!text) return "";
        let cleaned = text
            .replace(/<!\[CDATA\[|\]\]>/g, "")
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/gi, " ")
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .replace(/&apos;/gi, "'")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&[a-z0-9#]+;/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        if (maxLength > 0 && cleaned.length > maxLength) {
            cleaned = cleaned.substring(0, maxLength).trim() + "...";
        }
        return cleaned;
    }

    fetchJSON(url) {
        return new Promise((resolve, reject) => {
            const req = https.get(url, {
                agent,
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json",
                    "Connection": "keep-alive"
                },
                timeout: 10000
            }, res => {
                let data = "";
                res.setEncoding("utf8");
                res.on("data", c => data += c);
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Timeout"));
            });
            req.on("error", reject);
        });
    }

    fetchURL(url, redirects = 0) {
        return new Promise((resolve, reject) => {
            if (redirects > MAX_REDIRECTS) {
                return reject(new Error("Too many redirects"));
            }
            const req = https.get(url, {
                agent,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Connection": "keep-alive"
                },
                timeout: 10000
            }, response => {
                const location = response.headers.location;
                if ([301, 302, 303, 307, 308].includes(response.statusCode) && location) {
                    response.resume();
                    let next = location;
                    if (next.startsWith("/")) {
                        const u = new URL(url);
                        next = u.origin + next;
                    }
                    return resolve(this.fetchURL(next, redirects + 1));
                }
                let data = "";
                response.setEncoding("utf8");
                response.on("data", chunk => data += chunk);
                response.on("end", () => {
                    resolve({
                        html: data,
                        finalUrl: response.responseUrl || url
                    });
                });
            });
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Timeout"));
            });
            req.on("error", reject);
        });
    }

    nextPixabayKey() {
        if (!PIXABAY_KEYS.length) return null;
        const key = PIXABAY_KEYS[PIXABAY_INDEX];
        PIXABAY_INDEX++;
        if (PIXABAY_INDEX >= PIXABAY_KEYS.length) {
            PIXABAY_INDEX = 0;
        }
        return key;
    }

    getPixabayLang(idioma) {
        const map = {
            "pt": "pt",
            "pt-BR": "pt",
            "en": "en",
            "en-US": "en",
            "es": "es",
            "fr": "fr",
            "de": "de",
            "it": "it",
            "nl": "nl",
            "pl": "pl",
            "ru": "ru",
            "ja": "ja",
            "ko": "ko"
        };
        return map[idioma] || idioma.split("-")[0] || "en";
    }

    downloadImage(url) {
        return new Promise((resolve, reject) => {
            https.get(url, {
                agent,
                headers: {
                    "User-Agent": "Mozilla/5.0"
                },
                timeout: 10000
            }, res => {
                if (res.statusCode !== 200) {
                    return reject(new Error("Image status " + res.statusCode));
                }
                const chunks = [];
                res.on("data", c => chunks.push(c));
                res.on("end", () => {
                    const buffer = Buffer.concat(chunks);
                    const contentType = res.headers["content-type"] || "image/jpeg";
                    resolve({
                        buffer,
                        contentType
                    });
                });
            }).on("error", reject);
        });
    }

    getExtensionFromContentType(contentType = "") {
        if (contentType.includes("png")) return ".png";
        if (contentType.includes("webp")) return ".webp";
        if (contentType.includes("gif")) return ".gif";
        return ".jpg";
    }

    getImageHash(topic) {
        return crypto
            .createHash("md5")
            .update(topic.toLowerCase().trim())
            .digest("hex");
    }

    getCachedImageByTopic(topic) {
        try {
            const hash = this.getImageHash(topic);
            const file = fs.readdirSync(IMAGE_CACHE_DIR)
                .find(f => f.startsWith(hash));
            if (!file) return null;
            const full = path.join(IMAGE_CACHE_DIR, file);
            if (!fs.existsSync(full)) return null;
            const stat = fs.statSync(full);
            if (Date.now() - stat.mtimeMs > IMAGE_FILE_TTL) {
                try {
                    fs.unlinkSync(full);
                } catch (e) { }
                return null;
            }
            return {
                url: IMAGE_BASE_URL + file,
                file
            };
        } catch (e) {
            return null;
        }
    }

    async saveImageToCache(imageUrl, topic = "") {
        try {
            const hash = this.getImageHash(topic);
            const old = fs.readdirSync(IMAGE_CACHE_DIR)
                .find(f => f.startsWith(hash));
            if (old) {
                return {
                    url: IMAGE_BASE_URL + old,
                    file: old
                };
            }
            const img = await this.downloadImage(imageUrl);
            const ext = this.getExtensionFromContentType(img.contentType);
            const filename = hash + ext;
            const filepath = path.join(IMAGE_CACHE_DIR, filename);
            fs.writeFileSync(filepath, img.buffer);
            return {
                url: IMAGE_BASE_URL + filename,
                file: filename
            };
        } catch (e) {
            return {
                url: `https://picsum.photos/seed/${encodeURIComponent(topic)}/1280/720`,
                file: null
            };
        }
    }

    cleanupImageCache() {
        try {
            const files = fs.readdirSync(IMAGE_CACHE_DIR);
            //const now = Date.now();
            for (const file of files) {
                const full = path.join(IMAGE_CACHE_DIR, file);
                try {
                    //const stat = fs.statSync(full);
                    //if (now - stat.mtimeMs > IMAGE_FILE_TTL) {
                    fs.unlinkSync(full);
                    // }
                } catch (e) { }
            }
        } catch (e) { }
    }

    cleanupUnusedImages() {
        try {
            const used = new Set();
            for (const key in CACHE) {
                const cache = CACHE[key];
                if (!cache) continue;
                if (Date.now() - cache.time > CACHE_TIME) continue;
                for (const news of cache.data || []) {
                    if (news.imageFile) {
                        used.add(news.imageFile);
                    }
                }
            }
            if (defaultNews && Date.now() - defaultNews.time < CACHE_TIME) {
                for (const news of defaultNews.noticias || []) {
                    if (news.imageFile) {
                        used.add(news.imageFile);
                    }
                }
            }
            const files = fs.readdirSync(IMAGE_CACHE_DIR);
            for (const file of files) {
                if (!used.has(file)) {
                    try {
                        fs.unlinkSync(path.join(IMAGE_CACHE_DIR, file));
                    } catch (e) { }
                }
            }
        } catch (e) {
            //console.error("cleanupUnusedImages", e);
        }
    }

    simplifyTopic(topic) {
        topic = topic
            .replace(/[-|].*/, "")
            .trim();
        const doc = nlp(topic);
        const people = doc.people().out("array");
        const places = doc.places().out("array");
        const orgs = doc.organizations().out("array");
        const topics = doc.topics().out("array");
        if (people.length) return people[0];
        if (orgs.length) return orgs[0];
        if (topics.length) return topics.slice(0, 2).join(" ");
        if (places.length) return places[0];
        return topic
            .split(" ")
            .slice(0, 3)
            .join(" ");
    }

    async getPixabayImage(topic, idioma = defaultIdiom, local = defaultLang) {
        const imageTopic = this.simplifyTopic(topic);
        const existing = this.getCachedImageByTopic(imageTopic);
        if (existing) {
            return existing;
        }
        const variants = [
            imageTopic,
            imageTopic + " photo",
            imageTopic + " wallpaper",
            imageTopic + " background",
            imageTopic + " hd",
            imageTopic + " news",
            imageTopic + " official"
        ];
        const lang = this.getPixabayLang(idioma);
        for (let i = 0; i < PIXABAY_KEYS.length; i++) {
            try {
                const key = this.nextPixabayKey();
                if (!key) break;
                const query = variants[
                    Math.floor(Math.random() * variants.length)
                ];
                const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=20&safesearch=true&lang=${lang}`;
                const json = await this.fetchJSON(url);
                if (
                    json &&
                    Array.isArray(json.hits) &&
                    json.hits.length
                ) {
                    const urls = json.hits
                        .map(h => h.webformatURL || h.largeImageURL || h.previewURL || null)
                        .filter(Boolean);
                    if (urls.length) {
                        const randomUrl = urls[
                            Math.floor(Math.random() * urls.length)
                        ];
                        const localImage = await this.saveImageToCache(
                            randomUrl,
                            imageTopic
                        );
                        return localImage;
                    }
                }
            } catch (e) { }
            await this.delay(250);
        }
        return {
            url: `https://picsum.photos/seed/${encodeURIComponent(imageTopic + Date.now())}/1280/720`,
            file: null
        };
    }

    async getNews(topic = "", idioma = defaultIdiom, local = defaultLang) {
        const cacheKey = `${topic}-${idioma}-${local}`;
        if (
            CACHE[cacheKey] &&
            (Date.now() - CACHE[cacheKey].time < CACHE_TIME)
        ) {
            return CACHE[cacheKey].data;
        }
        if (PENDING[cacheKey]) {
            return PENDING[cacheKey];
        }
        let url = "";
        if (topic) {
            url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=${idioma}&gl=${local}&ceid=${local}:${idioma}`;
        } else {
            url = `https://news.google.com/rss?hl=${idioma}&gl=${local}&ceid=${local}:${idioma}`;
        }
        PENDING[cacheKey] = new Promise(async (resolve, reject) => {
            try {
                const result = await this.fetchURL(url, 3);
                const xml = result.html;
                if (!xml.includes("<rss") && !xml.includes("<feed")) {
                    throw new Error("Invalid RSS");
                }
                const parsed = await xml2js.parseStringPromise(xml, {
                    explicitArray: true,
                    mergeAttrs: true,
                    trim: true
                });
                const items = parsed?.rss?.channel?.[0]?.item || [];
                const lista = items.slice(0, MAX_ITEMS);
                const noticias = [];
                for (const item of lista) {
                    const titulo = this.cleanText(item.title?.[0] || "", 72);
                    const link = item.link?.[0] || "";
                    const descricao = this.cleanText(item.description?.[0] || "", 190);
                    const imagem = await this.getPixabayImage(
                        titulo || topic,
                        idioma,
                        local
                    );
                    noticias.push({
                        titulo,
                        link,
                        data: item.pubDate?.[0] || "",
                        descricao,
                        imagem: imagem.url,
                        imageFile: imagem.file
                    });
                    await this.delay(150);
                }
                CACHE[cacheKey] = {
                    time: Date.now(),
                    data: noticias
                };
                delete PENDING[cacheKey];
                resolve(noticias);
            } catch (e) {
                delete PENDING[cacheKey];
                reject(e);
            }
        });
        return PENDING[cacheKey];
    }

    sendJSON(res, status, data) {
        if (res.writableEnded) return;
        res.writeHead(status, {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Connection": "keep-alive"
        });
        res.end(JSON.stringify(data));
    }

    OnHttpRequest(server, req, res) {
        if (req.url !== "/gerar-noticia") {
            return false;
        }
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return true;
        }
        if (req.method !== "POST") {
            this.sendJSON(res, 405, {
                error: "Method not allowed"
            });
            return true;
        }
        server.WaiToCLOSE(true);
        let body = "";
        req.on("data", chunk => {
            body += chunk;
            if (body.length > 1024 * 1024) {
                req.destroy();
            }
        });
        req.on("end", async () => {
            try {
                const data = JSON.parse(body || "{}");
                if (data.prompt !== "NEWS") {
                    server.WaiToCLOSE(false);
                    return this.sendJSON(res, 400, {
                        error: "Prompt inválido"
                    });
                }
                const topic = (data.topic || "").trim().slice(0, 100);
                const idioma = (data.idioma || defaultIdiom).trim();
                const local = (data.local || defaultLang).trim();
                const first = (data.first || 0);
                server.WaiToCLOSE(false);
                if (
                    first === 1 &&
                    defaultNews &&
                    (Date.now() - defaultNews.time < CACHE_TIME)
                ) {
                    this.sendJSON(res, 200, {
                        status: "ok",
                        total: defaultNews.noticias.length,
                        news: defaultNews.noticias
                    });
                    return true;
                }
                const noticias = await this.getNews(
                    topic,
                    idioma,
                    local
                );
                if (
                    !defaultNews ||
                    (Date.now() - defaultNews.time > CACHE_TIME)
                ) {
                    defaultNews = {
                        noticias,
                        time: Date.now()
                    };
                }
                this.sendJSON(res, 200, {
                    status: "ok",
                    total: noticias.length,
                    news: noticias
                });
            } catch (e) {
                //console.error("NEWS ERROR:", e);
                server.WaiToCLOSE(false);
                this.sendJSON(res, 500, {
                    error: "Erro interno",
                    details: e.message
                });
            }
        });
        req.on("error", e => {
            //console.error("REQ ERROR:", e);
            server.WaiToCLOSE(false);
            this.sendJSON(res, 500, {
                error: "Request error"
            });
        });
        return true;
    }
}
module.exports = new Page19();