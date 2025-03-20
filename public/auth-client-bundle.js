var se = Object.defineProperty, oe = Object.defineProperties, ie = Object.getOwnPropertyDescriptors, H = Object.getOwnPropertySymbols, ae = Object.prototype.hasOwnProperty, ue = Object.prototype.propertyIsEnumerable, J = (e, t, r) => t in e ? se(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r, w = (e, t) => {
  for (var r in t || (t = {}))
    ae.call(t, r) && J(e, r, t[r]);
  if (H)
    for (var r of H(t))
      ue.call(t, r) && J(e, r, t[r]);
  return e;
}, b = (e, t) => oe(e, ie(t)), le = class extends Error {
  constructor(e, t, r) {
    super(t || e.toString(), {
      cause: r
    }), this.status = e, this.statusText = t, this.error = r;
  }
}, ce = async (e, t) => {
  var r, n, s, u, i, c;
  let l = t || {};
  const o = {
    onRequest: [t?.onRequest],
    onResponse: [t?.onResponse],
    onSuccess: [t?.onSuccess],
    onError: [t?.onError],
    onRetry: [t?.onRetry]
  };
  if (!t || !t?.plugins)
    return {
      url: e,
      options: l,
      hooks: o
    };
  for (const a of t?.plugins || []) {
    if (a.init) {
      const f = await ((r = a.init) == null ? void 0 : r.call(a, e.toString(), t));
      l = f.options || l, e = f.url;
    }
    o.onRequest.push((n = a.hooks) == null ? void 0 : n.onRequest), o.onResponse.push((s = a.hooks) == null ? void 0 : s.onResponse), o.onSuccess.push((u = a.hooks) == null ? void 0 : u.onSuccess), o.onError.push((i = a.hooks) == null ? void 0 : i.onError), o.onRetry.push((c = a.hooks) == null ? void 0 : c.onRetry);
  }
  return {
    url: e,
    options: l,
    hooks: o
  };
}, G = class {
  constructor(e) {
    this.options = e;
  }
  shouldAttemptRetry(e, t) {
    return this.options.shouldRetry ? Promise.resolve(
      e < this.options.attempts && this.options.shouldRetry(t)
    ) : Promise.resolve(e < this.options.attempts);
  }
  getDelay() {
    return this.options.delay;
  }
}, fe = class {
  constructor(e) {
    this.options = e;
  }
  shouldAttemptRetry(e, t) {
    return this.options.shouldRetry ? Promise.resolve(
      e < this.options.attempts && this.options.shouldRetry(t)
    ) : Promise.resolve(e < this.options.attempts);
  }
  getDelay(e) {
    return Math.min(
      this.options.maxDelay,
      this.options.baseDelay * 2 ** e
    );
  }
};
function de(e) {
  if (typeof e == "number")
    return new G({
      type: "linear",
      attempts: e,
      delay: 1e3
    });
  switch (e.type) {
    case "linear":
      return new G(e);
    case "exponential":
      return new fe(e);
    default:
      throw new Error("Invalid retry strategy");
  }
}
var he = (e) => {
  const t = {}, r = (n) => typeof n == "function" ? n() : n;
  if (e?.auth) {
    if (e.auth.type === "Bearer") {
      const n = r(e.auth.token);
      if (!n)
        return t;
      t.authorization = `Bearer ${n}`;
    } else if (e.auth.type === "Basic") {
      const n = r(e.auth.username), s = r(e.auth.password);
      if (!n || !s)
        return t;
      t.authorization = `Basic ${btoa(`${n}:${s}`)}`;
    } else if (e.auth.type === "Custom") {
      const n = r(e.auth.value);
      if (!n)
        return t;
      t.authorization = `${r(e.auth.prefix)} ${n}`;
    }
  }
  return t;
}, pe = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function ye(e) {
  const t = e.headers.get("content-type"), r = /* @__PURE__ */ new Set([
    "image/svg",
    "application/xml",
    "application/xhtml",
    "application/html"
  ]);
  if (!t)
    return "json";
  const n = t.split(";").shift() || "";
  return pe.test(n) ? "json" : r.has(n) || n.startsWith("text/") ? "text" : "blob";
}
function ge(e) {
  try {
    return JSON.parse(e), !0;
  } catch {
    return !1;
  }
}
function Y(e) {
  if (e === void 0)
    return !1;
  const t = typeof e;
  return t === "string" || t === "number" || t === "boolean" || t === null ? !0 : t !== "object" ? !1 : Array.isArray(e) ? !0 : e.buffer ? !1 : e.constructor && e.constructor.name === "Object" || typeof e.toJSON == "function";
}
function Q(e) {
  try {
    return JSON.parse(e);
  } catch {
    return e;
  }
}
function X(e) {
  return typeof e == "function";
}
function ve(e) {
  if (e?.customFetchImpl)
    return e.customFetchImpl;
  if (typeof globalThis < "u" && X(globalThis.fetch))
    return globalThis.fetch;
  if (typeof window < "u" && X(window.fetch))
    return window.fetch;
  throw new Error("No fetch implementation found");
}
function me(e) {
  const t = new Headers(e?.headers), r = he(e);
  for (const [n, s] of Object.entries(r || {}))
    t.set(n, s);
  if (!t.has("content-type")) {
    const n = we(e?.body);
    n && t.set("content-type", n);
  }
  return t;
}
function we(e) {
  return Y(e) ? "application/json" : null;
}
function _e(e) {
  if (!e?.body)
    return null;
  const t = new Headers(e?.headers);
  if (Y(e.body) && !t.has("content-type")) {
    for (const [r, n] of Object.entries(e?.body))
      n instanceof Date && (e.body[r] = n.toISOString());
    return JSON.stringify(e.body);
  }
  return e.body;
}
function be(e, t) {
  var r;
  if (t?.method)
    return t.method.toUpperCase();
  if (e.startsWith("@")) {
    const n = (r = e.split("@")[1]) == null ? void 0 : r.split("/")[0];
    return K.includes(n) ? n.toUpperCase() : t?.body ? "POST" : "GET";
  }
  return t?.body ? "POST" : "GET";
}
function Te(e, t) {
  let r;
  return !e?.signal && e?.timeout && (r = setTimeout(() => t?.abort(), e?.timeout)), {
    abortTimeout: r,
    clearTimeout: () => {
      r && clearTimeout(r);
    }
  };
}
var Oe = class Z extends Error {
  constructor(t, r) {
    super(r || JSON.stringify(t, null, 2)), this.issues = t, Object.setPrototypeOf(this, Z.prototype);
  }
};
async function C(e, t) {
  let r = await e["~standard"].validate(t);
  if (r.issues)
    throw new Oe(r.issues);
  return r.value;
}
var K = ["get", "post", "put", "patch", "delete"], Re = (e) => ({
  id: "apply-schema",
  name: "Apply Schema",
  version: "1.0.0",
  async init(t, r) {
    var n, s, u, i;
    const c = ((s = (n = e.plugins) == null ? void 0 : n.find(
      (l) => {
        var o;
        return (o = l.schema) != null && o.config ? t.startsWith(l.schema.config.baseURL || "") || t.startsWith(l.schema.config.prefix || "") : !1;
      }
    )) == null ? void 0 : s.schema) || e.schema;
    if (c) {
      let l = t;
      (u = c.config) != null && u.prefix && l.startsWith(c.config.prefix) && (l = l.replace(c.config.prefix, ""), c.config.baseURL && (t = t.replace(c.config.prefix, c.config.baseURL))), (i = c.config) != null && i.baseURL && l.startsWith(c.config.baseURL) && (l = l.replace(c.config.baseURL, ""));
      const o = c.schema[l];
      if (o) {
        let a = b(w({}, r), {
          method: o.method,
          output: o.output
        });
        return r?.disableValidation || (a = b(w({}, a), {
          body: o.input ? await C(o.input, r?.body) : r?.body,
          params: o.params ? await C(o.params, r?.params) : r?.params,
          query: o.query ? await C(o.query, r?.query) : r?.query
        })), {
          url: t,
          options: a
        };
      }
    }
    return {
      url: t,
      options: r
    };
  }
}), Pe = (e) => {
  async function t(r, n) {
    const s = b(w(w({}, e), n), {
      plugins: [...e?.plugins || [], Re(e || {})]
    });
    if (e?.catchAllError)
      try {
        return await M(r, s);
      } catch (u) {
        return {
          data: null,
          error: {
            status: 500,
            statusText: "Fetch Error",
            message: "Fetch related error. Captured by catchAllError option. See error property for more details.",
            error: u
          }
        };
      }
    return await M(r, s);
  }
  return t;
};
function Se(e, t) {
  let { baseURL: r, params: n, query: s } = t || {
    query: {},
    params: {},
    baseURL: ""
  }, u = e.startsWith("http") ? e.split("/").slice(0, 3).join("/") : r || "";
  if (e.startsWith("@")) {
    const f = e.toString().split("@")[1].split("/")[0];
    K.includes(f) && (e = e.replace(`@${f}/`, "/"));
  }
  u.endsWith("/") || (u += "/");
  let [i, c] = e.replace(u, "").split("?");
  const l = new URLSearchParams(c);
  for (const [f, h] of Object.entries(s || {}))
    h != null && l.set(f, String(h));
  if (n)
    if (Array.isArray(n)) {
      const f = i.split("/").filter((h) => h.startsWith(":"));
      for (const [h, d] of f.entries()) {
        const _ = n[h];
        i = i.replace(d, _);
      }
    } else
      for (const [f, h] of Object.entries(n))
        i = i.replace(`:${f}`, String(h));
  i = i.split("/").map(encodeURIComponent).join("/"), i.startsWith("/") && (i = i.slice(1));
  let o = l.size > 0 ? `?${l}`.replace(/\+/g, "%20") : "";
  return u.startsWith("http") ? new URL(`${i}${o}`, u) : `${u}${i}${o}`;
}
var M = async (e, t) => {
  var r, n, s, u, i, c, l, o;
  const {
    hooks: a,
    url: f,
    options: h
  } = await ce(e, t), d = ve(h), _ = new AbortController(), L = (r = h.signal) != null ? r : _.signal, S = Se(f, h), I = _e(h), U = me(h), E = be(f, h);
  let y = b(w({}, h), {
    url: S,
    headers: U,
    body: I,
    method: E,
    signal: L
  });
  for (const v of a.onRequest)
    if (v) {
      const g = await v(y);
      g instanceof Object && (y = g);
    }
  ("pipeTo" in y && typeof y.pipeTo == "function" || typeof ((n = t?.body) == null ? void 0 : n.pipe) == "function") && ("duplex" in y || (y.duplex = "half"));
  const { clearTimeout: $ } = Te(h, _);
  let p = await d(y.url, y);
  $();
  const W = {
    response: p,
    request: y
  };
  for (const v of a.onResponse)
    if (v) {
      const g = await v(b(w({}, W), {
        response: (s = t?.hookOptions) != null && s.cloneResponse ? p.clone() : p
      }));
      g instanceof Response ? p = g : g instanceof Object && (p = g.response);
    }
  if (p.ok) {
    if (!(y.method !== "HEAD"))
      return {
        data: "",
        error: null
      };
    const g = ye(p), T = {
      data: "",
      response: p,
      request: y
    };
    if (g === "json" || g === "text") {
      const O = await p.text(), ne = await ((u = y.jsonParser) != null ? u : Q)(O);
      T.data = ne;
    } else
      T.data = await p[g]();
    y?.output && y.output && !y.disableValidation && (T.data = await C(
      y.output,
      T.data
    ));
    for (const O of a.onSuccess)
      O && await O(b(w({}, T), {
        response: (i = t?.hookOptions) != null && i.cloneResponse ? p.clone() : p
      }));
    return t?.throw ? T.data : {
      data: T.data,
      error: null
    };
  }
  const te = (c = t?.jsonParser) != null ? c : Q, N = await p.text(), V = ge(N), B = V ? await te(N) : null, re = {
    response: p,
    responseText: N,
    request: y,
    error: b(w({}, B), {
      status: p.status,
      statusText: p.statusText
    })
  };
  for (const v of a.onError)
    v && await v(b(w({}, re), {
      response: (l = t?.hookOptions) != null && l.cloneResponse ? p.clone() : p
    }));
  if (t?.retry) {
    const v = de(t.retry), g = (o = t.retryAttempt) != null ? o : 0;
    if (await v.shouldAttemptRetry(g, p)) {
      for (const O of a.onRetry)
        O && await O(W);
      const T = v.getDelay(g);
      return await new Promise((O) => setTimeout(O, T)), await M(e, b(w({}, t), {
        retryAttempt: g + 1
      }));
    }
  }
  if (t?.throw)
    throw new le(
      p.status,
      p.statusText,
      V ? B : N
    );
  return {
    data: null,
    error: b(w({}, B), {
      status: p.status,
      statusText: p.statusText
    })
  };
}, Ee = {}, Ue = {};
const k = /* @__PURE__ */ Object.create(null), A = (e) => globalThis.process?.env || //@ts-expect-error
globalThis.Deno?.env.toObject() || //@ts-expect-error
globalThis.__env__ || (e ? k : globalThis), P = new Proxy(k, {
  get(e, t) {
    return A()[t] ?? k[t];
  },
  has(e, t) {
    const r = A();
    return t in r || t in k;
  },
  set(e, t, r) {
    const n = A(!0);
    return n[t] = r, !0;
  },
  deleteProperty(e, t) {
    if (!t)
      return !1;
    const r = A(!0);
    return delete r[t], !0;
  },
  ownKeys() {
    const e = A(!0);
    return Object.keys(e);
  }
});
function Ae(e) {
  return e ? e !== "false" : !1;
}
const Le = typeof Ee < "u" && Ue && "production" || "";
Le === "test" || Ae(P.TEST);
class Ie extends Error {
  constructor(t, r) {
    super(t), this.name = "BetterAuthError", this.message = t, this.cause = r, this.stack = "";
  }
}
function Ne(e) {
  try {
    return new URL(e).pathname !== "/";
  } catch {
    throw new Ie(
      `Invalid base URL: ${e}. Please provide a valid base URL.`
    );
  }
}
function D(e, t = "/api/auth") {
  return Ne(e) ? e : (t = t.startsWith("/") ? t : `/${t}`, `${e.replace(/\/+$/, "")}${t}`);
}
function xe(e, t, r) {
  if (e)
    return D(e, t);
  const n = P.BETTER_AUTH_URL || P.NEXT_PUBLIC_BETTER_AUTH_URL || P.PUBLIC_BETTER_AUTH_URL || P.NUXT_PUBLIC_BETTER_AUTH_URL || P.NUXT_PUBLIC_AUTH_URL || (P.BASE_URL !== "/" ? P.BASE_URL : void 0);
  if (n)
    return D(n, t);
  if (typeof window < "u" && window.location)
    return D(window.location.origin, t);
}
let m = [], R = 0;
const x = 4;
let ee = (e) => {
  let t = [], r = {
    get() {
      return r.lc || r.listen(() => {
      })(), r.value;
    },
    lc: 0,
    listen(n) {
      return r.lc = t.push(n), () => {
        for (let u = R + x; u < m.length; )
          m[u] === n ? m.splice(u, x) : u += x;
        let s = t.indexOf(n);
        ~s && (t.splice(s, 1), --r.lc || r.off());
      };
    },
    notify(n, s) {
      let u = !m.length;
      for (let i of t)
        m.push(
          i,
          r.value,
          n,
          s
        );
      if (u) {
        for (R = 0; R < m.length; R += x)
          m[R](
            m[R + 1],
            m[R + 2],
            m[R + 3]
          );
        m.length = 0;
      }
    },
    /* It will be called on last listener unsubscribing.
       We will redefine it in onMount and onStop. */
    off() {
    },
    set(n) {
      let s = r.value;
      s !== n && (r.value = n, r.notify(s));
    },
    subscribe(n) {
      let s = r.listen(n);
      return n(r.value), s;
    },
    value: e
  };
  return r;
};
const je = 5, j = 6, q = 10;
let qe = (e, t, r, n) => (e.events = e.events || {}, e.events[r + q] || (e.events[r + q] = n((s) => {
  e.events[r].reduceRight((u, i) => (i(u), u), {
    shared: {},
    ...s
  });
})), e.events[r] = e.events[r] || [], e.events[r].push(t), () => {
  let s = e.events[r], u = s.indexOf(t);
  s.splice(u, 1), s.length || (delete e.events[r], e.events[r + q](), delete e.events[r + q]);
}), Ce = 1e3, ke = (e, t) => qe(e, (n) => {
  let s = t(n);
  s && e.events[j].push(s);
}, je, (n) => {
  let s = e.listen;
  e.listen = (...i) => (!e.lc && !e.active && (e.active = !0, n()), s(...i));
  let u = e.off;
  return e.events[j] = [], e.off = () => {
    u(), setTimeout(() => {
      if (e.active && !e.lc) {
        e.active = !1;
        for (let i of e.events[j]) i();
        e.events[j] = [];
      }
    }, Ce);
  }, () => {
    e.listen = s, e.off = u;
  };
});
const $e = (e, t, r, n) => {
  const s = ee({
    data: null,
    error: null,
    isPending: !0,
    isRefetching: !1,
    refetch: () => u()
  }), u = () => {
    const c = typeof n == "function" ? n({
      data: s.get().data,
      error: s.get().error,
      isPending: s.get().isPending
    }) : n;
    return r(t, {
      ...c,
      async onSuccess(l) {
        typeof window < "u" && s.set({
          data: l.data,
          error: null,
          isPending: !1,
          isRefetching: !1,
          refetch: s.value.refetch
        }), await c?.onSuccess?.(l);
      },
      async onError(l) {
        const { request: o } = l, a = typeof o.retry == "number" ? o.retry : o.retry?.attempts, f = o.retryAttempt || 0;
        a && f < a || (s.set({
          error: l.error,
          data: null,
          isPending: !1,
          isRefetching: !1,
          refetch: s.value.refetch
        }), await c?.onError?.(l));
      },
      async onRequest(l) {
        const o = s.get();
        s.set({
          isPending: o.data === null,
          data: o.data,
          error: null,
          isRefetching: !0,
          refetch: s.value.refetch
        }), await c?.onRequest?.(l);
      }
    });
  };
  e = Array.isArray(e) ? e : [e];
  let i = !1;
  for (const c of e)
    c.subscribe(() => {
      i ? u() : ke(s, () => (u(), i = !0, () => {
        s.off(), c.off();
      }));
    });
  return s;
}, Be = {
  proto: /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/,
  constructor: /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/,
  protoShort: /"__proto__"\s*:/,
  constructorShort: /"constructor"\s*:/
}, De = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/, z = {
  true: !0,
  false: !1,
  null: null,
  undefined: void 0,
  nan: Number.NaN,
  infinity: Number.POSITIVE_INFINITY,
  "-infinity": Number.NEGATIVE_INFINITY
}, Fe = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?(?:Z|([+-])(\d{2}):(\d{2}))$/;
function Me(e) {
  return e instanceof Date && !isNaN(e.getTime());
}
function We(e) {
  const t = Fe.exec(e);
  if (!t) return null;
  const [
    ,
    r,
    n,
    s,
    u,
    i,
    c,
    l,
    o,
    a,
    f
  ] = t;
  let h = new Date(
    Date.UTC(
      parseInt(r, 10),
      parseInt(n, 10) - 1,
      parseInt(s, 10),
      parseInt(u, 10),
      parseInt(i, 10),
      parseInt(c, 10),
      l ? parseInt(l.padEnd(3, "0"), 10) : 0
    )
  );
  if (o) {
    const d = (parseInt(a, 10) * 60 + parseInt(f, 10)) * (o === "+" ? -1 : 1);
    h.setUTCMinutes(h.getUTCMinutes() + d);
  }
  return Me(h) ? h : null;
}
function Ve(e, t = {}) {
  const {
    strict: r = !1,
    warnings: n = !1,
    reviver: s,
    parseDates: u = !0
  } = t;
  if (typeof e != "string")
    return e;
  const i = e.trim();
  if (i[0] === '"' && i.endsWith('"') && !i.slice(1, -1).includes('"'))
    return i.slice(1, -1);
  const c = i.toLowerCase();
  if (c.length <= 9 && c in z)
    return z[c];
  if (!De.test(i)) {
    if (r)
      throw new SyntaxError("[better-json] Invalid JSON");
    return e;
  }
  if (Object.entries(Be).some(
    ([o, a]) => {
      const f = a.test(i);
      return f && n && console.warn(
        `[better-json] Detected potential prototype pollution attempt using ${o} pattern`
      ), f;
    }
  ) && r)
    throw new Error(
      "[better-json] Potential prototype pollution attempt detected"
    );
  try {
    return JSON.parse(i, (a, f) => {
      if (a === "__proto__" || a === "constructor" && f && typeof f == "object" && "prototype" in f) {
        n && console.warn(
          `[better-json] Dropping "${a}" key to prevent prototype pollution`
        );
        return;
      }
      if (u && typeof f == "string") {
        const h = We(f);
        if (h)
          return h;
      }
      return s ? s(a, f) : f;
    });
  } catch (o) {
    if (r)
      throw o;
    return e;
  }
}
function He(e, t = { strict: !0 }) {
  return Ve(e, t);
}
const Je = {
  id: "redirect",
  name: "Redirect",
  hooks: {
    onSuccess(e) {
      if (e.data?.url && e.data?.redirect && typeof window < "u" && window.location && window.location)
        try {
          window.location.href = e.data.url;
        } catch {
        }
    }
  }
};
function Ge(e) {
  const t = ee(!1);
  return {
    session: $e(t, "/get-session", e, {
      method: "GET"
    }),
    $sessionSignal: t
  };
}
const Qe = (e) => {
  const t = "credentials" in Request.prototype, r = xe(e?.baseURL, e?.basePath), n = e?.plugins?.flatMap((d) => d.fetchPlugins).filter((d) => d !== void 0) || [], s = Pe({
    baseURL: r,
    ...t ? { credentials: "include" } : {},
    method: "GET",
    jsonParser(d) {
      return d ? He(d, {
        strict: !1
      }) : null;
    },
    customFetchImpl: async (d, _) => {
      try {
        return await fetch(d, _);
      } catch {
        return Response.error();
      }
    },
    ...e?.fetchOptions,
    plugins: e?.disableDefaultFetchPlugins ? [...e?.fetchOptions?.plugins || [], ...n] : [
      Je,
      ...e?.fetchOptions?.plugins || [],
      ...n
    ]
  }), { $sessionSignal: u, session: i } = Ge(s), c = e?.plugins || [];
  let l = {}, o = {
    $sessionSignal: u,
    session: i
  }, a = {
    "/sign-out": "POST",
    "/revoke-sessions": "POST",
    "/revoke-other-sessions": "POST",
    "/delete-user": "POST"
  };
  const f = [
    {
      signal: "$sessionSignal",
      matcher(d) {
        return d === "/sign-out" || d === "/update-user" || d.startsWith("/sign-in") || d.startsWith("/sign-up") || d === "/delete-user";
      }
    }
  ];
  for (const d of c)
    d.getAtoms && Object.assign(o, d.getAtoms?.(s)), d.pathMethods && Object.assign(a, d.pathMethods), d.atomListeners && f.push(...d.atomListeners);
  const h = {
    notify: (d) => {
      o[d].set(
        !o[d].get()
      );
    },
    listen: (d, _) => {
      o[d].subscribe(_);
    },
    atoms: o
  };
  for (const d of c)
    d.getActions && Object.assign(l, d.getActions?.(s, h));
  return {
    pluginsActions: l,
    pluginsAtoms: o,
    pluginPathMethods: a,
    atomListeners: f,
    $fetch: s,
    $store: h
  };
};
function Xe(e, t, r) {
  const n = t[e], { fetchOptions: s, query: u, ...i } = r || {};
  return n || (s?.method ? s.method : i && Object.keys(i).length > 0 ? "POST" : "GET");
}
function ze(e, t, r, n, s) {
  function u(i = []) {
    return new Proxy(function() {
    }, {
      get(c, l) {
        const o = [...i, l];
        let a = e;
        for (const f of o)
          if (a && typeof a == "object" && f in a)
            a = a[f];
          else {
            a = void 0;
            break;
          }
        return typeof a == "function" ? a : u(o);
      },
      apply: async (c, l, o) => {
        const a = "/" + i.map(
          (U) => U.replace(/[A-Z]/g, (E) => `-${E.toLowerCase()}`)
        ).join("/"), f = o[0] || {}, h = o[1] || {}, { query: d, fetchOptions: _, ...L } = f, S = {
          ...h,
          ..._
        }, I = Xe(a, r, f);
        return await t(a, {
          ...S,
          body: I === "GET" ? void 0 : {
            ...L,
            ...S?.body || {}
          },
          query: d || S?.query,
          method: I,
          async onSuccess(U) {
            await S?.onSuccess?.(U);
            const E = s?.find((p) => p.matcher(a));
            if (!E) return;
            const y = n[E.signal];
            if (!y) return;
            const $ = y.get();
            setTimeout(() => {
              y.set(!$);
            }, 10);
          }
        });
      }
    });
  }
  return u();
}
function Ye(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Ze(e) {
  const {
    pluginPathMethods: t,
    pluginsActions: r,
    pluginsAtoms: n,
    $fetch: s,
    atomListeners: u,
    $store: i
  } = Qe(e);
  let c = {};
  for (const [a, f] of Object.entries(n))
    c[`use${Ye(a)}`] = f;
  const l = {
    ...r,
    ...c,
    $fetch: s,
    $store: i
  };
  return ze(
    l,
    s,
    t,
    n,
    u
  );
}
const Ke = () => ({
  id: "email-otp",
  $InferServerPlugin: {}
}), et = "http://localhost:3000", F = Ze({
  // Define the base URL for our authentication API with absolute URL
  baseURL: `${et}/api/auth`,
  // Include the required plugins
  plugins: [Ke()]
}), tt = {
  // Send a verification OTP to the specified email address
  async sendOTP(e) {
    try {
      const { error: t } = await F.emailOtp.sendVerificationOtp({
        email: e,
        type: "sign-in"
      });
      return !t;
    } catch (t) {
      return console.error("Error sending OTP:", t), !1;
    }
  },
  // Verify the OTP and sign in the user
  async verifyOTP(e, t) {
    try {
      const { error: r } = await F.signIn.emailOtp({
        email: e,
        otp: t
      });
      return !r;
    } catch (r) {
      return console.error("Error verifying OTP:", r), !1;
    }
  },
  // Sign out the current user
  async signOut() {
    try {
      const { error: e } = await F.signOut();
      return !e;
    } catch (e) {
      return console.error("Error signing out:", e), !1;
    }
  }
};
typeof window < "u" && (window.authClient = tt);
