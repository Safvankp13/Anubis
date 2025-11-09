import axios from "axios"; // 👈 New Import
import * as cheerio from "cheerio";
import PDFDocument from "pdfkit";
import { ScanResult } from '../models/scanResult.js'
import { SavedReport } from "../models/savedReport.js";

// --- Helpers (Network and Parsing Functions) --- //

async function fetchCrtSh(domain) {
  try {
    const q = encodeURIComponent(`%.${domain}`);
    const url = `https://crt.sh/?q=${q}&output=json`;
    // Use axios.get for the request
    const res = await axios.get(url, { timeout: 15000 });
    
    // Axios automatically parses JSON, so res.data is the JSON object
    const json = res.data; 
    const subdomains = [...new Set(json.map(r => r.name_value).flatMap(s => s.split("\n")))];
    return { subdomains };
  } catch (e) {
    // Axios places the response status on e.response.status if available
    const status = e.response ? e.response.status : e.code;
    return { error: `crt.sh request failed: ${status || e.message}` };
  }
}

async function fetchSslLabs(domain) {
  try {
    const url = `https://api.ssllabs.com/api/v3/analyze?host=${domain}&all=done`;
    let res = await axios.get(url);
    let job = res.data;

    const start = Date.now();
    while (job.status !== "READY" && job.status !== "ERROR" && (Date.now() - start) < 120000) {
      await new Promise(s => setTimeout(s, 3000));
      const poll = await axios.get(`https://api.ssllabs.com/api/v3/analyze?host=${domain}`);
      const pollJson = poll.data;
      job = Object.assign(job, pollJson);
    }
    return job;
  } catch (e) {
    const status = e.response ? e.response.status : e.code;
    return { error: `ssllabs analysis failed: ${status || e.message}` };
  }
}

async function fetchUrlScan(url, apiKey) {
  try {
    if (!apiKey) {
      // fallback to urlscan search (limited)
    
     return
    } else {
      const submit = await axios.post("https://urlscan.io/api/v1/scan/", 
        { url, public: "false" },
        { headers: { "API-Key": apiKey, "Content-Type": "application/json" } }
      );
      
      const job = submit.data;
      const resultUrl = `https://urlscan.io/api/v1/result/${job.uuid}/`;
      const start = Date.now();
      
      while ((Date.now() - start) < 120000) {
        await new Promise(s => setTimeout(s, 3000));
        try {
          const r = await axios.get(resultUrl);
          // If the status is 200, it means the job is done
          return r.data;
        } catch (e) {
          // If the job is pending, it returns a non-2xx status (like 404), which is caught here.
          // We check the error response status to continue polling.
          if (e.response && e.response.status !== 404) {
             throw e; // Re-throw other errors
          }
        }
      }
      return { note: "urlscan job queued, try later", job };
    }
  } catch (e) {
    const status = e.response ? e.response.status : e.code;
    return { error: `urlscan request failed: ${status || e.message}` };
  }
}

async function inspectPage(url) {
  try {
    // Axios automatically handles redirects by default
    const res = await axios.get(url, { timeout: 15000, maxContentLength: 50 * 1024 * 1024 }); 
    
    // Headers are accessed via res.headers (already lowercase by default in Axios)
    const headers = {};
    for (const k in res.headers) {
        headers[k] = res.headers[k];
    }
    
    const contentType = headers["content-type"] || "";
    let html = "";
    // res.data contains the response body
    if (contentType.includes("text/html")) html = res.data;

    const findings = { status: res.status, headers }; // res.status is the HTTP status code
    
    if (html) {
      const $ = cheerio.load(html);
      findings.generator = $('meta[name="generator"]').attr("content") || null;
      const scripts = $("script[src]").map((i, el) => $(el).attr("src")).get().slice(0, 50);
      const libs = [];
      for (const s of scripts) {
        if (!s) continue;
        if (s.includes("jquery")) libs.push("jquery");
        if (s.includes("react") || s.includes("react-dom")) libs.push("react");
        if (s.includes("angular")) libs.push("angular");
        if (s.includes("vue")) libs.push("vue");
        if (s.includes("wp-content") || s.includes("wp-includes")) libs.push("wordpress");
      }
      findings.detected_libs = [...new Set(libs)];
    }
    return findings;
  } catch (e) {
    const status = e.response ? e.response.status : e.code;
    return { error: `page inspection failed: ${status || e.message}` };
  }
}

function buildRisks(data) {
  const risks = [];
  if (data.home && data.home.headers && !data.home.headers["strict-transport-security"]) {
    risks.push({ id: "missing_hsts", severity: "medium", message: "HSTS header missing" });
  }
  if (data.home && data.home.headers && !data.home.headers["content-security-policy"]) {
    risks.push({ id: "missing_csp", severity: "medium", message: "CSP header missing" });
  }
  if (data.home && data.home.generator) {
    risks.push({ id: "cms_detected", severity: "info", message: `CMS/Generator: ${data.home.generator}` });
  }
  if (data.crtsh && data.crtsh.subdomains && data.crtsh.subdomains.length >= 10) {
    risks.push({ id: "many_subdomains", severity: "low", message: `Found ${data.crtsh.subdomains.length} subdomains` });
  }
  if (data.ssl && data.ssl.endpoints) {
    const low = (data.ssl.endpoints || []).some(e => e.grade && (e.grade < "B"));
    if (low) risks.push({ id: "weak_ssl", severity: "high", message: "One or more endpoints have weak SSL grade" });
  }
  return risks;
}


// --- Optional third-party tech detection wrappers --- //

async function fetchBuiltWith(domain, apiKey) {
  if (!apiKey) return { skipped: "no builtwith api key" };
  try {
    const url = `https://api.builtwith.com/free1/api.json?KEY=${apiKey}&LOOKUP=${domain}`;
    const res = await axios.get(url);
    return res.data;
  } catch (e) {
    const status = e.response ? e.response.status : e.code;
    return { error: `builtwith request failed: ${status || e.message}` };
  }
}



// --- Controller handlers --- //

export const startScan = async (req, res) => {
  try {
    const { target, url } = req.body || {};
    if (!target && !url) return res.status(400).json({ error: "target domain or url required" });

    let targetUrl = url;
    let targetDomain = target;
    
    if (targetUrl) {
        try {
            targetDomain = new URL(targetUrl).hostname;
        } catch (e) {
            return res.status(400).json({ error: "Invalid URL provided" });
        }
    } else if (targetDomain) {
        targetUrl = `https://${targetDomain}/`;
    }

    // --- Concurrent Requests ---
    const [
      crtsh,
      home,
      robotsText,
      ssl,
      urlscan,
      builtwith,
    ] = await Promise.all([
      fetchCrtSh(targetDomain),
      inspectPage(targetUrl),
      (async () => {
        try {
   
          const r = await axios.get(`https://${targetDomain}/robots.txt`, { timeout: 8000 });
          return r.data; 
        } catch (e) {
      
          const status = e.response ? e.response.status : e.code;
          return `not found (${status || e.message})`;
        }
      })(),
      fetchSslLabs(targetDomain),
      fetchUrlScan(targetUrl,  "019a526b-fac1-73cd-b7f9-5c6f3c4161a4"),
      fetchBuiltWith(targetDomain, "c1d43521-29fc-455b-a41f-72ed1efffeca"),
 
    ]);

   
    let shodan = null;
    if (process.env.SHODAN_API_KEY) {
      try {
        const shUrl = `https://api.shodan.io/shodan/host/search?key=${process.env.SHODAN_API_KEY}&query=${targetDomain}`;
        const r = await axios.get(shUrl);
        shodan = r.data;
      } catch (e) {
        const status = e.response ? e.response.status : e.code;
        shodan = { error: `shodan failed: ${status || e.message}` };
      }
    }

    const aggregated = {
      domain: targetDomain, url: targetUrl, crtsh, home, robots: robotsText,
      ssl, urlscan, builtwith, shodan,
    };

    aggregated.risks = buildRisks({ home, crtsh, ssl });


    return res.json({ ok: true, result: aggregated });
  } catch (e) {
    console.error("startScan error", e);
    return res.status(500).json({ error: e.message });
  }
};


export const getAllScans = async (req, res) => {
  try {
    const scans = await ScanResult.find().sort({ createdAt: -1 }).lean();
    return res.json(scans);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const getScanById = async (req, res) => {
  try {
    const { id } = req.params;
    const scan = await ScanResult.findById(id).lean();
    if (!scan) return res.status(404).json({ error: "not found" });
    return res.json(scan);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const saveDb=async(req, res) => {
  try {
    const { target, url, result } = req.body;

   const saved = await ScanResult.findOneAndUpdate(
  { target },          
  { url, result },      
  { new: true, upsert: true }
);

    res.json({ ok: true, data: saved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}




export const saveReport=async(req,res)=>{
    try {
    const { scanId, domain } = req.body;

    const saved = await SavedReport.findOneAndUpdate(
      { domain },
      { scanId, domain },
      { new: true, upsert: true }
    );

    res.json({ ok: true, data: saved });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export const getSaveReports = async (req, res) => {
  try {
    const list = await SavedReport.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "scanId",
        select: "target url result createdAt", 
      })
      .lean();

    res.json(list);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
export const deleteSavedReport = async (req, res) => {
  try {
    const { id } = req.params;
    await SavedReport.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const downloadPdf = async (req, res) => {
   try {
    const { id } = req.params;
    const scan = await ScanResult.findById(id).lean();
    if (!scan) return res.status(404).json({ error: "not found" });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-disposition", `attachment; filename=scan-${id}.pdf`);
    res.setHeader("Content-type", "application/pdf");
    doc.pipe(res);

    const result = scan.result || {};

   
    doc.fontSize(20).text(`Scan Report`, { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Domain: ${scan.target}`);
    doc.text(`URL: ${scan.url}`);
    doc.text(`Timestamp: ${new Date(scan.timestamp).toLocaleString()}`);
    doc.moveDown(2);

   
    doc.fontSize(16).text("TLS Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
      .text(`SSL Grade: ${result.sslGrade}`)
      .text(`IP Address: ${result.ipAddress}`)
      .text(`Server Signature: ${result.serverSignature}`)
      .text(`Modern TLS: ${result.modernTLS ? "Yes" : "No"}`)
      .text(`Strongest Cipher: ${result.strongestCipher || "n/a"}`);
    doc.moveDown(2);

   
    doc.fontSize(16).text("Security Headers", { underline: true });
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Present: ${(result.presentHeaders || []).join(", ")}`);
    doc.text(`Missing: ${(result.missingHeaders || []).join(", ")}`);
    doc.moveDown(2);

  
    doc.fontSize(16).text("Technologies", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Detected JS libs: ${(result.libs || []).join(", ")}`);
    doc.text(`Top Tech: ${(result.techs || []).join(", ")}`);
    doc.moveDown(2);

  
    doc.fontSize(16).text("Exposure", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12)
      .text(`Subdomain Count: ${result.subdomainCount}`)
      .text(`Suspicious Disallow: ${(result.suspiciousDisallows || []).join(", ")}`)
      .text(`Sitemap: ${result.sitemap || "none"}`);
    doc.moveDown(2);

    doc.fontSize(16).text("Risks", { underline: true });
    const risks = result.risks || [];
    if (!risks.length) doc.text("No risks identified");
    else risks.forEach(r => doc.text(`${r.severity.toUpperCase()}: ${r.message}`));
    doc.moveDown(2);


    doc.end();
  } catch (e) {
    console.error("downloadPdf error", e);
    res.status(500).json({ error: e.message });
  }
};