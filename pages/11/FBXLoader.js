import * as THREE from 'three';
const {AmbientLight, AnimationClip, Bone,BufferGeometry, ClampToEdgeWrapping, Color,/*ColorManagement*/DirectionalLight, EquirectangularReflectionMapping, Euler,FileLoader, Float32BufferAttribute, Group,Line,LineBasicMaterial, Loader,LoaderUtils, MathUtils,Matrix3,Matrix4,Mesh,MeshLambertMaterial, MeshPhongMaterial, NumberKeyframeTrack, Object3D,PerspectiveCamera, PointLight, PropertyBinding, Quaternion, QuaternionKeyframeTrack, RepeatWrapping /*SRGBColorSpace*/, ShapeUtils, Skeleton,SkinnedMesh, SpotLight,Texture,TextureLoader, Uint16BufferAttribute, Vector2,Vector3,Vector4,VectorKeyframeTrack, Curve
	} = THREE;


let fbxTree;
let connections;
let sceneGraph;

const SRGBColorSpace = '';
var ColorManagement = {
	colorSpaceToWorking: function (xColor, xSpace) {
		return xColor;
	}
}

//fflate
var ch2 = {}, wk = function (r, e, n, t, f) { var a = new Worker(ch2[e] || (ch2[e] = URL.createObjectURL(new Blob([r + ';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'], { type: "text/javascript" })))); return a.onmessage = function (r) { var e = r.data, n = e.$e$; if (n) { var t = Error(n[0]); t.code = n[1], t.stack = n[2], f(t, null) } else f(null, e) }, a.postMessage(n, t), a }, u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array, fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]), fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]), clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), freb = function (r, e) { for (var n = new u16(31), t = 0; t < 31; ++t)n[t] = e += 1 << r[t - 1]; for (var f = new i32(n[30]), t = 1; t < 30; ++t)for (var a = n[t]; a < n[t + 1]; ++a)f[a] = a - n[t] << 5 | t; return { b: n, r: f } }, _a = freb(fleb, 2), fl = _a.b, revfl = _a.r; fl[28] = 258, revfl[258] = 28; for (var _b = freb(fdeb, 0), fd = _b.b, revfd = _b.r, rev = new u16(32768), i = 0; i < 32768; ++i) { var r = (43690 & i) >> 1 | (21845 & i) << 1; r = (61680 & (r = (52428 & r) >> 2 | (13107 & r) << 2)) >> 4 | (3855 & r) << 4, rev[i] = ((65280 & r) >> 8 | (255 & r) << 8) >> 1 } for (var hMap = function (r, e, n) { for (var t, f = r.length, a = 0, _ = new u16(e); a < f; ++a)r[a] && ++_[r[a] - 1]; var l = new u16(e); for (a = 1; a < e; ++a)l[a] = l[a - 1] + _[a - 1] << 1; if (n) { t = new u16(1 << e); var o = 15 - e; for (a = 0; a < f; ++a)if (r[a]) for (var $ = a << 4 | r[a], u = e - r[a], c = l[r[a] - 1]++ << u, s = c | (1 << u) - 1; c <= s; ++c)t[rev[c] >> o] = $ } else for (a = 0, t = new u16(f); a < f; ++a)r[a] && (t[a] = rev[l[r[a] - 1]++] >> 15 - r[a]); return t }, flt = new u8(288), i = 0; i < 144; ++i)flt[i] = 8; for (var i = 144; i < 256; ++i)flt[i] = 9; for (var i = 256; i < 280; ++i)flt[i] = 7; for (var i = 280; i < 288; ++i)flt[i] = 8; for (var fdt = new u8(32), i = 0; i < 32; ++i)fdt[i] = 5; var flm = hMap(flt, 9, 0), flrm = hMap(flt, 9, 1), fdm = hMap(fdt, 5, 0), fdrm = hMap(fdt, 5, 1), max = function (r) { for (var e = r[0], n = 1; n < r.length; ++n)r[n] > e && (e = r[n]); return e }, bits = function (r, e, n) { var t = e / 8 | 0; return (r[t] | r[t + 1] << 8) >> (7 & e) & n }, bits16 = function (r, e) { var n = e / 8 | 0; return (r[n] | r[n + 1] << 8 | r[n + 2] << 16) >> (7 & e) }, shft = function (r) { return (r + 7) / 8 | 0 }, slc = function (r, e, n) { return (null == e || e < 0) && (e = 0), (null == n || n > r.length) && (n = r.length), new u8(r.subarray(e, n)) }; export var FlateErrorCode = { UnexpectedEOF: 0, InvalidBlockType: 1, InvalidLengthLiteral: 2, InvalidDistance: 3, StreamFinished: 4, NoStreamHandler: 5, InvalidHeader: 6, NoCallback: 7, InvalidUTF8: 8, ExtraFieldTooLong: 9, InvalidDate: 10, FilenameTooLong: 11, StreamFinishing: 12, InvalidZipData: 13, UnknownCompressionMethod: 14 }; var ec = ["unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", , "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data"], err = function (r, e, n) { var t = Error(e || ec[r]); if (t.code = r, Error.captureStackTrace && Error.captureStackTrace(t, err), !n) throw t; return t }, inflt = function (r, e, n, t) { var f = r.length, a = t ? t.length : 0; if (!f || e.f && !e.l) return n || new u8(0); var _ = !n, l = _ || 2 != e.i, o = e.i; _ && (n = new u8(3 * f)); var $ = function (r) { var e = n.length; if (r > e) { var t = new u8(Math.max(2 * e, r)); t.set(n), n = t } }, u = e.f || 0, c = e.p || 0, s = e.b || 0, v = e.l, b = e.d, d = e.m, h = e.n, w = 8 * f; do { if (!v) { u = bits(r, c, 1); var g = bits(r, c + 1, 3); if (c += 3, g) { if (1 == g) v = flrm, b = fdrm, d = 9, h = 5; else if (2 == g) { var m = bits(r, c, 31) + 257, p = bits(r, c + 10, 15) + 4, y = m + bits(r, c + 5, 31) + 1; c += 14; for (var k = new u8(y), x = new u8(19), z = 0; z < p; ++z)x[clim[z]] = bits(r, c + 3 * z, 7); c += 3 * p; for (var M = max(x), F = (1 << M) - 1, S = hMap(x, M, 1), z = 0; z < y;) { var T = S[bits(r, c, F)]; c += 15 & T; var I = T >> 4; if (I < 16) k[z++] = I; else { var O = 0, C = 0; for (16 == I ? (C = 3 + bits(r, c, 3), c += 2, O = k[z - 1]) : 17 == I ? (C = 3 + bits(r, c, 7), c += 3) : 18 == I && (C = 11 + bits(r, c, 127), c += 7); C--;)k[z++] = O } } var A = k.subarray(0, m), L = k.subarray(m); d = max(A), h = max(L), v = hMap(A, d, 1), b = hMap(L, h, 1) } else err(1) } else { var I = shft(c) + 4, E = r[I - 4] | r[I - 3] << 8, U = I + E; if (U > f) { o && err(0); break } l && $(s + E), n.set(r.subarray(I, U), s), e.b = s += E, e.p = c = 8 * U, e.f = u; continue } if (c > w) { o && err(0); break } } l && $(s + 131072); for (var D = (1 << d) - 1, q = (1 << h) - 1, j = c; ; j = c) { var O = v[bits16(r, c) & D], H = O >> 4; if ((c += 15 & O) > w) { o && err(0); break } if (O || err(2), H < 256) n[s++] = H; else if (256 == H) { j = c, v = null; break } else { var N = H - 254; if (H > 264) { var z = H - 257, B = fleb[z]; N = bits(r, c, (1 << B) - 1) + fl[z], c += B } var R = b[bits16(r, c) & q], Z = R >> 4; R || err(3), c += 15 & R; var L = fd[Z]; if (Z > 3) { var B = fdeb[Z]; L += bits16(r, c) & (1 << B) - 1, c += B } if (c > w) { o && err(0); break } l && $(s + 131072); var G = s + N; if (s < L) { var J = a - L, K = Math.min(L, G); for (J + s < 0 && err(3); s < K; ++s)n[s] = t[J + s] } for (; s < G; ++s)n[s] = n[s - L] } } e.l = v, e.p = j, e.b = s, e.f = u, v && (u = 1, e.m = d, e.d = b, e.n = h) } while (!u); return s != n.length && _ ? slc(n, 0, s) : n.subarray(0, s) }, wbits = function (r, e, n) { n <<= 7 & e; var t = e / 8 | 0; r[t] |= n, r[t + 1] |= n >> 8 }, wbits16 = function (r, e, n) { n <<= 7 & e; var t = e / 8 | 0; r[t] |= n, r[t + 1] |= n >> 8, r[t + 2] |= n >> 16 }, hTree = function (r, e) { for (var n = [], t = 0; t < r.length; ++t)r[t] && n.push({ s: t, f: r[t] }); var f = n.length, a = n.slice(); if (!f) return { t: et, l: 0 }; if (1 == f) { var _ = new u8(n[0].s + 1); return _[n[0].s] = 1, { t: _, l: 1 } } n.sort(function (r, e) { return r.f - e.f }), n.push({ s: -1, f: 25001 }); var l = n[0], o = n[1], $ = 0, u = 1, c = 2; for (n[0] = { s: -1, f: l.f + o.f, l: l, r: o }; u != f - 1;)l = n[n[$].f < n[c].f ? $++ : c++], o = n[$ != u && n[$].f < n[c].f ? $++ : c++], n[u++] = { s: -1, f: l.f + o.f, l: l, r: o }; for (var s = a[0].s, t = 1; t < f; ++t)a[t].s > s && (s = a[t].s); var v = new u16(s + 1), b = ln(n[u - 1], v, 0); if (b > e) { var t = 0, d = 0, h = b - e, w = 1 << h; for (a.sort(function (r, e) { return v[e.s] - v[r.s] || r.f - e.f }); t < f; ++t) { var g = a[t].s; if (v[g] > e) d += w - (1 << b - v[g]), v[g] = e; else break } for (d >>= h; d > 0;) { var m = a[t].s; v[m] < e ? d -= 1 << e - v[m]++ - 1 : ++t } for (; t >= 0 && d; --t) { var p = a[t].s; v[p] == e && (--v[p], ++d) } b = e } return { t: new u8(v), l: b } }, ln = function (r, e, n) { return -1 == r.s ? Math.max(ln(r.l, e, n + 1), ln(r.r, e, n + 1)) : e[r.s] = n }, lc = function (r) { for (var e = r.length; e && !r[--e];); for (var n = new u16(++e), t = 0, f = r[0], a = 1, _ = function (r) { n[t++] = r }, l = 1; l <= e; ++l)if (r[l] == f && l != e) ++a; else { if (!f && a > 2) { for (; a > 138; a -= 138)_(32754); a > 2 && (_(a > 10 ? a - 11 << 5 | 28690 : a - 3 << 5 | 12305), a = 0) } else if (a > 3) { for (_(f), --a; a > 6; a -= 6)_(8304); a > 2 && (_(a - 3 << 5 | 8208), a = 0) } for (; a--;)_(f); a = 1, f = r[l] } return { c: n.subarray(0, t), n: e } }, clen = function (r, e) { for (var n = 0, t = 0; t < e.length; ++t)n += r[t] * e[t]; return n }, wfblk = function (r, e, n) { var t = n.length, f = shft(e + 2); r[f] = 255 & t, r[f + 1] = t >> 8, r[f + 2] = 255 ^ r[f], r[f + 3] = 255 ^ r[f + 1]; for (var a = 0; a < t; ++a)r[f + a + 4] = n[a]; return (f + 4 + t) * 8 }, wblk = function (r, e, n, t, f, a, _, l, o, $, u) { wbits(e, u++, n), ++f[256]; for (var c, s, v, b, d = hTree(f, 15), h = d.t, w = d.l, g = hTree(a, 15), m = g.t, p = g.l, y = lc(h), k = y.c, x = y.n, z = lc(m), M = z.c, F = z.n, S = new u16(19), T = 0; T < k.length; ++T)++S[31 & k[T]]; for (var T = 0; T < M.length; ++T)++S[31 & M[T]]; for (var I = hTree(S, 7), O = I.t, C = I.l, A = 19; A > 4 && !O[clim[A - 1]]; --A); var L = $ + 5 << 3, E = clen(f, flt) + clen(a, fdt) + _, U = clen(f, h) + clen(a, m) + _ + 14 + 3 * A + clen(S, O) + 2 * S[16] + 3 * S[17] + 7 * S[18]; if (o >= 0 && L <= E && L <= U) return wfblk(e, u, r.subarray(o, o + $)); if (wbits(e, u, 1 + (U < E)), u += 2, U < E) { c = hMap(h, w, 0), s = h, v = hMap(m, p, 0), b = m; var D = hMap(O, C, 0); wbits(e, u, x - 257), wbits(e, u + 5, F - 1), wbits(e, u + 10, A - 4), u += 14; for (var T = 0; T < A; ++T)wbits(e, u + 3 * T, O[clim[T]]); u += 3 * A; for (var q = [k, M], j = 0; j < 2; ++j)for (var H = q[j], T = 0; T < H.length; ++T) { var N = 31 & H[T]; wbits(e, u, D[N]), u += O[N], N > 15 && (wbits(e, u, H[T] >> 5 & 127), u += H[T] >> 12) } } else c = flm, s = flt, v = fdm, b = fdt; for (var T = 0; T < l; ++T) { var B = t[T]; if (B > 255) { var N = B >> 18 & 31; wbits16(e, u, c[N + 257]), u += s[N + 257], N > 7 && (wbits(e, u, B >> 23 & 31), u += fleb[N]); var R = 31 & B; wbits16(e, u, v[R]), u += b[R], R > 3 && (wbits16(e, u, B >> 5 & 8191), u += fdeb[R]) } else wbits16(e, u, c[B]), u += s[B] } return wbits16(e, u, c[256]), u + s[256] }, deo = new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]), et = new u8(0), dflt = function (r, e, n, t, f, a) { var _ = a.z || r.length, l = new u8(t + _ + 5 * (1 + Math.ceil(_ / 7e3)) + f), o = l.subarray(t, l.length - f), $ = a.l, u = 7 & (a.r || 0); if (e) { u && (o[0] = a.r >> 3); for (var c = deo[e - 1], s = c >> 13, v = 8191 & c, b = (1 << n) - 1, d = a.p || new u16(32768), h = a.h || new u16(b + 1), w = Math.ceil(n / 3), g = 2 * w, m = function (e) { return (r[e] ^ r[e + 1] << w ^ r[e + 2] << g) & b }, p = new i32(25e3), y = new u16(288), k = new u16(32), x = 0, z = 0, M = a.i || 0, F = 0, S = a.w || 0, T = 0; M + 2 < _; ++M) { var I = m(M), O = 32767 & M, C = h[I]; if (d[O] = C, h[I] = O, S <= M) { var A = _ - M; if ((x > 7e3 || F > 24576) && (A > 423 || !$)) { u = wblk(r, o, 0, p, y, k, z, F, T, M - T, u), F = x = z = 0, T = M; for (var L = 0; L < 286; ++L)y[L] = 0; for (var L = 0; L < 30; ++L)k[L] = 0 } var E = 2, U = 0, D = v, q = O - C & 32767; if (A > 2 && I == m(M - q)) for (var j = Math.min(s, A) - 1, H = Math.min(32767, M), N = Math.min(258, A); q <= H && --D && O != C;) { if (r[M + E] == r[M + E - q]) { for (var B = 0; B < N && r[M + B] == r[M + B - q]; ++B); if (B > E) { if (E = B, U = q, B > j) break; for (var R = Math.min(q, B - 2), Z = 0, L = 0; L < R; ++L) { var G = M - q + L & 32767, J = d[G], K = G - J & 32767; K > Z && (Z = K, C = G) } } } C = d[O = C], q += O - C & 32767 } if (U) { p[F++] = 268435456 | revfl[E] << 18 | revfd[U]; var P = 31 & revfl[E], Q = 31 & revfd[U]; z += fleb[P] + fdeb[Q], ++y[257 + P], ++k[Q], S = M + E, ++x } else p[F++] = r[M], ++y[r[M]] } } for (M = Math.max(M, S); M < _; ++M)p[F++] = r[M], ++y[r[M]]; u = wblk(r, o, $, p, y, k, z, F, T, M - T, u), $ || (a.r = 7 & u | o[u / 8 | 0] << 3, u -= 7, a.h = h, a.p = d, a.i = M, a.w = S) } else { for (var M = a.w || 0; M < _ + $; M += 65535) { var V = M + 65535; V >= _ && (o[u / 8 | 0] = $, V = _), u = wfblk(o, u + 1, r.subarray(M, V)) } a.i = _ } return slc(l, 0, t + shft(u) + f) }, crct = function () { for (var r = new Int32Array(256), e = 0; e < 256; ++e) { for (var n = e, t = 9; --t;)n = (1 & n && -306674912) ^ n >>> 1; r[e] = n } return r }(), crc = function () { var r = -1; return { p: function (e) { for (var n = r, t = 0; t < e.length; ++t)n = crct[255 & n ^ e[t]] ^ n >>> 8; r = n }, d: function () { return ~r } } }, adler = function () { var r = 1, e = 0; return { p: function (n) { for (var t = r, f = e, a = 0 | n.length, _ = 0; _ != a;) { for (var l = Math.min(_ + 2655, a); _ < l; ++_)f += t += n[_]; t = (65535 & t) + 15 * (t >> 16), f = (65535 & f) + 15 * (f >> 16) } r = t, e = f }, d: function () { return (255 & (r %= 65521)) << 24 | (65280 & r) << 8 | (255 & (e %= 65521)) << 8 | e >> 8 } } }, dopt = function (r, e, n, t, f) { if (!f && (f = { l: 1 }, e.dictionary)) { var a = e.dictionary.subarray(-32768), _ = new u8(a.length + r.length); _.set(a), _.set(r, a.length), r = _, f.w = a.length } return dflt(r, null == e.level ? 6 : e.level, null == e.mem ? f.l ? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(r.length)))) : 20 : 12 + e.mem, n, t, f) }, mrg = function (r, e) { var n = {}; for (var t in r) n[t] = r[t]; for (var t in e) n[t] = e[t]; return n }, wcln = function (r, e, n) { for (var t = r(), f = r.toString(), a = f.slice(f.indexOf("[") + 1, f.lastIndexOf("]")).replace(/\s+/g, "").split(","), _ = 0; _ < t.length; ++_) { var l = t[_], o = a[_]; if ("function" == typeof l) { e += ";" + o + "="; var $ = l.toString(); if (l.prototype) { if (-1 != $.indexOf("[native code]")) { var u = $.indexOf(" ", 8) + 1; e += $.slice(u, $.indexOf("(", u)) } else for (var c in e += $, l.prototype) e += ";" + o + ".prototype." + c + "=" + l.prototype[c].toString() } else e += $ } else n[o] = l } return e }, ch = [], cbfs = function (r) { var e = []; for (var n in r) r[n].buffer && e.push((r[n] = new r[n].constructor(r[n])).buffer); return e }, wrkr = function (r, e, n, t) { if (!ch[n]) { for (var f = "", a = {}, _ = r.length - 1, l = 0; l < _; ++l)f = wcln(r[l], f, a); ch[n] = { c: wcln(r[_], f, a), e: a } } var o = mrg({}, ch[n].e); return wk(ch[n].c + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + e.toString() + "}", n, o, cbfs(o), t) }, bInflt = function () { return [u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gopt] }, bDflt = function () { return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf] }, gze = function () { return [gzh, gzhl, wbytes, crc, crct] }, guze = function () { return [gzs, gzl] }, zle = function () { return [zlh, wbytes, adler] }, zule = function () { return [zls] }, pbf = function (r) { return postMessage(r, [r.buffer]) }, gopt = function (r) { return r && { out: r.size && new u8(r.size), dictionary: r.dictionary } }, cbify = function (r, e, n, t, f, a) { var _ = wrkr(n, t, f, function (r, e) { _.terminate(), a(r, e) }); return _.postMessage([r, e], e.consume ? [r.buffer] : []), function () { _.terminate() } }, astrm = function (r) { return r.ondata = function (r, e) { return postMessage([r, e], [r.buffer]) }, function (e) { e.data.length ? (r.push(e.data[0], e.data[1]), postMessage([e.data[0].length])) : r.flush() } }, astrmify = function (r, e, n, t, f, a, _) { var l, o = wrkr(r, t, f, function (r, n) { r ? (o.terminate(), e.ondata.call(e, r)) : Array.isArray(n) ? 1 == n.length ? (e.queuedSize -= n[0], e.ondrain && e.ondrain(n[0])) : (n[1] && o.terminate(), e.ondata.call(e, r, n[0], n[1])) : _(n) }); o.postMessage(n), e.queuedSize = 0, e.push = function (r, n) { e.ondata || err(5), l && e.ondata(err(4, 0, 1), null, !!n), e.queuedSize += r.length, o.postMessage([r, l = n], [r.buffer]) }, e.terminate = function () { o.terminate() }, a && (e.flush = function () { o.postMessage([]) }) }, b2 = function (r, e) { return r[e] | r[e + 1] << 8 }, b4 = function (r, e) { return (r[e] | r[e + 1] << 8 | r[e + 2] << 16 | r[e + 3] << 24) >>> 0 }, b8 = function (r, e) { return b4(r, e) + 4294967296 * b4(r, e + 4) }, wbytes = function (r, e, n) { for (; n; ++e)r[e] = n, n >>>= 8 }, gzh = function (r, e) { var n = e.filename; if (r[0] = 31, r[1] = 139, r[2] = 8, r[8] = e.level < 2 ? 4 : 9 == e.level ? 2 : 0, r[9] = 3, 0 != e.mtime && wbytes(r, 4, Math.floor(new Date(e.mtime || Date.now()) / 1e3)), n) { r[3] = 8; for (var t = 0; t <= n.length; ++t)r[t + 10] = n.charCodeAt(t) } }, gzs = function (r) { (31 != r[0] || 139 != r[1] || 8 != r[2]) && err(6, "invalid gzip data"); var e = r[3], n = 10; 4 & e && (n += (r[10] | r[11] << 8) + 2); for (var t = (e >> 3 & 1) + (e >> 4 & 1); t > 0; t -= !r[n++]); return n + (2 & e) }, gzl = function (r) { var e = r.length; return (r[e - 4] | r[e - 3] << 8 | r[e - 2] << 16 | r[e - 1] << 24) >>> 0 }, gzhl = function (r) { return 10 + (r.filename ? r.filename.length + 1 : 0) }, zlh = function (r, e) { var n = e.level; if (r[0] = 120, r[1] = (0 == n ? 0 : n < 6 ? 1 : 9 == n ? 3 : 2) << 6 | (e.dictionary && 32), r[1] |= 31 - (r[0] << 8 | r[1]) % 31, e.dictionary) { var t = adler(); t.p(e.dictionary), wbytes(r, 2, t.d()) } }, zls = function (r, e) { return ((15 & r[0]) != 8 || r[0] >> 4 > 7 || (r[0] << 8 | r[1]) % 31) && err(6, "invalid zlib data"), (r[1] >> 5 & 1) == +!e && err(6, "invalid zlib data: " + (32 & r[1] ? "need" : "unexpected") + " dictionary"), (r[1] >> 3 & 4) + 2 }; function StrmOpt(r, e) { return "function" == typeof r && (e = r, r = {}), this.ondata = e, r }
function unzlibSync(data, opts) {
	return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
}

//nurbsUtil
function findSpan(l, e, t) { let n = t.length - l - 1; if (e >= t[n]) return n - 1; if (e <= t[l]) return l; let c = l, i = n, r = Math.floor((c + i) / 2); for (; e < t[r] || e >= t[r + 1];)e < t[r] ? i = r : c = r, r = Math.floor((c + i) / 2); return r } function calcBasisFunctions(l, e, t, n) { let c = [], i = [], r = []; c[0] = 1; for (let a = 1; a <= t; ++a) { i[a] = e - n[l + 1 - a], r[a] = n[l + a] - e; let $ = 0; for (let o = 0; o < a; ++o) { let f = r[o + 1], u = i[a - o], s = c[o] / (f + u); c[o] = $ + f * s, $ = u * s } c[a] = $ } return c } function calcBSplinePoint(l, e, t, n) { let c = findSpan(l, n, e), i = calcBasisFunctions(c, n, l, e), r = new Vector4(0, 0, 0, 0); for (let a = 0; a <= l; ++a) { let $ = t[c - l + a], o = i[a], f = $.w * o; r.x += $.x * f, r.y += $.y * f, r.z += $.z * f, r.w += $.w * o } return r } function calcBasisFunctionDerivatives(l, e, t, n, c) { let i = []; for (let r = 0; r <= t; ++r)i[r] = 0; let a = []; for (let $ = 0; $ <= n; ++$)a[$] = i.slice(0); let o = []; for (let f = 0; f <= t; ++f)o[f] = i.slice(0); o[0][0] = 1; let u = i.slice(0), s = i.slice(0); for (let _ = 1; _ <= t; ++_) { u[_] = e - c[l + 1 - _], s[_] = c[l + _] - e; let d = 0; for (let S = 0; S < _; ++S) { let v = s[S + 1], p = u[_ - S]; o[_][S] = v + p; let w = o[S][_ - 1] / o[_][S]; o[S][_] = d + v * w, d = p * w } o[_][_] = d } for (let y = 0; y <= t; ++y)a[0][y] = o[y][t]; for (let B = 0; B <= t; ++B) { let m = 0, F = 1, x = []; for (let z = 0; z <= t; ++z)x[z] = i.slice(0); x[0][0] = 1; for (let D = 1; D <= n; ++D) { let g = 0, h = B - D, P = t - D; B >= D && (x[F][0] = x[m][0] / o[P + 1][h], g = x[F][0] * o[h][P]); let R = h >= -1 ? 1 : -h, C = B - 1 <= P ? D - 1 : t - B; for (let I = R; I <= C; ++I)x[F][I] = (x[m][I] - x[m][I - 1]) / o[P + 1][h + I], g += x[F][I] * o[h + I][P]; B <= P && (x[F][D] = -x[m][D - 1] / o[P + 1][B], g += x[F][D] * o[B][P]), a[D][B] = g; let K = m; m = F, F = K } } let b = t; for (let N = 1; N <= n; ++N) { for (let U = 0; U <= t; ++U)a[N][U] *= b; b *= t - N } return a } function calcBSplineDerivatives(l, e, t, n, c) { let i = c < l ? c : l, r = [], a = findSpan(l, n, e), $ = calcBasisFunctionDerivatives(a, n, l, i, e), o = []; for (let f = 0; f < t.length; ++f) { let u = t[f].clone(), s = u.w; u.x *= s, u.y *= s, u.z *= s, o[f] = u } for (let _ = 0; _ <= i; ++_) { let d = o[a - l].clone().multiplyScalar($[_][0]); for (let S = 1; S <= l; ++S)d.add(o[a - l + S].clone().multiplyScalar($[_][S])); r[_] = d } for (let v = i + 1; v <= c + 1; ++v)r[v] = new Vector4(0, 0, 0); return r } function calcKoverI(l, e) { let t = 1; for (let n = 2; n <= l; ++n)t *= n; let c = 1; for (let i = 2; i <= e; ++i)c *= i; for (let r = 2; r <= l - e; ++r)c *= r; return t / c } function calcRationalCurveDerivatives(l) { let e = l.length, t = [], n = []; for (let c = 0; c < e; ++c) { let i = l[c]; t[c] = new Vector3(i.x, i.y, i.z), n[c] = i.w } let r = []; for (let a = 0; a < e; ++a) { let $ = t[a].clone(); for (let o = 1; o <= a; ++o)$.sub(r[a - o].clone().multiplyScalar(calcKoverI(a, o) * n[o])); r[a] = $.divideScalar(n[0]) } return r } function calcNURBSDerivatives(l, e, t, n, c) { let i = calcBSplineDerivatives(l, e, t, n, c); return calcRationalCurveDerivatives(i) } function calcSurfacePoint(l, e, t, n, c, i, r, a) { let $ = findSpan(l, i, t), o = findSpan(e, r, n), f = calcBasisFunctions($, i, l, t), u = calcBasisFunctions(o, r, e, n), s = []; for (let _ = 0; _ <= e; ++_) { s[_] = new Vector4(0, 0, 0, 0); for (let d = 0; d <= l; ++d) { let S = c[$ - l + d][o - e + _].clone(), v = S.w; S.x *= v, S.y *= v, S.z *= v, s[_].add(S.multiplyScalar(f[d])) } } let p = new Vector4(0, 0, 0, 0); for (let w = 0; w <= e; ++w)p.add(s[w].multiplyScalar(u[w])); p.divideScalar(p.w), a.set(p.x, p.y, p.z) } function calcVolumePoint(l, e, t, n, c, i, r, a, $, o, f) { let u = findSpan(l, a, n), s = findSpan(e, $, c), _ = findSpan(t, o, i), d = calcBasisFunctions(u, a, l, n), S = calcBasisFunctions(s, $, e, c), v = calcBasisFunctions(_, o, t, i), p = []; for (let w = 0; w <= t; ++w) { p[w] = []; for (let y = 0; y <= e; ++y) { p[w][y] = new Vector4(0, 0, 0, 0); for (let B = 0; B <= l; ++B) { let m = r[u - l + B][s - e + y][_ - t + w].clone(), F = m.w; m.x *= F, m.y *= F, m.z *= F, p[w][y].add(m.multiplyScalar(d[B])) } } } let x = new Vector4(0, 0, 0, 0); for (let z = 0; z <= t; ++z)for (let D = 0; D <= e; ++D)x.add(p[z][D].multiplyScalar(v[z]).multiplyScalar(S[D])); x.divideScalar(x.w), f.set(x.x, x.y, x.z) }

//nurbsCurves
class NURBSCurve extends Curve { constructor(t, s, n, o, e) { super(); let i = s ? s.length - 1 : 0, r = n ? n.length : 0; this.degree = t, this.knots = s, this.controlPoints = [], this.startKnot = o || 0, this.endKnot = e || i; for (let h = 0; h < r; ++h) { let l = n[h]; this.controlPoints[h] = new Vector4(l.x, l.y, l.z, l.w) } } getPoint(t, s = new Vector3) { let n = this.knots[this.startKnot] + t * (this.knots[this.endKnot] - this.knots[this.startKnot]), o = calcBSplinePoint(this.degree, this.knots, this.controlPoints, n); return 1 !== o.w && o.divideScalar(o.w), s.set(o.x, o.y, o.z) } getTangent(t, s = new Vector3) { let n = s, o = this.knots[0] + t * (this.knots[this.knots.length - 1] - this.knots[0]), e = calcNURBSDerivatives(this.degree, this.knots, this.controlPoints, o, 1); return n.copy(e[1]).normalize(), n } toJSON() { let t = super.toJSON(); return t.degree = this.degree, t.knots = [...this.knots], t.controlPoints = this.controlPoints.map(t => t.toArray()), t.startKnot = this.startKnot, t.endKnot = this.endKnot, t } fromJSON(t) { return super.fromJSON(t), this.degree = t.degree, this.knots = [...t.knots], this.controlPoints = t.controlPoints.map(t => new Vector4(t[0], t[1], t[2], t[3])), this.startKnot = t.startKnot, this.endKnot = t.endKnot, this } }

class FBXLoader extends Loader {
	constructor(manager) {
		super(manager);
	}
	load(url, onLoad, onProgress, onError) {
		const scope = this;
		const path = (scope.path === '') ? LoaderUtils.extractUrlBase(url) : scope.path;
		const loader = new FileLoader(this.manager);
		loader.setPath(scope.path);
		loader.setResponseType('arraybuffer');
		loader.setRequestHeader(scope.requestHeader);
		loader.setWithCredentials(scope.withCredentials);
		loader.load(url, function (buffer) {
			try {
				onLoad(scope.parse(buffer, path));
			} catch (e) {
				if (onError) {
					onError(e);
				} else {
					console.error(e);
				}
				scope.manager.itemError(url);
			}
		}, onProgress, onError);
	}
	parse(FBXBuffer, path) {
		if (isFbxFormatBinary(FBXBuffer)) {
			fbxTree = new BinaryParser().parse(FBXBuffer);
		} else {
			const FBXText = convertArrayBufferToString(FBXBuffer);
			if (!isFbxFormatASCII(FBXText)) {
				throw new Error('THREE.FBXLoader: Unknown format.');
			}
			if (getFbxVersion(FBXText) < 7000) {
				throw new Error('THREE.FBXLoader: FBX version not supported, FileVersion: ' + getFbxVersion(FBXText));
			}
			fbxTree = new TextParser().parse(FBXText);
		}
		const textureLoader = new TextureLoader(this.manager).setPath(this.resourcePath || path).setCrossOrigin(this.crossOrigin);
		return new FBXTreeParser(textureLoader, this.manager).parse(fbxTree);
	}
}
class FBXTreeParser {
	constructor(textureLoader, manager) {
		this.textureLoader = textureLoader;
		this.manager = manager;
	}
	parse() {
		connections = this.parseConnections();
		const images = this.parseImages();
		const textures = this.parseTextures(images);
		const materials = this.parseMaterials(textures);
		const deformers = this.parseDeformers();
		const geometryMap = new GeometryParser().parse(deformers);
		this.parseScene(deformers, geometryMap, materials);
		return sceneGraph;
	}
	parseConnections() {
		const connectionMap = new Map();
		if ('Connections' in fbxTree) {
			const rawConnections = fbxTree.Connections.connections;
			rawConnections.forEach(function (rawConnection) {
				const fromID = rawConnection[0];
				const toID = rawConnection[1];
				const relationship = rawConnection[2];
				if (!connectionMap.has(fromID)) {
					connectionMap.set(fromID, {
						parents: [],
						children: []
					});
				}
				const parentRelationship = { ID: toID, relationship: relationship };
				connectionMap.get(fromID).parents.push(parentRelationship);
				if (!connectionMap.has(toID)) {
					connectionMap.set(toID, {
						parents: [],
						children: []
					});
				}
				const childRelationship = { ID: fromID, relationship: relationship };
				connectionMap.get(toID).children.push(childRelationship);
			});
		}
		return connectionMap;
	}
	parseImages() {
		const images = {};
		const blobs = {};
		if ('Video' in fbxTree.Objects) {
			const videoNodes = fbxTree.Objects.Video;
			for (const nodeID in videoNodes) {
				const videoNode = videoNodes[nodeID];
				const id = parseInt(nodeID);
				images[id] = videoNode.RelativeFilename || videoNode.Filename;
				if ('Content' in videoNode) {
					const arrayBufferContent = (videoNode.Content instanceof ArrayBuffer) && (videoNode.Content.byteLength > 0);
					const base64Content = (typeof videoNode.Content === 'string') && (videoNode.Content !== '');
					if (arrayBufferContent || base64Content) {
						const image = this.parseImage(videoNodes[nodeID]);
						blobs[videoNode.RelativeFilename || videoNode.Filename] = image;
					}
				}
			}
		}
		for (const id in images) {
			const filename = images[id];
			if (blobs[filename] !== undefined) images[id] = blobs[filename];
			else images[id] = images[id].split('\\').pop();
		}
		return images;
	}
	parseImage(videoNode) {
		const content = videoNode.Content;
		const fileName = videoNode.RelativeFilename || videoNode.Filename;
		const extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
		let type;
		switch (extension) {
			case 'bmp':
				type = 'image/bmp';
				break;
			case 'jpg':
			case 'jpeg':
				type = 'image/jpeg';
				break;
			case 'png':
				type = 'image/png';
				break;
			case 'tif':
				type = 'image/tiff';
				break;
			case 'tga':
				if (this.manager.getHandler('.tga') === null) {
					console.warn('FBXLoader: TGA loader not found, skipping ', fileName);
				}
				type = 'image/tga';
				break;
			case 'webp':
				type = 'image/webp';
				break;
			default:
				console.warn('FBXLoader: Image type "' + extension + '" is not supported.');
				return;
		}
		if (typeof content === 'string') {
			return 'data:' + type + ';base64,' + content;
		} else {
			const array = new Uint8Array(content);
			return window.URL.createObjectURL(new Blob([array], { type: type }));
		}
	}
	parseTextures(images) {
		const textureMap = new Map();
		if ('Texture' in fbxTree.Objects) {
			const textureNodes = fbxTree.Objects.Texture;
			for (const nodeID in textureNodes) {
				const texture = this.parseTexture(textureNodes[nodeID], images);
				textureMap.set(parseInt(nodeID), texture);
			}
		}
		return textureMap;
	}
	parseTexture(textureNode, images) {
		const texture = this.loadTexture(textureNode, images);
		texture.ID = textureNode.id;
		texture.name = textureNode.attrName;
		const wrapModeU = textureNode.WrapModeU;
		const wrapModeV = textureNode.WrapModeV;
		const valueU = wrapModeU !== undefined ? wrapModeU.value : 0;
		const valueV = wrapModeV !== undefined ? wrapModeV.value : 0;
		texture.wrapS = valueU === 0 ? RepeatWrapping : ClampToEdgeWrapping;
		texture.wrapT = valueV === 0 ? RepeatWrapping : ClampToEdgeWrapping;
		if ('Scaling' in textureNode) {
			const values = textureNode.Scaling.value;
			texture.repeat.x = values[0];
			texture.repeat.y = values[1];
		}
		if ('Translation' in textureNode) {
			const values = textureNode.Translation.value;
			texture.offset.x = values[0];
			texture.offset.y = values[1];
		}
		return texture;
	}
	loadTexture(textureNode, images) {
		const extension = textureNode.FileName.split('.').pop().toLowerCase();
		let loader = this.manager.getHandler(`.${extension}`);
		if (loader === null) loader = this.textureLoader;
		const loaderPath = loader.path;
		if (!loaderPath) {
			loader.setPath(this.textureLoader.path);
		}
		const children = connections.get(textureNode.id).children;
		let fileName;
		if (children !== undefined && children.length > 0 && images[children[0].ID] !== undefined) {
			fileName = images[children[0].ID];
			if (fileName.indexOf('blob:') === 0 || fileName.indexOf('data:') === 0) {
				loader.setPath(undefined);
			}
		}
		if (fileName === undefined) {
			console.warn('FBXLoader: Undefined filename, creating placeholder texture.');
			return new Texture();
		}
		const texture = loader.load(fileName);
		loader.setPath(loaderPath);
		return texture;
	}
	parseMaterials(textureMap) {
		const materialMap = new Map();
		if ('Material' in fbxTree.Objects) {
			const materialNodes = fbxTree.Objects.Material;
			for (const nodeID in materialNodes) {
				const material = this.parseMaterial(materialNodes[nodeID], textureMap);
				if (material !== null) materialMap.set(parseInt(nodeID), material);
			}
		}
		return materialMap;
	}
	parseMaterial(materialNode, textureMap) {
		const ID = materialNode.id;
		const name = materialNode.attrName;
		let type = materialNode.ShadingModel;
		if (typeof type === 'object') {
			type = type.value;
		}
		if (!connections.has(ID)) return null;
		const parameters = this.parseParameters(materialNode, textureMap, ID);
		let material;
		switch (type.toLowerCase()) {
			case 'phong':
				material = new MeshPhongMaterial();
				break;
			case 'lambert':
				material = new MeshLambertMaterial();
				break;
			default:
				console.warn('THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.', type);
				material = new MeshPhongMaterial();
				break;
		}
		material.setValues(parameters);
		material.name = name;
		return material;
	}
	parseParameters(materialNode, textureMap, ID) {
		const parameters = {};
		if (materialNode.BumpFactor) {
			parameters.bumpScale = materialNode.BumpFactor.value;
		}
		if (materialNode.Diffuse) {
			parameters.color = ColorManagement.colorSpaceToWorking(new Color().fromArray(materialNode.Diffuse.value), SRGBColorSpace);
		} else if (materialNode.DiffuseColor && (materialNode.DiffuseColor.type === 'Color' || materialNode.DiffuseColor.type === 'ColorRGB')) {
			parameters.color = ColorManagement.colorSpaceToWorking(new Color().fromArray(materialNode.DiffuseColor.value), SRGBColorSpace);
		}
		if (materialNode.DisplacementFactor) {
			parameters.displacementScale = materialNode.DisplacementFactor.value;
		}
		if (materialNode.Emissive) {
			parameters.emissive = ColorManagement.colorSpaceToWorking(new Color().fromArray(materialNode.Emissive.value), SRGBColorSpace);
		} else if (materialNode.EmissiveColor && (materialNode.EmissiveColor.type === 'Color' || materialNode.EmissiveColor.type === 'ColorRGB')) {
			parameters.emissive = ColorManagement.colorSpaceToWorking(new Color().fromArray(materialNode.EmissiveColor.value), SRGBColorSpace);
		}
		if (materialNode.EmissiveFactor) {
			parameters.emissiveIntensity = parseFloat(materialNode.EmissiveFactor.value);
		}
		parameters.opacity = 1 - (materialNode.TransparencyFactor ? parseFloat(materialNode.TransparencyFactor.value) : 0);
		if (parameters.opacity === 1 || parameters.opacity === 0) {
			parameters.opacity = (materialNode.Opacity ? parseFloat(materialNode.Opacity.value) : null);
			if (parameters.opacity === null) {
				parameters.opacity = 1 - (materialNode.TransparentColor ? parseFloat(materialNode.TransparentColor.value[0]) : 0);
			}
		}
		if (parameters.opacity < 1.0) {
			parameters.transparent = true;
		}
		if (materialNode.ReflectionFactor) {
			parameters.reflectivity = materialNode.ReflectionFactor.value;
		}
		if (materialNode.Shininess) {
			parameters.shininess = materialNode.Shininess.value;
		}
		if (materialNode.Specular) {
			parameters.specular = ColorManagement.colorSpaceToWorking(new Color().fromArray(materialNode.Specular.value), SRGBColorSpace);
		} else if (materialNode.SpecularColor && materialNode.SpecularColor.type === 'Color') {
			parameters.specular = ColorManagement.colorSpaceToWorking(new Color().fromArray(materialNode.SpecularColor.value), SRGBColorSpace);
		}
		const scope = this;
		connections.get(ID).children.forEach(function (child) {
			const type = child.relationship;
			switch (type) {
				case 'Bump':
					parameters.bumpMap = scope.getTexture(textureMap, child.ID);
					break;
				case 'Maya|TEX_ao_map':
					parameters.aoMap = scope.getTexture(textureMap, child.ID);
					break;
				case 'DiffuseColor':
				case 'Maya|TEX_color_map':
					parameters.map = scope.getTexture(textureMap, child.ID);
					if (parameters.map !== undefined) {
						parameters.map.colorSpace = SRGBColorSpace;
					}
					break;
				case 'DisplacementColor':
					parameters.displacementMap = scope.getTexture(textureMap, child.ID);
					break;
				case 'EmissiveColor':
					parameters.emissiveMap = scope.getTexture(textureMap, child.ID);
					if (parameters.emissiveMap !== undefined) {
						parameters.emissiveMap.colorSpace = SRGBColorSpace;
					}
					break;
				case 'NormalMap':
				case 'Maya|TEX_normal_map':
					parameters.normalMap = scope.getTexture(textureMap, child.ID);
					break;
				case 'ReflectionColor':
					parameters.envMap = scope.getTexture(textureMap, child.ID);
					if (parameters.envMap !== undefined) {
						parameters.envMap.mapping = EquirectangularReflectionMapping;
						parameters.envMap.colorSpace = SRGBColorSpace;
					}
					break;
				case 'SpecularColor':
					parameters.specularMap = scope.getTexture(textureMap, child.ID);
					if (parameters.specularMap !== undefined) {
						parameters.specularMap.colorSpace = SRGBColorSpace;
					}
					break;
				case 'TransparentColor':
				case 'TransparencyFactor':
					parameters.alphaMap = scope.getTexture(textureMap, child.ID);
					parameters.transparent = true;
					break;
				case 'AmbientColor':
				case 'ShininessExponent':
				case 'SpecularFactor':
				case 'VectorDisplacementColor':
				default:
					console.warn('THREE.FBXLoader: %s map is not supported in three.js, skipping texture.', type);
					break;
			}
		});
		return parameters;
	}
	getTexture(textureMap, id) {
		if ('LayeredTexture' in fbxTree.Objects && id in fbxTree.Objects.LayeredTexture) {
			console.warn('THREE.FBXLoader: layered textures are not supported in three.js. Discarding all but first layer.');
			id = connections.get(id).children[0].ID;
		}
		return textureMap.get(id);
	}
	parseDeformers() {
		const skeletons = {};
		const morphTargets = {};
		if ('Deformer' in fbxTree.Objects) {
			const DeformerNodes = fbxTree.Objects.Deformer;
			for (const nodeID in DeformerNodes) {
				const deformerNode = DeformerNodes[nodeID];
				const relationships = connections.get(parseInt(nodeID));
				if (deformerNode.attrType === 'Skin') {
					const skeleton = this.parseSkeleton(relationships, DeformerNodes);
					skeleton.ID = nodeID;
					if (relationships.parents.length > 1) console.warn('THREE.FBXLoader: skeleton attached to more than one geometry is not supported.');
					skeleton.geometryID = relationships.parents[0].ID;
					skeletons[nodeID] = skeleton;
				} else if (deformerNode.attrType === 'BlendShape') {
					const morphTarget = {
						id: nodeID,
					};
					morphTarget.rawTargets = this.parseMorphTargets(relationships, DeformerNodes);
					morphTarget.id = nodeID;
					if (relationships.parents.length > 1) console.warn('THREE.FBXLoader: morph target attached to more than one geometry is not supported.');
					morphTargets[nodeID] = morphTarget;
				}
			}
		}
		return {
			skeletons: skeletons,
			morphTargets: morphTargets,
		};
	}
	parseSkeleton(relationships, deformerNodes) {
		const rawBones = [];
		relationships.children.forEach(function (child) {
			const boneNode = deformerNodes[child.ID];
			if (boneNode.attrType !== 'Cluster') return;
			const rawBone = {
				ID: child.ID,
				indices: [],
				weights: [],
				transformLink: new Matrix4().fromArray(boneNode.TransformLink.a),
			};
			if ('Indexes' in boneNode) {
				rawBone.indices = boneNode.Indexes.a;
				rawBone.weights = boneNode.Weights.a;
			}
			rawBones.push(rawBone);
		});
		return {
			rawBones: rawBones,
			bones: []
		};
	}
	parseMorphTargets(relationships, deformerNodes) {
		const rawMorphTargets = [];
		for (let i = 0; i < relationships.children.length; i++) {
			const child = relationships.children[i];
			const morphTargetNode = deformerNodes[child.ID];
			const rawMorphTarget = {
				name: morphTargetNode.attrName,
				initialWeight: morphTargetNode.DeformPercent,
				id: morphTargetNode.id,
				fullWeights: morphTargetNode.FullWeights.a
			};
			if (morphTargetNode.attrType !== 'BlendShapeChannel') return;
			rawMorphTarget.geoID = connections.get(parseInt(child.ID)).children.filter(function (child) {
				return child.relationship === undefined;
			})[0].ID;
			rawMorphTargets.push(rawMorphTarget);
		}
		return rawMorphTargets;
	}
	parseScene(deformers, geometryMap, materialMap) {
		sceneGraph = new Group();
		const modelMap = this.parseModels(deformers.skeletons, geometryMap, materialMap);
		const modelNodes = fbxTree.Objects.Model;
		const scope = this;
		modelMap.forEach(function (model) {
			const modelNode = modelNodes[model.ID];
			scope.setLookAtProperties(model, modelNode);
			const parentConnections = connections.get(model.ID).parents;
			parentConnections.forEach(function (connection) {
				const parent = modelMap.get(connection.ID);
				if (parent !== undefined) parent.add(model);
			});
			if (model.parent === null) {
				sceneGraph.add(model);
			}
		});
		this.bindSkeleton(deformers.skeletons, geometryMap, modelMap);
		this.addGlobalSceneSettings();
		sceneGraph.traverse(function (node) {
			if (node.userData.transformData) {
				if (node.parent) {
					node.userData.transformData.parentMatrix = node.parent.matrix;
					node.userData.transformData.parentMatrixWorld = node.parent.matrixWorld;
				}
				const transform = generateTransform(node.userData.transformData);
				node.applyMatrix4(transform);
				node.updateWorldMatrix();
			}
		});
		const animations = new AnimationParser().parse();
		if (sceneGraph.children.length === 1 && sceneGraph.children[0].isGroup) {
			sceneGraph.children[0].animations = animations;
			sceneGraph = sceneGraph.children[0];
		}
		sceneGraph.animations = animations;
	}
	parseModels(skeletons, geometryMap, materialMap) {
		const modelMap = new Map();
		const modelNodes = fbxTree.Objects.Model;
		for (const nodeID in modelNodes) {
			const id = parseInt(nodeID);
			const node = modelNodes[nodeID];
			const relationships = connections.get(id);
			let model = this.buildSkeleton(relationships, skeletons, id, node.attrName);
			if (!model) {
				switch (node.attrType) {
					case 'Camera':
						model = this.createCamera(relationships);
						break;
					case 'Light':
						model = this.createLight(relationships);
						break;
					case 'Mesh':
						model = this.createMesh(relationships, geometryMap, materialMap);
						break;
					case 'NurbsCurve':
						model = this.createCurve(relationships, geometryMap);
						break;
					case 'LimbNode':
					case 'Root':
						model = new Bone();
						break;
					case 'Null':
					default:
						model = new Group();
						break;
				}
				model.name = node.attrName ? PropertyBinding.sanitizeNodeName(node.attrName) : '';
				model.userData.originalName = node.attrName;
				model.ID = id;
			}
			this.getTransformData(model, node);
			modelMap.set(id, model);
		}
		return modelMap;
	}
	buildSkeleton(relationships, skeletons, id, name) {
		let bone = null;
		relationships.parents.forEach(function (parent) {
			for (const ID in skeletons) {
				const skeleton = skeletons[ID];
				skeleton.rawBones.forEach(function (rawBone, i) {
					if (rawBone.ID === parent.ID) {
						const subBone = bone;
						bone = new Bone();
						bone.matrixWorld.copy(rawBone.transformLink);
						bone.name = name ? PropertyBinding.sanitizeNodeName(name) : '';
						bone.userData.originalName = name;
						bone.ID = id;
						skeleton.bones[i] = bone;
						if (subBone !== null) {
							bone.add(subBone);
						}
					}
				});
			}
		});
		return bone;
	}
	createCamera(relationships) {
		let model;
		let cameraAttribute;
		relationships.children.forEach(function (child) {
			const attr = fbxTree.Objects.NodeAttribute[child.ID];
			if (attr !== undefined) {
				cameraAttribute = attr;
			}
		});
		if (cameraAttribute === undefined) {
			model = new Object3D();
		} else {
			let type = 0;
			if (cameraAttribute.CameraProjectionType !== undefined && cameraAttribute.CameraProjectionType.value === 1) {
				type = 1;
			}
			let nearClippingPlane = 1;
			if (cameraAttribute.NearPlane !== undefined) {
				nearClippingPlane = cameraAttribute.NearPlane.value / 1000;
			}
			let farClippingPlane = 1000;
			if (cameraAttribute.FarPlane !== undefined) {
				farClippingPlane = cameraAttribute.FarPlane.value / 1000;
			}
			let width = window.innerWidth;
			let height = window.innerHeight;
			if (cameraAttribute.AspectWidth !== undefined && cameraAttribute.AspectHeight !== undefined) {
				width = cameraAttribute.AspectWidth.value;
				height = cameraAttribute.AspectHeight.value;
			}
			const aspect = width / height;
			let fov = 45;
			if (cameraAttribute.FieldOfView !== undefined) {
				fov = cameraAttribute.FieldOfView.value;
			}
			const focalLength = cameraAttribute.FocalLength ? cameraAttribute.FocalLength.value : null;
			switch (type) {
				case 0:
					model = new PerspectiveCamera(fov, aspect, nearClippingPlane, farClippingPlane);
					if (focalLength !== null) model.setFocalLength(focalLength);
					break;
				case 1:
					console.warn('THREE.FBXLoader: Orthographic cameras not supported yet.');
					model = new Object3D();
					break;
				default:
					console.warn('THREE.FBXLoader: Unknown camera type ' + type + '.');
					model = new Object3D();
					break;
			}
		}
		return model;
	}
	createLight(relationships) {
		let model;
		let lightAttribute;
		relationships.children.forEach(function (child) {
			const attr = fbxTree.Objects.NodeAttribute[child.ID];
			if (attr !== undefined) {
				lightAttribute = attr;
			}
		});
		if (lightAttribute === undefined) {
			model = new Object3D();
		} else {
			let type;
			if (lightAttribute.LightType === undefined) {
				type = 0;
			} else {
				type = lightAttribute.LightType.value;
			}
			let color = 0xffffff;
			if (lightAttribute.Color !== undefined) {
				color = ColorManagement.colorSpaceToWorking(new Color().fromArray(lightAttribute.Color.value), SRGBColorSpace);
			}
			let intensity = (lightAttribute.Intensity === undefined) ? 1 : lightAttribute.Intensity.value / 100;
			if (lightAttribute.CastLightOnObject !== undefined && lightAttribute.CastLightOnObject.value === 0) {
				intensity = 0;
			}
			let distance = 0;
			if (lightAttribute.FarAttenuationEnd !== undefined) {
				if (lightAttribute.EnableFarAttenuation !== undefined && lightAttribute.EnableFarAttenuation.value === 0) {
					distance = 0;
				} else {
					distance = lightAttribute.FarAttenuationEnd.value;
				}
			}
			const decay = 1;
			switch (type) {
				case 0:
					model = new PointLight(color, intensity, distance, decay);
					break;
				case 1:
					model = new DirectionalLight(color, intensity);
					break;
				case 2:
					let angle = Math.PI / 3;
					if (lightAttribute.InnerAngle !== undefined) {
						angle = MathUtils.degToRad(lightAttribute.InnerAngle.value);
					}
					let penumbra = 0;
					if (lightAttribute.OuterAngle !== undefined) {
						penumbra = MathUtils.degToRad(lightAttribute.OuterAngle.value);
						penumbra = Math.max(penumbra, 1);
					}
					model = new SpotLight(color, intensity, distance, angle, penumbra, decay);
					break;
				default:
					console.warn('THREE.FBXLoader: Unknown light type ' + lightAttribute.LightType.value + ', defaulting to a PointLight.');
					model = new PointLight(color, intensity);
					break;
			}
			if (lightAttribute.CastShadows !== undefined && lightAttribute.CastShadows.value === 1) {
				model.castShadow = true;
			}
		}
		return model;
	}
	createMesh(relationships, geometryMap, materialMap) {
		let model;
		let geometry = null;
		let material = null;
		const materials = [];
		relationships.children.forEach(function (child) {
			if (geometryMap.has(child.ID)) {
				geometry = geometryMap.get(child.ID);
			}
			if (materialMap.has(child.ID)) {
				materials.push(materialMap.get(child.ID));
			}
		});
		if (materials.length > 1) {
			material = materials;
		} else if (materials.length > 0) {
			material = materials[0];
		} else {
			material = new MeshPhongMaterial({
				name: Loader.DEFAULT_MATERIAL_NAME,
				color: 0xcccccc
			});
			materials.push(material);
		}
		if ('color' in geometry.attributes) {
			materials.forEach(function (material) {
				material.vertexColors = true;
			});
		}
		if (geometry.groups.length > 0) {
			let needsDefaultMaterial = false;
			for (let i = 0, il = geometry.groups.length; i < il; i++) {
				const group = geometry.groups[i];
				if (group.materialIndex < 0 || group.materialIndex >= materials.length) {
					group.materialIndex = materials.length;
					needsDefaultMaterial = true;
				}
			}
			if (needsDefaultMaterial) {
				const defaultMaterial = new MeshPhongMaterial();
				materials.push(defaultMaterial);
			}
		}
		if (geometry.FBX_Deformer) {
			model = new SkinnedMesh(geometry, material);
			model.normalizeSkinWeights();
		} else {
			model = new Mesh(geometry, material);
		}
		return model;
	}
	createCurve(relationships, geometryMap) {
		const geometry = relationships.children.reduce(function (geo, child) {
			if (geometryMap.has(child.ID)) geo = geometryMap.get(child.ID);
			return geo;
		}, null);
		const material = new LineBasicMaterial({
			name: Loader.DEFAULT_MATERIAL_NAME,
			color: 0x3300ff,
			linewidth: 1
		});
		return new Line(geometry, material);
	}
	getTransformData(model, modelNode) {
		const transformData = {};
		if ('InheritType' in modelNode) transformData.inheritType = parseInt(modelNode.InheritType.value);
		if ('RotationOrder' in modelNode) transformData.eulerOrder = getEulerOrder(modelNode.RotationOrder.value);
		else transformData.eulerOrder = getEulerOrder(0);
		if ('Lcl_Translation' in modelNode) transformData.translation = modelNode.Lcl_Translation.value;
		if ('PreRotation' in modelNode) transformData.preRotation = modelNode.PreRotation.value;
		if ('Lcl_Rotation' in modelNode) transformData.rotation = modelNode.Lcl_Rotation.value;
		if ('PostRotation' in modelNode) transformData.postRotation = modelNode.PostRotation.value;
		if ('Lcl_Scaling' in modelNode) transformData.scale = modelNode.Lcl_Scaling.value;
		if ('ScalingOffset' in modelNode) transformData.scalingOffset = modelNode.ScalingOffset.value;
		if ('ScalingPivot' in modelNode) transformData.scalingPivot = modelNode.ScalingPivot.value;
		if ('RotationOffset' in modelNode) transformData.rotationOffset = modelNode.RotationOffset.value;
		if ('RotationPivot' in modelNode) transformData.rotationPivot = modelNode.RotationPivot.value;
		model.userData.transformData = transformData;
	}
	setLookAtProperties(model, modelNode) {
		if ('LookAtProperty' in modelNode) {
			const children = connections.get(model.ID).children;
			children.forEach(function (child) {
				if (child.relationship === 'LookAtProperty') {
					const lookAtTarget = fbxTree.Objects.Model[child.ID];
					if ('Lcl_Translation' in lookAtTarget) {
						const pos = lookAtTarget.Lcl_Translation.value;
						if (model.target !== undefined) {
							model.target.position.fromArray(pos);
							sceneGraph.add(model.target);
						} else {
							model.lookAt(new Vector3().fromArray(pos));
						}
					}
				}
			});
		}
	}
	bindSkeleton(skeletons, geometryMap, modelMap) {
		const bindMatrices = this.parsePoseNodes();
		for (const ID in skeletons) {
			const skeleton = skeletons[ID];
			const parents = connections.get(parseInt(skeleton.ID)).parents;
			parents.forEach(function (parent) {
				if (geometryMap.has(parent.ID)) {
					const geoID = parent.ID;
					const geoRelationships = connections.get(geoID);
					geoRelationships.parents.forEach(function (geoConnParent) {
						if (modelMap.has(geoConnParent.ID)) {
							const model = modelMap.get(geoConnParent.ID);
							model.bind(new Skeleton(skeleton.bones), bindMatrices[geoConnParent.ID]);
						}
					});
				}
			});
		}
	}
	parsePoseNodes() {
		const bindMatrices = {};
		if ('Pose' in fbxTree.Objects) {
			const BindPoseNode = fbxTree.Objects.Pose;
			for (const nodeID in BindPoseNode) {
				if (BindPoseNode[nodeID].attrType === 'BindPose' && BindPoseNode[nodeID].NbPoseNodes > 0) {
					const poseNodes = BindPoseNode[nodeID].PoseNode;
					if (Array.isArray(poseNodes)) {
						poseNodes.forEach(function (poseNode) {
							bindMatrices[poseNode.Node] = new Matrix4().fromArray(poseNode.Matrix.a);
						});
					} else {
						bindMatrices[poseNodes.Node] = new Matrix4().fromArray(poseNodes.Matrix.a);
					}
				}
			}
		}
		return bindMatrices;
	}
	addGlobalSceneSettings() {
		if ('GlobalSettings' in fbxTree) {
			if ('AmbientColor' in fbxTree.GlobalSettings) {
				const ambientColor = fbxTree.GlobalSettings.AmbientColor.value;
				const r = ambientColor[0];
				const g = ambientColor[1];
				const b = ambientColor[2];
				if (r !== 0 || g !== 0 || b !== 0) {
					const color = new Color().setRGB(r, g, b, SRGBColorSpace);
					sceneGraph.add(new AmbientLight(color, 1));
				}
			}
			if ('UnitScaleFactor' in fbxTree.GlobalSettings) {
				sceneGraph.userData.unitScaleFactor = fbxTree.GlobalSettings.UnitScaleFactor.value;
			}
		}
	}
}
class GeometryParser {
	constructor() {
		this.negativeMaterialIndices = false;
	}
	parse(deformers) {
		const geometryMap = new Map();
		if ('Geometry' in fbxTree.Objects) {
			const geoNodes = fbxTree.Objects.Geometry;
			for (const nodeID in geoNodes) {
				const relationships = connections.get(parseInt(nodeID));
				const geo = this.parseGeometry(relationships, geoNodes[nodeID], deformers);
				geometryMap.set(parseInt(nodeID), geo);
			}
		}
		if (this.negativeMaterialIndices === true) {
			console.warn('THREE.FBXLoader: The FBX file contains invalid (negative) material indices. The asset might not render as expected.');
		}
		return geometryMap;
	}
	parseGeometry(relationships, geoNode, deformers) {
		switch (geoNode.attrType) {
			case 'Mesh':
				return this.parseMeshGeometry(relationships, geoNode, deformers);
				break;
			case 'NurbsCurve':
				return this.parseNurbsGeometry(geoNode);
				break;
		}
	}
	parseMeshGeometry(relationships, geoNode, deformers) {
		const skeletons = deformers.skeletons;
		const morphTargets = [];
		const modelNodes = relationships.parents.map(function (parent) {
			return fbxTree.Objects.Model[parent.ID];
		});
		if (modelNodes.length === 0) return;
		const skeleton = relationships.children.reduce(function (skeleton, child) {
			if (skeletons[child.ID] !== undefined) skeleton = skeletons[child.ID];
			return skeleton;
		}, null);
		relationships.children.forEach(function (child) {
			if (deformers.morphTargets[child.ID] !== undefined) {
				morphTargets.push(deformers.morphTargets[child.ID]);
			}
		});
		const modelNode = modelNodes[0];
		const transformData = {};
		if ('RotationOrder' in modelNode) transformData.eulerOrder = getEulerOrder(modelNode.RotationOrder.value);
		if ('InheritType' in modelNode) transformData.inheritType = parseInt(modelNode.InheritType.value);
		if ('GeometricTranslation' in modelNode) transformData.translation = modelNode.GeometricTranslation.value;
		if ('GeometricRotation' in modelNode) transformData.rotation = modelNode.GeometricRotation.value;
		if ('GeometricScaling' in modelNode) transformData.scale = modelNode.GeometricScaling.value;
		const transform = generateTransform(transformData);
		return this.genGeometry(geoNode, skeleton, morphTargets, transform);
	}
	genGeometry(geoNode, skeleton, morphTargets, preTransform) {
		const geo = new BufferGeometry();
		if (geoNode.attrName) geo.name = geoNode.attrName;
		const geoInfo = this.parseGeoNode(geoNode, skeleton);
		const buffers = this.genBuffers(geoInfo);
		const positionAttribute = new Float32BufferAttribute(buffers.vertex, 3);
		positionAttribute.applyMatrix4(preTransform);
		geo.setAttribute('position', positionAttribute);
		if (buffers.colors.length > 0) {
			geo.setAttribute('color', new Float32BufferAttribute(buffers.colors, 3));
		}
		if (skeleton) {
			geo.setAttribute('skinIndex', new Uint16BufferAttribute(buffers.weightsIndices, 4));
			geo.setAttribute('skinWeight', new Float32BufferAttribute(buffers.vertexWeights, 4));
			geo.FBX_Deformer = skeleton;
		}
		if (buffers.normal.length > 0) {
			const normalMatrix = new Matrix3().getNormalMatrix(preTransform);
			const normalAttribute = new Float32BufferAttribute(buffers.normal, 3);
			normalAttribute.applyNormalMatrix(normalMatrix);
			geo.setAttribute('normal', normalAttribute);
		}
		buffers.uvs.forEach(function (uvBuffer, i) {
			const name = i === 0 ? 'uv' : `uv${i}`;
			geo.setAttribute(name, new Float32BufferAttribute(buffers.uvs[i], 2));
		});
		if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {
			let prevMaterialIndex = buffers.materialIndex[0];
			let startIndex = 0;
			buffers.materialIndex.forEach(function (currentIndex, i) {
				if (currentIndex !== prevMaterialIndex) {
					geo.addGroup(startIndex, i - startIndex, prevMaterialIndex);
					prevMaterialIndex = currentIndex;
					startIndex = i;
				}
			});
			if (geo.groups.length > 0) {
				const lastGroup = geo.groups[geo.groups.length - 1];
				const lastIndex = lastGroup.start + lastGroup.count;
				if (lastIndex !== buffers.materialIndex.length) {
					geo.addGroup(lastIndex, buffers.materialIndex.length - lastIndex, prevMaterialIndex);
				}
			}
			if (geo.groups.length === 0) {
				geo.addGroup(0, buffers.materialIndex.length, buffers.materialIndex[0]);
			}
		}
		this.addMorphTargets(geo, geoNode, morphTargets, preTransform);
		return geo;
	}
	parseGeoNode(geoNode, skeleton) {
		const geoInfo = {};
		geoInfo.vertexPositions = (geoNode.Vertices !== undefined) ? geoNode.Vertices.a : [];
		geoInfo.vertexIndices = (geoNode.PolygonVertexIndex !== undefined) ? geoNode.PolygonVertexIndex.a : [];
		if (geoNode.LayerElementColor) {
			geoInfo.color = this.parseVertexColors(geoNode.LayerElementColor[0]);
		}
		if (geoNode.LayerElementMaterial) {
			geoInfo.material = this.parseMaterialIndices(geoNode.LayerElementMaterial[0]);
		}
		if (geoNode.LayerElementNormal) {
			geoInfo.normal = this.parseNormals(geoNode.LayerElementNormal[0]);
		}
		if (geoNode.LayerElementUV) {
			geoInfo.uv = [];
			let i = 0;
			while (geoNode.LayerElementUV[i]) {
				if (geoNode.LayerElementUV[i].UV) {
					geoInfo.uv.push(this.parseUVs(geoNode.LayerElementUV[i]));
				}
				i++;
			}
		}
		geoInfo.weightTable = {};
		if (skeleton !== null) {
			geoInfo.skeleton = skeleton;
			skeleton.rawBones.forEach(function (rawBone, i) {
				rawBone.indices.forEach(function (index, j) {
					if (geoInfo.weightTable[index] === undefined) geoInfo.weightTable[index] = [];
					geoInfo.weightTable[index].push({
						id: i,
						weight: rawBone.weights[j],
					});
				});
			});
		}
		return geoInfo;
	}
	genBuffers(geoInfo) {
		const buffers = {
			vertex: [],
			normal: [],
			colors: [],
			uvs: [],
			materialIndex: [],
			vertexWeights: [],
			weightsIndices: [],
		};
		let polygonIndex = 0;
		let faceLength = 0;
		let displayedWeightsWarning = false;
		let facePositionIndexes = [];
		let faceNormals = [];
		let faceColors = [];
		let faceUVs = [];
		let faceWeights = [];
		let faceWeightIndices = [];
		const scope = this;
		geoInfo.vertexIndices.forEach(function (vertexIndex, polygonVertexIndex) {
			let materialIndex;
			let endOfFace = false;
			if (vertexIndex < 0) {
				vertexIndex = vertexIndex ^ - 1;
				endOfFace = true;
			}
			let weightIndices = [];
			let weights = [];
			facePositionIndexes.push(vertexIndex * 3, vertexIndex * 3 + 1, vertexIndex * 3 + 2);
			if (geoInfo.color) {
				const data = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.color);
				faceColors.push(data[0], data[1], data[2]);
			}
			if (geoInfo.skeleton) {
				if (geoInfo.weightTable[vertexIndex] !== undefined) {
					geoInfo.weightTable[vertexIndex].forEach(function (wt) {
						weights.push(wt.weight);
						weightIndices.push(wt.id);
					});
				}
				if (weights.length > 4) {
					if (!displayedWeightsWarning) {
						console.warn('THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights.');
						displayedWeightsWarning = true;
					}
					const wIndex = [0, 0, 0, 0];
					const Weight = [0, 0, 0, 0];
					weights.forEach(function (weight, weightIndex) {
						let currentWeight = weight;
						let currentIndex = weightIndices[weightIndex];
						Weight.forEach(function (comparedWeight, comparedWeightIndex, comparedWeightArray) {
							if (currentWeight > comparedWeight) {
								comparedWeightArray[comparedWeightIndex] = currentWeight;
								currentWeight = comparedWeight;
								const tmp = wIndex[comparedWeightIndex];
								wIndex[comparedWeightIndex] = currentIndex;
								currentIndex = tmp;
							}
						});
					});
					weightIndices = wIndex;
					weights = Weight;
				}
				while (weights.length < 4) {
					weights.push(0);
					weightIndices.push(0);
				}
				for (let i = 0; i < 4; ++i) {
					faceWeights.push(weights[i]);
					faceWeightIndices.push(weightIndices[i]);
				}
			}
			if (geoInfo.normal) {
				const data = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.normal);
				faceNormals.push(data[0], data[1], data[2]);
			}
			if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {
				materialIndex = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.material)[0];
				if (materialIndex < 0) {
					scope.negativeMaterialIndices = true;
					materialIndex = 0;
				}
			}
			if (geoInfo.uv) {
				geoInfo.uv.forEach(function (uv, i) {
					const data = getData(polygonVertexIndex, polygonIndex, vertexIndex, uv);
					if (faceUVs[i] === undefined) {
						faceUVs[i] = [];
					}
					faceUVs[i].push(data[0]);
					faceUVs[i].push(data[1]);
				});
			}
			faceLength++;
			if (endOfFace) {
				scope.genFace(buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength);
				polygonIndex++;
				faceLength = 0;
				facePositionIndexes = [];
				faceNormals = [];
				faceColors = [];
				faceUVs = [];
				faceWeights = [];
				faceWeightIndices = [];
			}
		});
		return buffers;
	}
	getNormalNewell(vertices) {
		const normal = new Vector3(0.0, 0.0, 0.0);
		for (let i = 0; i < vertices.length; i++) {
			const current = vertices[i];
			const next = vertices[(i + 1) % vertices.length];
			normal.x += (current.y - next.y) * (current.z + next.z);
			normal.y += (current.z - next.z) * (current.x + next.x);
			normal.z += (current.x - next.x) * (current.y + next.y);
		}
		normal.normalize();
		return normal;
	}
	getNormalTangentAndBitangent(vertices) {
		const normalVector = this.getNormalNewell(vertices);
		const up = Math.abs(normalVector.z) > 0.5 ? new Vector3(0.0, 1.0, 0.0) : new Vector3(0.0, 0.0, 1.0);
		const tangent = up.cross(normalVector).normalize();
		const bitangent = normalVector.clone().cross(tangent).normalize();
		return {
			normal: normalVector,
			tangent: tangent,
			bitangent: bitangent
		};
	}
	flattenVertex(vertex, normalTangent, normalBitangent) {
		return new Vector2(
			vertex.dot(normalTangent),
			vertex.dot(normalBitangent)
		);
	}
	genFace(buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength) {
		let triangles;
		if (faceLength > 3) {
			const vertices = [];
			const positions = geoInfo.baseVertexPositions || geoInfo.vertexPositions;
			for (let i = 0; i < facePositionIndexes.length; i += 3) {
				vertices.push(
					new Vector3(
						positions[facePositionIndexes[i]],
						positions[facePositionIndexes[i + 1]],
						positions[facePositionIndexes[i + 2]]
					)
				);
			}
			const { tangent, bitangent } = this.getNormalTangentAndBitangent(vertices);
			const triangulationInput = [];
			for (const vertex of vertices) {
				triangulationInput.push(this.flattenVertex(vertex, tangent, bitangent));
			}
			triangles = ShapeUtils.triangulateShape(triangulationInput, []);
		} else {
			triangles = [[0, 1, 2]];
		}
		for (const [i0, i1, i2] of triangles) {
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i0 * 3]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i0 * 3 + 1]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i0 * 3 + 2]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i1 * 3]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i1 * 3 + 1]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i1 * 3 + 2]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i2 * 3]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i2 * 3 + 1]]);
			buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i2 * 3 + 2]]);
			if (geoInfo.skeleton) {
				buffers.vertexWeights.push(faceWeights[i0 * 4]);
				buffers.vertexWeights.push(faceWeights[i0 * 4 + 1]);
				buffers.vertexWeights.push(faceWeights[i0 * 4 + 2]);
				buffers.vertexWeights.push(faceWeights[i0 * 4 + 3]);
				buffers.vertexWeights.push(faceWeights[i1 * 4]);
				buffers.vertexWeights.push(faceWeights[i1 * 4 + 1]);
				buffers.vertexWeights.push(faceWeights[i1 * 4 + 2]);
				buffers.vertexWeights.push(faceWeights[i1 * 4 + 3]);
				buffers.vertexWeights.push(faceWeights[i2 * 4]);
				buffers.vertexWeights.push(faceWeights[i2 * 4 + 1]);
				buffers.vertexWeights.push(faceWeights[i2 * 4 + 2]);
				buffers.vertexWeights.push(faceWeights[i2 * 4 + 3]);
				buffers.weightsIndices.push(faceWeightIndices[i0 * 4]);
				buffers.weightsIndices.push(faceWeightIndices[i0 * 4 + 1]);
				buffers.weightsIndices.push(faceWeightIndices[i0 * 4 + 2]);
				buffers.weightsIndices.push(faceWeightIndices[i0 * 4 + 3]);
				buffers.weightsIndices.push(faceWeightIndices[i1 * 4]);
				buffers.weightsIndices.push(faceWeightIndices[i1 * 4 + 1]);
				buffers.weightsIndices.push(faceWeightIndices[i1 * 4 + 2]);
				buffers.weightsIndices.push(faceWeightIndices[i1 * 4 + 3]);
				buffers.weightsIndices.push(faceWeightIndices[i2 * 4]);
				buffers.weightsIndices.push(faceWeightIndices[i2 * 4 + 1]);
				buffers.weightsIndices.push(faceWeightIndices[i2 * 4 + 2]);
				buffers.weightsIndices.push(faceWeightIndices[i2 * 4 + 3]);
			}
			if (geoInfo.color) {
				buffers.colors.push(faceColors[i0 * 3]);
				buffers.colors.push(faceColors[i0 * 3 + 1]);
				buffers.colors.push(faceColors[i0 * 3 + 2]);
				buffers.colors.push(faceColors[i1 * 3]);
				buffers.colors.push(faceColors[i1 * 3 + 1]);
				buffers.colors.push(faceColors[i1 * 3 + 2]);
				buffers.colors.push(faceColors[i2 * 3]);
				buffers.colors.push(faceColors[i2 * 3 + 1]);
				buffers.colors.push(faceColors[i2 * 3 + 2]);
			}
			if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {
				buffers.materialIndex.push(materialIndex);
				buffers.materialIndex.push(materialIndex);
				buffers.materialIndex.push(materialIndex);
			}
			if (geoInfo.normal) {
				buffers.normal.push(faceNormals[i0 * 3]);
				buffers.normal.push(faceNormals[i0 * 3 + 1]);
				buffers.normal.push(faceNormals[i0 * 3 + 2]);
				buffers.normal.push(faceNormals[i1 * 3]);
				buffers.normal.push(faceNormals[i1 * 3 + 1]);
				buffers.normal.push(faceNormals[i1 * 3 + 2]);
				buffers.normal.push(faceNormals[i2 * 3]);
				buffers.normal.push(faceNormals[i2 * 3 + 1]);
				buffers.normal.push(faceNormals[i2 * 3 + 2]);
			}
			if (geoInfo.uv) {
				geoInfo.uv.forEach(function (uv, j) {
					if (buffers.uvs[j] === undefined) buffers.uvs[j] = [];
					buffers.uvs[j].push(faceUVs[j][i0 * 2]);
					buffers.uvs[j].push(faceUVs[j][i0 * 2 + 1]);
					buffers.uvs[j].push(faceUVs[j][i1 * 2]);
					buffers.uvs[j].push(faceUVs[j][i1 * 2 + 1]);
					buffers.uvs[j].push(faceUVs[j][i2 * 2]);
					buffers.uvs[j].push(faceUVs[j][i2 * 2 + 1]);
				});
			}
		}
	}
	addMorphTargets(parentGeo, parentGeoNode, morphTargets, preTransform) {
		if (morphTargets.length === 0) return;
		parentGeo.morphTargetsRelative = true;
		parentGeo.morphAttributes.position = [];
		const scope = this;
		morphTargets.forEach(function (morphTarget) {
			morphTarget.rawTargets.forEach(function (rawTarget) {
				const morphGeoNode = fbxTree.Objects.Geometry[rawTarget.geoID];
				if (morphGeoNode !== undefined) {
					scope.genMorphGeometry(parentGeo, parentGeoNode, morphGeoNode, preTransform, rawTarget.name);
				}
			});
		});
	}
	genMorphGeometry(parentGeo, parentGeoNode, morphGeoNode, preTransform, name) {
		const basePositions = parentGeoNode.Vertices !== undefined ? parentGeoNode.Vertices.a : [];
		const baseIndices = parentGeoNode.PolygonVertexIndex !== undefined ? parentGeoNode.PolygonVertexIndex.a : [];
		const morphPositionsSparse = morphGeoNode.Vertices !== undefined ? morphGeoNode.Vertices.a : [];
		const morphIndices = morphGeoNode.Indexes !== undefined ? morphGeoNode.Indexes.a : [];
		const length = parentGeo.attributes.position.count * 3;
		const morphPositions = new Float32Array(length);
		for (let i = 0; i < morphIndices.length; i++) {
			const morphIndex = morphIndices[i] * 3;
			morphPositions[morphIndex] = morphPositionsSparse[i * 3];
			morphPositions[morphIndex + 1] = morphPositionsSparse[i * 3 + 1];
			morphPositions[morphIndex + 2] = morphPositionsSparse[i * 3 + 2];
		}
		const morphGeoInfo = {
			vertexIndices: baseIndices,
			vertexPositions: morphPositions,
			baseVertexPositions: basePositions
		};
		const morphBuffers = this.genBuffers(morphGeoInfo);
		const positionAttribute = new Float32BufferAttribute(morphBuffers.vertex, 3);
		positionAttribute.name = name || morphGeoNode.attrName;
		positionAttribute.applyMatrix4(preTransform);
		parentGeo.morphAttributes.position.push(positionAttribute);
	}
	parseNormals(NormalNode) {
		const mappingType = NormalNode.MappingInformationType;
		const referenceType = NormalNode.ReferenceInformationType;
		const buffer = NormalNode.Normals.a;
		let indexBuffer = [];
		if (referenceType === 'IndexToDirect') {
			if ('NormalIndex' in NormalNode) {
				indexBuffer = NormalNode.NormalIndex.a;
			} else if ('NormalsIndex' in NormalNode) {
				indexBuffer = NormalNode.NormalsIndex.a;
			}
		}
		return {
			dataSize: 3,
			buffer: buffer,
			indices: indexBuffer,
			mappingType: mappingType,
			referenceType: referenceType
		};
	}
	parseUVs(UVNode) {
		const mappingType = UVNode.MappingInformationType;
		const referenceType = UVNode.ReferenceInformationType;
		const buffer = UVNode.UV.a;
		let indexBuffer = [];
		if (referenceType === 'IndexToDirect') {
			indexBuffer = UVNode.UVIndex.a;
		}
		return {
			dataSize: 2,
			buffer: buffer,
			indices: indexBuffer,
			mappingType: mappingType,
			referenceType: referenceType
		};
	}
	parseVertexColors(ColorNode) {
		const mappingType = ColorNode.MappingInformationType;
		const referenceType = ColorNode.ReferenceInformationType;
		const buffer = ColorNode.Colors.a;
		let indexBuffer = [];
		if (referenceType === 'IndexToDirect') {
			indexBuffer = ColorNode.ColorIndex.a;
		}
		for (let i = 0, c = new Color(); i < buffer.length; i += 4) {
			c.fromArray(buffer, i);
			ColorManagement.colorSpaceToWorking(c, SRGBColorSpace);
			c.toArray(buffer, i);
		}
		return {
			dataSize: 4,
			buffer: buffer,
			indices: indexBuffer,
			mappingType: mappingType,
			referenceType: referenceType
		};
	}
	parseMaterialIndices(MaterialNode) {
		const mappingType = MaterialNode.MappingInformationType;
		const referenceType = MaterialNode.ReferenceInformationType;
		if (mappingType === 'NoMappingInformation') {
			return {
				dataSize: 1,
				buffer: [0],
				indices: [0],
				mappingType: 'AllSame',
				referenceType: referenceType
			};
		}
		const materialIndexBuffer = MaterialNode.Materials.a;
		const materialIndices = [];
		for (let i = 0; i < materialIndexBuffer.length; ++i) {
			materialIndices.push(i);
		}
		return {
			dataSize: 1,
			buffer: materialIndexBuffer,
			indices: materialIndices,
			mappingType: mappingType,
			referenceType: referenceType
		};
	}
	parseNurbsGeometry(geoNode) {
		const order = parseInt(geoNode.Order);
		if (isNaN(order)) {
			console.error('THREE.FBXLoader: Invalid Order %s given for geometry ID: %s', geoNode.Order, geoNode.id);
			return new BufferGeometry();
		}
		const degree = order - 1;
		const knots = geoNode.KnotVector.a;
		const controlPoints = [];
		const pointsValues = geoNode.Points.a;
		for (let i = 0, l = pointsValues.length; i < l; i += 4) {
			controlPoints.push(new Vector4().fromArray(pointsValues, i));
		}
		let startKnot, endKnot;
		if (geoNode.Form === 'Closed') {
			controlPoints.push(controlPoints[0]);
		} else if (geoNode.Form === 'Periodic') {
			startKnot = degree;
			endKnot = knots.length - 1 - startKnot;
			for (let i = 0; i < degree; ++i) {
				controlPoints.push(controlPoints[i]);
			}
		}
		const curve = new NURBSCurve(degree, knots, controlPoints, startKnot, endKnot);
		const points = curve.getPoints(controlPoints.length * 12);
		return new BufferGeometry().setFromPoints(points);
	}
}
class AnimationParser {
	parse() {
		const animationClips = [];
		const rawClips = this.parseClips();
		if (rawClips !== undefined) {
			for (const key in rawClips) {
				const rawClip = rawClips[key];
				const clip = this.addClip(rawClip);
				animationClips.push(clip);
			}
		}
		return animationClips;
	}
	parseClips() {
		if (fbxTree.Objects.AnimationCurve === undefined) return undefined;
		const curveNodesMap = this.parseAnimationCurveNodes();
		this.parseAnimationCurves(curveNodesMap);
		const layersMap = this.parseAnimationLayers(curveNodesMap);
		const rawClips = this.parseAnimStacks(layersMap);
		return rawClips;
	}
	parseAnimationCurveNodes() {
		const rawCurveNodes = fbxTree.Objects.AnimationCurveNode;
		const curveNodesMap = new Map();
		for (const nodeID in rawCurveNodes) {
			const rawCurveNode = rawCurveNodes[nodeID];
			if (rawCurveNode.attrName.match(/S|R|T|DeformPercent/) !== null) {
				const curveNode = {
					id: rawCurveNode.id,
					attr: rawCurveNode.attrName,
					curves: {},
				};
				curveNodesMap.set(curveNode.id, curveNode);
			}
		}
		return curveNodesMap;
	}
	parseAnimationCurves(curveNodesMap) {
		const rawCurves = fbxTree.Objects.AnimationCurve;
		for (const nodeID in rawCurves) {
			const animationCurve = {
				id: rawCurves[nodeID].id,
				times: rawCurves[nodeID].KeyTime.a.map(convertFBXTimeToSeconds),
				values: rawCurves[nodeID].KeyValueFloat.a,
			};
			const relationships = connections.get(animationCurve.id);
			if (relationships !== undefined) {
				const animationCurveID = relationships.parents[0].ID;
				const animationCurveRelationship = relationships.parents[0].relationship;
				if (animationCurveRelationship.match(/X/)) {
					curveNodesMap.get(animationCurveID).curves['x'] = animationCurve;
				} else if (animationCurveRelationship.match(/Y/)) {
					curveNodesMap.get(animationCurveID).curves['y'] = animationCurve;
				} else if (animationCurveRelationship.match(/Z/)) {
					curveNodesMap.get(animationCurveID).curves['z'] = animationCurve;
				} else if (animationCurveRelationship.match(/DeformPercent/) && curveNodesMap.has(animationCurveID)) {
					curveNodesMap.get(animationCurveID).curves['morph'] = animationCurve;
				}
			}
		}
	}
	parseAnimationLayers(curveNodesMap) {
		const rawLayers = fbxTree.Objects.AnimationLayer;
		const layersMap = new Map();
		for (const nodeID in rawLayers) {
			const layerCurveNodes = [];
			const connection = connections.get(parseInt(nodeID));
			if (connection !== undefined) {
				const children = connection.children;
				children.forEach(function (child, i) {
					if (curveNodesMap.has(child.ID)) {
						const curveNode = curveNodesMap.get(child.ID);
						if (curveNode.curves.x !== undefined || curveNode.curves.y !== undefined || curveNode.curves.z !== undefined) {
							if (layerCurveNodes[i] === undefined) {
								const modelID = connections.get(child.ID).parents.filter(function (parent) {
									return parent.relationship !== undefined;
								})[0].ID;
								if (modelID !== undefined) {
									const rawModel = fbxTree.Objects.Model[modelID.toString()];
									if (rawModel === undefined) {
										console.warn('THREE.FBXLoader: Encountered a unused curve.', child);
										return;
									}
									const node = {
										modelName: rawModel.attrName ? PropertyBinding.sanitizeNodeName(rawModel.attrName) : '',
										ID: rawModel.id,
										initialPosition: [0, 0, 0],
										initialRotation: [0, 0, 0],
										initialScale: [1, 1, 1],
									};
									sceneGraph.traverse(function (child) {
										if (child.ID === rawModel.id) {
											node.transform = child.matrix;
											if (child.userData.transformData) node.eulerOrder = child.userData.transformData.eulerOrder;
										}
									});
									if (!node.transform) node.transform = new Matrix4();
									if ('PreRotation' in rawModel) node.preRotation = rawModel.PreRotation.value;
									if ('PostRotation' in rawModel) node.postRotation = rawModel.PostRotation.value;
									layerCurveNodes[i] = node;
								}
							}
							if (layerCurveNodes[i]) layerCurveNodes[i][curveNode.attr] = curveNode;
						} else if (curveNode.curves.morph !== undefined) {
							if (layerCurveNodes[i] === undefined) {
								const deformerID = connections.get(child.ID).parents.filter(function (parent) {
									return parent.relationship !== undefined;
								})[0].ID;
								const morpherID = connections.get(deformerID).parents[0].ID;
								const geoID = connections.get(morpherID).parents[0].ID;
								const modelID = connections.get(geoID).parents[0].ID;
								const rawModel = fbxTree.Objects.Model[modelID];
								const node = {
									modelName: rawModel.attrName ? PropertyBinding.sanitizeNodeName(rawModel.attrName) : '',
									morphName: fbxTree.Objects.Deformer[deformerID].attrName,
								};
								layerCurveNodes[i] = node;
							}
							layerCurveNodes[i][curveNode.attr] = curveNode;
						}
					}
				});
				layersMap.set(parseInt(nodeID), layerCurveNodes);
			}
		}
		return layersMap;
	}
	parseAnimStacks(layersMap) {
		const rawStacks = fbxTree.Objects.AnimationStack;
		const rawClips = {};
		for (const nodeID in rawStacks) {
			const children = connections.get(parseInt(nodeID)).children;
			if (children.length > 1) {
				console.warn('THREE.FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.');
			}
			const layer = layersMap.get(children[0].ID);
			rawClips[nodeID] = {
				name: rawStacks[nodeID].attrName,
				layer: layer,
			};
		}
		return rawClips;
	}
	addClip(rawClip) {
		let tracks = [];
		const scope = this;
		rawClip.layer.forEach(function (rawTracks) {
			tracks = tracks.concat(scope.generateTracks(rawTracks));
		});
		return new AnimationClip(rawClip.name, - 1, tracks);
	}
	generateTracks(rawTracks) {
		const tracks = [];
		let initialPosition = new Vector3();
		let initialScale = new Vector3();
		if (rawTracks.transform) rawTracks.transform.decompose(initialPosition, new Quaternion(), initialScale);
		initialPosition = initialPosition.toArray();
		initialScale = initialScale.toArray();
		if (rawTracks.T !== undefined && Object.keys(rawTracks.T.curves).length > 0) {
			const positionTrack = this.generateVectorTrack(rawTracks.modelName, rawTracks.T.curves, initialPosition, 'position');
			if (positionTrack !== undefined) tracks.push(positionTrack);
		}
		if (rawTracks.R !== undefined && Object.keys(rawTracks.R.curves).length > 0) {
			const rotationTrack = this.generateRotationTrack(rawTracks.modelName, rawTracks.R.curves, rawTracks.preRotation, rawTracks.postRotation, rawTracks.eulerOrder);
			if (rotationTrack !== undefined) tracks.push(rotationTrack);
		}
		if (rawTracks.S !== undefined && Object.keys(rawTracks.S.curves).length > 0) {
			const scaleTrack = this.generateVectorTrack(rawTracks.modelName, rawTracks.S.curves, initialScale, 'scale');
			if (scaleTrack !== undefined) tracks.push(scaleTrack);
		}
		if (rawTracks.DeformPercent !== undefined) {
			const morphTrack = this.generateMorphTrack(rawTracks);
			if (morphTrack !== undefined) tracks.push(morphTrack);
		}
		return tracks;
	}
	generateVectorTrack(modelName, curves, initialValue, type) {
		const times = this.getTimesForAllAxes(curves);
		const values = this.getKeyframeTrackValues(times, curves, initialValue);
		return new VectorKeyframeTrack(modelName + '.' + type, times, values);
	}
	generateRotationTrack(modelName, curves, preRotation, postRotation, eulerOrder) {
		let times;
		let values;
		if (curves.x !== undefined && curves.y !== undefined && curves.z !== undefined) {
			const result = this.interpolateRotations(curves.x, curves.y, curves.z, eulerOrder);
			times = result[0];
			values = result[1];
		}
		const defaultEulerOrder = getEulerOrder(0);
		if (preRotation !== undefined) {
			preRotation = preRotation.map(MathUtils.degToRad);
			preRotation.push(defaultEulerOrder);
			preRotation = new Euler().fromArray(preRotation);
			preRotation = new Quaternion().setFromEuler(preRotation);
		}
		if (postRotation !== undefined) {
			postRotation = postRotation.map(MathUtils.degToRad);
			postRotation.push(defaultEulerOrder);
			postRotation = new Euler().fromArray(postRotation);
			postRotation = new Quaternion().setFromEuler(postRotation).invert();
		}
		const quaternion = new Quaternion();
		const euler = new Euler();
		const quaternionValues = [];
		if (!values || !times) return new QuaternionKeyframeTrack(modelName + '.quaternion', [0], [0]);
		for (let i = 0; i < values.length; i += 3) {
			euler.set(values[i], values[i + 1], values[i + 2], eulerOrder);
			quaternion.setFromEuler(euler);
			if (preRotation !== undefined) quaternion.premultiply(preRotation);
			if (postRotation !== undefined) quaternion.multiply(postRotation);
			if (i > 2) {
				const prevQuat = new Quaternion().fromArray(
					quaternionValues,
					((i - 3) / 3) * 4
				);
				if (prevQuat.dot(quaternion) < 0) {
					quaternion.set(- quaternion.x, - quaternion.y, - quaternion.z, - quaternion.w);
				}
			}
			quaternion.toArray(quaternionValues, (i / 3) * 4);
		}
		return new QuaternionKeyframeTrack(modelName + '.quaternion', times, quaternionValues);
	}
	generateMorphTrack(rawTracks) {
		const curves = rawTracks.DeformPercent.curves.morph;
		const values = curves.values.map(function (val) {
			return val / 100;
		});
		const morphNum = sceneGraph.getObjectByName(rawTracks.modelName).morphTargetDictionary[rawTracks.morphName];
		return new NumberKeyframeTrack(rawTracks.modelName + '.morphTargetInfluences[' + morphNum + ']', curves.times, values);
	}
	getTimesForAllAxes(curves) {
		let times = [];
		if (curves.x !== undefined) times = times.concat(curves.x.times);
		if (curves.y !== undefined) times = times.concat(curves.y.times);
		if (curves.z !== undefined) times = times.concat(curves.z.times);
		times = times.sort(function (a, b) {
			return a - b;
		});
		if (times.length > 1) {
			let targetIndex = 1;
			let lastValue = times[0];
			for (let i = 1; i < times.length; i++) {
				const currentValue = times[i];
				if (currentValue !== lastValue) {
					times[targetIndex] = currentValue;
					lastValue = currentValue;
					targetIndex++;
				}
			}
			times = times.slice(0, targetIndex);
		}
		return times;
	}
	getKeyframeTrackValues(times, curves, initialValue) {
		const prevValue = initialValue;
		const values = [];
		let xIndex = - 1;
		let yIndex = - 1;
		let zIndex = - 1;
		times.forEach(function (time) {
			if (curves.x) xIndex = curves.x.times.indexOf(time);
			if (curves.y) yIndex = curves.y.times.indexOf(time);
			if (curves.z) zIndex = curves.z.times.indexOf(time);
			if (xIndex !== - 1) {
				const xValue = curves.x.values[xIndex];
				values.push(xValue);
				prevValue[0] = xValue;
			} else {
				values.push(prevValue[0]);
			}
			if (yIndex !== - 1) {
				const yValue = curves.y.values[yIndex];
				values.push(yValue);
				prevValue[1] = yValue;
			} else {
				values.push(prevValue[1]);
			}
			if (zIndex !== - 1) {
				const zValue = curves.z.values[zIndex];
				values.push(zValue);
				prevValue[2] = zValue;
			} else {
				values.push(prevValue[2]);
			}
		});
		return values;
	}
	interpolateRotations(curvex, curvey, curvez, eulerOrder) {
		const times = [];
		const values = [];
		times.push(curvex.times[0]);
		values.push(MathUtils.degToRad(curvex.values[0]));
		values.push(MathUtils.degToRad(curvey.values[0]));
		values.push(MathUtils.degToRad(curvez.values[0]));
		for (let i = 1; i < curvex.values.length; i++) {
			const initialValue = [
				curvex.values[i - 1],
				curvey.values[i - 1],
				curvez.values[i - 1],
			];
			if (isNaN(initialValue[0]) || isNaN(initialValue[1]) || isNaN(initialValue[2])) {
				continue;
			}
			const initialValueRad = initialValue.map(MathUtils.degToRad);
			const currentValue = [
				curvex.values[i],
				curvey.values[i],
				curvez.values[i],
			];
			if (isNaN(currentValue[0]) || isNaN(currentValue[1]) || isNaN(currentValue[2])) {
				continue;
			}
			const currentValueRad = currentValue.map(MathUtils.degToRad);
			const valuesSpan = [
				currentValue[0] - initialValue[0],
				currentValue[1] - initialValue[1],
				currentValue[2] - initialValue[2],
			];
			const absoluteSpan = [
				Math.abs(valuesSpan[0]),
				Math.abs(valuesSpan[1]),
				Math.abs(valuesSpan[2]),
			];
			if (absoluteSpan[0] >= 180 || absoluteSpan[1] >= 180 || absoluteSpan[2] >= 180) {
				const maxAbsSpan = Math.max(...absoluteSpan);
				const numSubIntervals = maxAbsSpan / 180;
				const E1 = new Euler(...initialValueRad, eulerOrder);
				const E2 = new Euler(...currentValueRad, eulerOrder);
				const Q1 = new Quaternion().setFromEuler(E1);
				const Q2 = new Quaternion().setFromEuler(E2);
				if (Q1.dot(Q2)) {
					Q2.set(- Q2.x, - Q2.y, - Q2.z, - Q2.w);
				}
				const initialTime = curvex.times[i - 1];
				const timeSpan = curvex.times[i] - initialTime;
				const Q = new Quaternion();
				const E = new Euler();
				for (let t = 0; t < 1; t += 1 / numSubIntervals) {
					Q.copy(Q1.clone().slerp(Q2.clone(), t));
					times.push(initialTime + t * timeSpan);
					E.setFromQuaternion(Q, eulerOrder);
					values.push(E.x);
					values.push(E.y);
					values.push(E.z);
				}
			} else {
				times.push(curvex.times[i]);
				values.push(MathUtils.degToRad(curvex.values[i]));
				values.push(MathUtils.degToRad(curvey.values[i]));
				values.push(MathUtils.degToRad(curvez.values[i]));
			}
		}
		return [times, values];
	}
}
class TextParser {
	getPrevNode() {
		return this.nodeStack[this.currentIndent - 2];
	}
	getCurrentNode() {
		return this.nodeStack[this.currentIndent - 1];
	}
	getCurrentProp() {
		return this.currentProp;
	}
	pushStack(node) {
		this.nodeStack.push(node);
		this.currentIndent += 1;
	}
	popStack() {
		this.nodeStack.pop();
		this.currentIndent -= 1;
	}
	setCurrentProp(val, name) {
		this.currentProp = val;
		this.currentPropName = name;
	}
	parse(text) {
		this.currentIndent = 0;
		this.allNodes = new FBXTree();
		this.nodeStack = [];
		this.currentProp = [];
		this.currentPropName = '';
		const scope = this;
		const split = text.split(/[\r\n]+/);
		split.forEach(function (line, i) {
			const matchComment = line.match(/^[\s\t]*;/);
			const matchEmpty = line.match(/^[\s\t]*$/);
			if (matchComment || matchEmpty) return;
			const matchBeginning = line.match('^\\t{' + scope.currentIndent + '}(\\w+):(.*){', '');
			const matchProperty = line.match('^\\t{' + (scope.currentIndent) + '}(\\w+):[\\s\\t\\r\\n](.*)');
			const matchEnd = line.match('^\\t{' + (scope.currentIndent - 1) + '}}');
			if (matchBeginning) {
				scope.parseNodeBegin(line, matchBeginning);
			} else if (matchProperty) {
				scope.parseNodeProperty(line, matchProperty, split[++i]);
			} else if (matchEnd) {
				scope.popStack();
			} else if (line.match(/^[^\s\t}]/)) {
				scope.parseNodePropertyContinued(line);
			}
		});
		return this.allNodes;
	}
	parseNodeBegin(line, property) {
		const nodeName = property[1].trim().replace(/^"/, '').replace(/"$/, '');
		const nodeAttrs = property[2].split(',').map(function (attr) {
			return attr.trim().replace(/^"/, '').replace(/"$/, '');
		});
		const node = { name: nodeName };
		const attrs = this.parseNodeAttr(nodeAttrs);
		const currentNode = this.getCurrentNode();
		if (this.currentIndent === 0) {
			this.allNodes.add(nodeName, node);
		} else {
			if (nodeName in currentNode) {
				if (nodeName === 'PoseNode') {
					currentNode.PoseNode.push(node);
				} else if (currentNode[nodeName].id !== undefined) {
					currentNode[nodeName] = {};
					currentNode[nodeName][currentNode[nodeName].id] = currentNode[nodeName];
				}
				if (attrs.id !== '') currentNode[nodeName][attrs.id] = node;
			} else if (typeof attrs.id === 'number') {
				currentNode[nodeName] = {};
				currentNode[nodeName][attrs.id] = node;
			} else if (nodeName !== 'Properties70') {
				if (nodeName === 'PoseNode') currentNode[nodeName] = [node];
				else currentNode[nodeName] = node;
			}
		}
		if (typeof attrs.id === 'number') node.id = attrs.id;
		if (attrs.name !== '') node.attrName = attrs.name;
		if (attrs.type !== '') node.attrType = attrs.type;
		this.pushStack(node);
	}
	parseNodeAttr(attrs) {
		let id = attrs[0];
		if (attrs[0] !== '') {
			id = parseInt(attrs[0]);
			if (isNaN(id)) {
				id = attrs[0];
			}
		}
		let name = '', type = '';
		if (attrs.length > 1) {
			name = attrs[1].replace(/^(\w+)::/, '');
			type = attrs[2];
		}
		return { id: id, name: name, type: type };
	}
	parseNodeProperty(line, property, contentLine) {
		let propName = property[1].replace(/^"/, '').replace(/"$/, '').trim();
		let propValue = property[2].replace(/^"/, '').replace(/"$/, '').trim();
		if (propName === 'Content' && propValue === ',') {
			propValue = contentLine.replace(/"/g, '').replace(/,$/, '').trim();
		}
		const currentNode = this.getCurrentNode();
		const parentName = currentNode.name;
		if (parentName === 'Properties70') {
			this.parseNodeSpecialProperty(line, propName, propValue);
			return;
		}
		if (propName === 'C') {
			const connProps = propValue.split(',').slice(1);
			const from = parseInt(connProps[0]);
			const to = parseInt(connProps[1]);
			let rest = propValue.split(',').slice(3);
			rest = rest.map(function (elem) {
				return elem.trim().replace(/^"/, '');
			});
			propName = 'connections';
			propValue = [from, to];
			append(propValue, rest);
			if (currentNode[propName] === undefined) {
				currentNode[propName] = [];
			}
		}
		if (propName === 'Node') currentNode.id = propValue;
		if (propName in currentNode && Array.isArray(currentNode[propName])) {
			currentNode[propName].push(propValue);
		} else {
			if (propName !== 'a') currentNode[propName] = propValue;
			else currentNode.a = propValue;
		}
		this.setCurrentProp(currentNode, propName);
		if (propName === 'a' && propValue.slice(- 1) !== ',') {
			currentNode.a = parseNumberArray(propValue);
		}
	}
	parseNodePropertyContinued(line) {
		const currentNode = this.getCurrentNode();
		currentNode.a += line;
		if (line.slice(- 1) !== ',') {
			currentNode.a = parseNumberArray(currentNode.a);
		}
	}
	parseNodeSpecialProperty(line, propName, propValue) {
		const props = propValue.split('",').map(function (prop) {
			return prop.trim().replace(/^\"/, '').replace(/\s/, '_');
		});
		const innerPropName = props[0];
		const innerPropType1 = props[1];
		const innerPropType2 = props[2];
		const innerPropFlag = props[3];
		let innerPropValue = props[4];
		switch (innerPropType1) {
			case 'int':
			case 'enum':
			case 'bool':
			case 'ULongLong':
			case 'double':
			case 'Number':
			case 'FieldOfView':
				innerPropValue = parseFloat(innerPropValue);
				break;
			case 'Color':
			case 'ColorRGB':
			case 'Vector3D':
			case 'Lcl_Translation':
			case 'Lcl_Rotation':
			case 'Lcl_Scaling':
				innerPropValue = parseNumberArray(innerPropValue);
				break;
		}
		this.getPrevNode()[innerPropName] = {
			'type': innerPropType1,
			'type2': innerPropType2,
			'flag': innerPropFlag,
			'value': innerPropValue
		};
		this.setCurrentProp(this.getPrevNode(), innerPropName);
	}
}
class BinaryParser {
	parse(buffer) {
		const reader = new BinaryReader(buffer);
		reader.skip(23);
		const version = reader.getUint32();
		if (version < 6400) {
			throw new Error('THREE.FBXLoader: FBX version not supported, FileVersion: ' + version);
		}
		const allNodes = new FBXTree();
		while (!this.endOfContent(reader)) {
			const node = this.parseNode(reader, version);
			if (node !== null) allNodes.add(node.name, node);
		}
		return allNodes;
	}
	endOfContent(reader) {
		if (reader.size() % 16 === 0) {
			return ((reader.getOffset() + 160 + 16) & ~0xf) >= reader.size();
		} else {
			return reader.getOffset() + 160 + 16 >= reader.size();
		}
	}
	parseNode(reader, version) {
		const node = {};
		const endOffset = (version >= 7500) ? reader.getUint64() : reader.getUint32();
		const numProperties = (version >= 7500) ? reader.getUint64() : reader.getUint32();
		(version >= 7500) ? reader.getUint64() : reader.getUint32();
		const nameLen = reader.getUint8();
		const name = reader.getString(nameLen);
		if (endOffset === 0) return null;
		const propertyList = [];
		for (let i = 0; i < numProperties; i++) {
			propertyList.push(this.parseProperty(reader));
		}
		const id = propertyList.length > 0 ? propertyList[0] : '';
		const attrName = propertyList.length > 1 ? propertyList[1] : '';
		const attrType = propertyList.length > 2 ? propertyList[2] : '';
		node.singleProperty = (numProperties === 1 && reader.getOffset() === endOffset) ? true : false;
		while (endOffset > reader.getOffset()) {
			const subNode = this.parseNode(reader, version);
			if (subNode !== null) this.parseSubNode(name, node, subNode);
		}
		node.propertyList = propertyList;
		if (typeof id === 'number') node.id = id;
		if (attrName !== '') node.attrName = attrName;
		if (attrType !== '') node.attrType = attrType;
		if (name !== '') node.name = name;
		return node;
	}
	parseSubNode(name, node, subNode) {
		if (subNode.singleProperty === true) {
			const value = subNode.propertyList[0];
			if (Array.isArray(value)) {
				node[subNode.name] = subNode;
				subNode.a = value;
			} else {
				node[subNode.name] = value;
			}
		} else if (name === 'Connections' && subNode.name === 'C') {
			const array = [];
			subNode.propertyList.forEach(function (property, i) {
				if (i !== 0) array.push(property);
			});
			if (node.connections === undefined) {
				node.connections = [];
			}
			node.connections.push(array);
		} else if (subNode.name === 'Properties70') {
			const keys = Object.keys(subNode);
			keys.forEach(function (key) {
				node[key] = subNode[key];
			});
		} else if (name === 'Properties70' && subNode.name === 'P') {
			let innerPropName = subNode.propertyList[0];
			let innerPropType1 = subNode.propertyList[1];
			const innerPropType2 = subNode.propertyList[2];
			const innerPropFlag = subNode.propertyList[3];
			let innerPropValue;
			if (innerPropName.indexOf('Lcl ') === 0) innerPropName = innerPropName.replace('Lcl ', 'Lcl_');
			if (innerPropType1.indexOf('Lcl ') === 0) innerPropType1 = innerPropType1.replace('Lcl ', 'Lcl_');
			if (innerPropType1 === 'Color' || innerPropType1 === 'ColorRGB' || innerPropType1 === 'Vector' || innerPropType1 === 'Vector3D' || innerPropType1.indexOf('Lcl_') === 0) {
				innerPropValue = [
					subNode.propertyList[4],
					subNode.propertyList[5],
					subNode.propertyList[6]
				];
			} else {
				innerPropValue = subNode.propertyList[4];
			}
			node[innerPropName] = {
				'type': innerPropType1,
				'type2': innerPropType2,
				'flag': innerPropFlag,
				'value': innerPropValue
			};
		} else if (node[subNode.name] === undefined) {
			if (typeof subNode.id === 'number') {
				node[subNode.name] = {};
				node[subNode.name][subNode.id] = subNode;
			} else {
				node[subNode.name] = subNode;
			}
		} else {
			if (subNode.name === 'PoseNode') {
				if (!Array.isArray(node[subNode.name])) {
					node[subNode.name] = [node[subNode.name]];
				}
				node[subNode.name].push(subNode);
			} else if (node[subNode.name][subNode.id] === undefined) {
				node[subNode.name][subNode.id] = subNode;
			}
		}
	}
	parseProperty(reader) {
		const type = reader.getString(1);
		let length;
		switch (type) {
			case 'C':
				return reader.getBoolean();
			case 'D':
				return reader.getFloat64();
			case 'F':
				return reader.getFloat32();
			case 'I':
				return reader.getInt32();
			case 'L':
				return reader.getInt64();
			case 'R':
				length = reader.getUint32();
				return reader.getArrayBuffer(length);
			case 'S':
				length = reader.getUint32();
				return reader.getString(length);
			case 'Y':
				return reader.getInt16();
			case 'b':
			case 'c':
			case 'd':
			case 'f':
			case 'i':
			case 'l':
				const arrayLength = reader.getUint32();
				const encoding = reader.getUint32();
				const compressedLength = reader.getUint32();
				if (encoding === 0) {
					switch (type) {
						case 'b':
						case 'c':
							return reader.getBooleanArray(arrayLength);
						case 'd':
							return reader.getFloat64Array(arrayLength);
						case 'f':
							return reader.getFloat32Array(arrayLength);
						case 'i':
							return reader.getInt32Array(arrayLength);
						case 'l':
							return reader.getInt64Array(arrayLength);
					}
				}
				const data = unzlibSync(new Uint8Array(reader.getArrayBuffer(compressedLength)));
				const reader2 = new BinaryReader(data.buffer);
				switch (type) {
					case 'b':
					case 'c':
						return reader2.getBooleanArray(arrayLength);
					case 'd':
						return reader2.getFloat64Array(arrayLength);
					case 'f':
						return reader2.getFloat32Array(arrayLength);
					case 'i':
						return reader2.getInt32Array(arrayLength);
					case 'l':
						return reader2.getInt64Array(arrayLength);
				}
				break;
			default:
				throw new Error('THREE.FBXLoader: Unknown property type ' + type);
		}
	}
}
class BinaryReader {
	constructor(buffer, littleEndian) {
		this.dv = new DataView(buffer);
		this.offset = 0;
		this.littleEndian = (littleEndian !== undefined) ? littleEndian : true;
		this._textDecoder = new TextDecoder();
	}
	getOffset() {
		return this.offset;
	}
	size() {
		return this.dv.buffer.byteLength;
	}
	skip(length) {
		this.offset += length;
	}
	getBoolean() {
		return (this.getUint8() & 1) === 1;
	}
	getBooleanArray(size) {
		const a = [];
		for (let i = 0; i < size; i++) {
			a.push(this.getBoolean());
		}
		return a;
	}
	getUint8() {
		const value = this.dv.getUint8(this.offset);
		this.offset += 1;
		return value;
	}
	getInt16() {
		const value = this.dv.getInt16(this.offset, this.littleEndian);
		this.offset += 2;
		return value;
	}
	getInt32() {
		const value = this.dv.getInt32(this.offset, this.littleEndian);
		this.offset += 4;
		return value;
	}
	getInt32Array(size) {
		const a = [];
		for (let i = 0; i < size; i++) {
			a.push(this.getInt32());
		}
		return a;
	}
	getUint32() {
		const value = this.dv.getUint32(this.offset, this.littleEndian);
		this.offset += 4;
		return value;
	}
	getInt64() {
		let low, high;
		if (this.littleEndian) {
			low = this.getUint32();
			high = this.getUint32();
		} else {
			high = this.getUint32();
			low = this.getUint32();
		}
		if (high & 0x80000000) {
			high = ~high & 0xFFFFFFFF;
			low = ~low & 0xFFFFFFFF;
			if (low === 0xFFFFFFFF) high = (high + 1) & 0xFFFFFFFF;
			low = (low + 1) & 0xFFFFFFFF;
			return - (high * 0x100000000 + low);
		}
		return high * 0x100000000 + low;
	}
	getInt64Array(size) {
		const a = [];
		for (let i = 0; i < size; i++) {
			a.push(this.getInt64());
		}
		return a;
	}
	getUint64() {
		let low, high;
		if (this.littleEndian) {
			low = this.getUint32();
			high = this.getUint32();
		} else {
			high = this.getUint32();
			low = this.getUint32();
		}
		return high * 0x100000000 + low;
	}
	getFloat32() {
		const value = this.dv.getFloat32(this.offset, this.littleEndian);
		this.offset += 4;
		return value;
	}
	getFloat32Array(size) {
		const a = [];
		for (let i = 0; i < size; i++) {
			a.push(this.getFloat32());
		}
		return a;
	}
	getFloat64() {
		const value = this.dv.getFloat64(this.offset, this.littleEndian);
		this.offset += 8;
		return value;
	}
	getFloat64Array(size) {
		const a = [];
		for (let i = 0; i < size; i++) {
			a.push(this.getFloat64());
		}
		return a;
	}
	getArrayBuffer(size) {
		const value = this.dv.buffer.slice(this.offset, this.offset + size);
		this.offset += size;
		return value;
	}
	getString(size) {
		const start = this.offset;
		let a = new Uint8Array(this.dv.buffer, start, size);
		this.skip(size);
		const nullByte = a.indexOf(0);
		if (nullByte >= 0) a = new Uint8Array(this.dv.buffer, start, nullByte);
		return this._textDecoder.decode(a);
	}
}
class FBXTree {
	add(key, val) {
		this[key] = val;
	}
}
function isFbxFormatBinary(buffer) {
	const CORRECT = 'Kaydara\u0020FBX\u0020Binary\u0020\u0020\0';
	return buffer.byteLength >= CORRECT.length && CORRECT === convertArrayBufferToString(buffer, 0, CORRECT.length);
}
function isFbxFormatASCII(text) {
	const CORRECT = ['K', 'a', 'y', 'd', 'a', 'r', 'a', '\\', 'F', 'B', 'X', '\\', 'B', 'i', 'n', 'a', 'r', 'y', '\\', '\\'];
	let cursor = 0;
	function read(offset) {
		const result = text[offset - 1];
		text = text.slice(cursor + offset);
		cursor++;
		return result;
	}
	for (let i = 0; i < CORRECT.length; ++i) {
		const num = read(1);
		if (num === CORRECT[i]) {
			return false;
		}
	}
	return true;
}
function getFbxVersion(text) {
	const versionRegExp = /FBXVersion: (\d+)/;
	const match = text.match(versionRegExp);
	if (match) {
		const version = parseInt(match[1]);
		return version;
	}
	throw new Error('THREE.FBXLoader: Cannot find the version number for the file given.');
}
function convertFBXTimeToSeconds(time) {
	return time / 46186158000;
}
const dataArray = [];
function getData(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
	let index;
	switch (infoObject.mappingType) {
		case 'ByPolygonVertex':
			index = polygonVertexIndex;
			break;
		case 'ByPolygon':
			index = polygonIndex;
			break;
		case 'ByVertice':
			index = vertexIndex;
			break;
		case 'AllSame':
			index = infoObject.indices[0];
			break;
		default:
			console.warn('THREE.FBXLoader: unknown attribute mapping type ' + infoObject.mappingType);
	}
	if (infoObject.referenceType === 'IndexToDirect') index = infoObject.indices[index];
	const from = index * infoObject.dataSize;
	const to = from + infoObject.dataSize;
	return slice(dataArray, infoObject.buffer, from, to);
}
const tempEuler = new Euler();
const tempVec = new Vector3();
function generateTransform(transformData) {
	const lTranslationM = new Matrix4();
	const lPreRotationM = new Matrix4();
	const lRotationM = new Matrix4();
	const lPostRotationM = new Matrix4();
	const lScalingM = new Matrix4();
	const lScalingPivotM = new Matrix4();
	const lScalingOffsetM = new Matrix4();
	const lRotationOffsetM = new Matrix4();
	const lRotationPivotM = new Matrix4();
	const lParentGX = new Matrix4();
	const lParentLX = new Matrix4();
	const lGlobalT = new Matrix4();
	const inheritType = (transformData.inheritType) ? transformData.inheritType : 0;
	if (transformData.translation) lTranslationM.setPosition(tempVec.fromArray(transformData.translation));
	const defaultEulerOrder = getEulerOrder(0);
	if (transformData.preRotation) {
		const array = transformData.preRotation.map(MathUtils.degToRad);
		array.push(defaultEulerOrder);
		lPreRotationM.makeRotationFromEuler(tempEuler.fromArray(array));
	}
	if (transformData.rotation) {
		const array = transformData.rotation.map(MathUtils.degToRad);
		array.push(transformData.eulerOrder || defaultEulerOrder);
		lRotationM.makeRotationFromEuler(tempEuler.fromArray(array));
	}
	if (transformData.postRotation) {
		const array = transformData.postRotation.map(MathUtils.degToRad);
		array.push(defaultEulerOrder);
		lPostRotationM.makeRotationFromEuler(tempEuler.fromArray(array));
		lPostRotationM.invert();
	}
	if (transformData.scale) lScalingM.scale(tempVec.fromArray(transformData.scale));
	if (transformData.scalingOffset) lScalingOffsetM.setPosition(tempVec.fromArray(transformData.scalingOffset));
	if (transformData.scalingPivot) lScalingPivotM.setPosition(tempVec.fromArray(transformData.scalingPivot));
	if (transformData.rotationOffset) lRotationOffsetM.setPosition(tempVec.fromArray(transformData.rotationOffset));
	if (transformData.rotationPivot) lRotationPivotM.setPosition(tempVec.fromArray(transformData.rotationPivot));
	if (transformData.parentMatrixWorld) {
		lParentLX.copy(transformData.parentMatrix);
		lParentGX.copy(transformData.parentMatrixWorld);
	}
	const lLRM = lPreRotationM.clone().multiply(lRotationM).multiply(lPostRotationM);
	const lParentGRM = new Matrix4();
	lParentGRM.extractRotation(lParentGX);
	const lParentTM = new Matrix4();
	lParentTM.copyPosition(lParentGX);
	const lParentGRSM = lParentTM.clone().invert().multiply(lParentGX);
	const lParentGSM = lParentGRM.clone().invert().multiply(lParentGRSM);
	const lLSM = lScalingM;
	const lGlobalRS = new Matrix4();
	if (inheritType === 0) {
		lGlobalRS.copy(lParentGRM).multiply(lLRM).multiply(lParentGSM).multiply(lLSM);
	} else if (inheritType === 1) {
		lGlobalRS.copy(lParentGRM).multiply(lParentGSM).multiply(lLRM).multiply(lLSM);
	} else {
		const lParentLSM = new Matrix4().scale(new Vector3().setFromMatrixScale(lParentLX));
		const lParentLSM_inv = lParentLSM.clone().invert();
		const lParentGSM_noLocal = lParentGSM.clone().multiply(lParentLSM_inv);
		lGlobalRS.copy(lParentGRM).multiply(lLRM).multiply(lParentGSM_noLocal).multiply(lLSM);
	}
	const lRotationPivotM_inv = lRotationPivotM.clone().invert();
	const lScalingPivotM_inv = lScalingPivotM.clone().invert();
	let lTransform = lTranslationM.clone().multiply(lRotationOffsetM).multiply(lRotationPivotM).multiply(lPreRotationM).multiply(lRotationM).multiply(lPostRotationM).multiply(lRotationPivotM_inv).multiply(lScalingOffsetM).multiply(lScalingPivotM).multiply(lScalingM).multiply(lScalingPivotM_inv);
	const lLocalTWithAllPivotAndOffsetInfo = new Matrix4().copyPosition(lTransform);
	const lGlobalTranslation = lParentGX.clone().multiply(lLocalTWithAllPivotAndOffsetInfo);
	lGlobalT.copyPosition(lGlobalTranslation);
	lTransform = lGlobalT.clone().multiply(lGlobalRS);
	lTransform.premultiply(lParentGX.invert());
	return lTransform;
}
function getEulerOrder(order) {
	order = order || 0;
	const enums = [
		'ZYX',
		'YZX',
		'XZY',
		'ZXY',
		'YXZ',
		'XYZ',
	];
	if (order === 6) {
		console.warn('THREE.FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect.');
		return enums[0];
	}
	return enums[order];
}
function parseNumberArray(value) {
	const array = value.split(',').map(function (val) {
		return parseFloat(val);
	});
	return array;
}
function convertArrayBufferToString(buffer, from, to) {
	if (from === undefined) from = 0;
	if (to === undefined) to = buffer.byteLength;
	return new TextDecoder().decode(new Uint8Array(buffer, from, to));
}
function append(a, b) {
	for (let i = 0, j = a.length, l = b.length; i < l; i++, j++) {
		a[j] = b[i];
	}
}
function slice(a, b, from, to) {
	for (let i = from, j = 0; i < to; i++, j++) {
		a[j] = b[i];
	}
	return a;
}


export { FBXLoader };
