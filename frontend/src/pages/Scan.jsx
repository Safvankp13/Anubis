import React, { useState, useEffect, useMemo } from "react";
import { GoCodescanCheckmark } from "react-icons/go";
import { useGetAllScanQuery,  useSaveReportMutation,  useSaveScanMutation, useStartScanMutation } from "../redux/store/api/apiSlice";
import { extractSummary } from "../components/scanPage/extractSummary";
import { useDispatch } from "react-redux";
import { saveScanSummary } from "../redux/store/slices/scanSlice";
import ClipLoader from "react-spinners/ClipLoader";


const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
const toSev = (s) => ({ critical: "critical", high: "high", medium: "medium", low: "low" }[String(s || "").toLowerCase()] || "info");
const SEVERITY_PILL = {
  critical: "bg-[#3a0f13] text-[#ff6b6b]",
  high: "bg-[#3a1608] text-[#ff914d]",
  medium: "bg-[#2f2a12] text-[#ffd166]",
  low: "bg-[#0e2a3a] text-[#86d1ff]",
  info: "bg-[#1e1e1e] text-gray-300",
};

const Scan = () => {
  const [target, setTarget] = useState("");
  const [finalResult, setFinalResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);




  const [startScan, { data: scanResult }] = useStartScanMutation();
  const [saveScan] = useSaveScanMutation();
  const { refetch } = useGetAllScanQuery();
const [saveReport] = useSaveReportMutation();

  const summary = finalResult ? extractSummary(finalResult.result) : null;

  const [activeSev, setActiveSev] = useState("all");
  const [query, setQuery] = useState("");
const dispatch=useDispatch()


useEffect(() => {
  const run = async () => {
    if (scanResult) {
      setFinalResult(scanResult);
      setIsScanning(false);
      refetch();

      const summary = extractSummary(scanResult.result);
      const summaryToSave = { ...summary };
      delete summaryToSave.raw;

      
      dispatch(saveScanSummary({
        id: summary.domain,
        summary
      }));

      
      const savedScanDoc = await saveScan({
        target: summary.domain,
        url: summary.url,
        result: summaryToSave
      }).unwrap();  

      
      await saveReport({
        scanId: savedScanDoc.data._id,
        domain: summary.domain
      });
    }
  };

  run();
}, [scanResult, refetch, dispatch, saveScan, saveReport]);
  const handleScan = async () => {
    if (!target) return;
    setIsScanning(true);
     let clean = target.replace(/^https?:\/\//, "").replace(/\/$/, "");
      clean = clean.replace(/^www\./, "");
    setFinalResult(null);
    await startScan({ target: clean });
    
    
  };

  const risks = useMemo(() => {
    if (!summary) return [];
    const arr = (summary.risks || []).map((r) => ({
      title: r.message || r.id || "Untitled",
      id: r.id || "",
      severity: toSev(r.severity),
      host: summary.domain || "",
      ip: summary.ipAddress || "n/a",
      timestamp: finalResult?.timestamp || finalResult?.result?.timestamp || new Date().toISOString(),
      matches: r.severity && r.severity !== "info",
    }));

    const q = query.trim().toLowerCase();
    const filtered = arr.filter((row) =>
      (activeSev === "all" || row.severity === activeSev) &&
      (!q ||
        row.title.toLowerCase().includes(q) ||
        row.host.toLowerCase().includes(q) ||
        row.ip.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q))
    );

    filtered.sort((a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0) || a.title.localeCompare(b.title));
    return filtered;
  }, [summary, activeSev, query, finalResult]);

  const sevCounts = useMemo(() => {
    return (summary?.risks || []).reduce((acc, r) => {
      const s = toSev(r.severity);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });
  }, [summary]);

  return (
    <>
      
      <div className="flex justify-center bg-[#0f1012] items-center w-full h-50 p-4">
        <div className="w-full max-w-3xl flex items-center text-gray-400 ">
          <input
            type="text"
          placeholder="Enter a URL/Domain to scan  (ex: 'target.com' or 'https://app.company.com')"

            
            className=" shadow-[0_0_18px_2px_rgba(3,164,140,0.35)] focus:shadow-[0_0_25px_4px_rgba(3,164,140,0.55)] transition-shadow border w-full rounded-full text-[14px] placeholder-[#919191] border-gray-500 p-3 pr-12"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <GoCodescanCheckmark size={30} className="-ml-10 cursor-pointer text-gray-300 hover:text-[#acb1b0]" onClick={handleScan} />
        </div>
      </div>

      <div className="w-full h-[calc(100vh-100px)] overflow-auto p-4 ">
        {!summary &&<div className="text-gray-300 font-medium mb-3 flex gap-3 items-center" >
         {isScanning ? "Scanning in progress..." : "Waiting for scan..."}
         {isScanning &&<ClipLoader size={17} color="#03a48c" />}
         
        </div>
        }
 {isScanning&&<p className="text-[12px] text-gray-500">
          This may take up to 2-3 minutes. Please be patient...
        </p>}
        { !isScanning&& summary && (
          <div className="rounded-xl border border-[#1f1f22] bg-[#111214] text-gray-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-7 py-3 border-b border-[#1f1f22] gap-2">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-100 px-3 flex gap-2.5 py-1 rounded bg-[#2a2b31]">Scan Results: <p className="text-[#12c16a] capitalize">{summary.domain}</p></div>
              </div>
              <button
                type="button"
                className="text-xs bg-[#03a48c] border text-[#ffffff] border-[#2a2b31] px-3 py-2 rounded hover:bg-[#027d6b] w-full sm:w-auto"
               onClick={async () => { await saveReport({ scanId: finalResult._id, domain: summary.domain });}}
              >
                Save Report
              </button>
            </div>

            
            <div className="grid grid-cols-12 gap-0">
           
              
              <aside className="col-span-12 lg:col-span-3 p-4 order-1 lg:order-2">
                <div className="mb-8">
                  <div className="text-xs uppercase text-gray-500 mb-2">Host</div>
                  <div className="px-3 py-2 rounded bg-[#121317] border border-[#1f1f22] text-sm truncate">{summary.domain}</div>
                </div>

                <div className="text-xs uppercase text-gray-500 mb-3">Severity Filter</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                  {["critical", "high", "medium", "low", "info"].map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveSev(activeSev === key ? "all" : key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded border border-[#1f1f22] ${
                        activeSev === key ? "bg-[#1a1b20]" : "bg-[#121317] hover:bg-[#17181d]"
                      }`}
                    >
                      <span className="text-sm capitalize">{key}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${SEVERITY_PILL[key]}`}>{sevCounts[key] || 0}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 hidden lg:block">
                  <div className="text-xs uppercase text-gray-500 mb-2">Top 5 Findings</div>
                  <div className="space-y-2 text-sm">
                    {(summary.risks || []).slice(0, 5).map((r, i) => (
                      <div key={i} className="px-3 py-2 rounded bg-[#121317] border border-[#1f1f22] truncate">{r.id}</div>
                    ))}
                    {((summary.risks || []).length === 0) && (
                      <div className="px-3 py-2 rounded bg-[#121317] border border-[#1f1f22] text-gray-500">No items</div>
                    )}
                  </div>
                </div>
              </aside>
           
              
              <main className="col-span-12 lg:col-span-9 p-4 border-b lg:border-r lg:border-b-0 border-[#1f1f22] order-2 lg:order-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    
                    className="w-full sm:w-1/2 bg-[#0d0e12] border border-[#1f1f22] rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#2a2b31]"
                    placeholder="Type to search"
                  />
                </div>

                
                <div className="rounded-lg overflow-hidden border border-[#1f1f22]">
                  <div className="grid grid-cols-12 bg-[#0d0e12] text-xs text-gray-400 border-b border-[#1f1f22]">
                    
                    <div className="col-span-7 md:col-span-5 px-4 py-2">Title</div>
                    
                    <div className="hidden md:block col-span-2 px-4 py-2">Host</div>
                    
                    <div className="hidden lg:block col-span-1 px-4 py-2">IP</div>
                    
                    <div className="col-span-5 md:col-span-2 px-4 py-2 text-center">Severity</div>
                    
                    <div className="hidden lg:block col-span-2 px-4 py-2 text-center">Match</div>
                  </div>

                  <div className="divide-y divide-[#1f1f22]">
                    {risks.length ? (
                      risks.map((row, i) => (
                        <div key={i} className="grid grid-cols-12 items-center hover:bg-[#15161b] transition">
                          <div className="col-span-7 md:col-span-5 px-4 py-3">
                            <div className="text-sm text-gray-100 truncate">{row.title}</div>
                            <div className="text-[11px] text-gray-500 truncate">{row.id}</div>
                          </div>
                          <div className="hidden md:block col-span-2 px-4 py-3 text-sm text-gray-300 truncate">{row.host}</div>
                          <div className="hidden lg:block col-span-1 px-4 py-3 text-sm text-gray-300 truncate">{row.ip}</div>
                          <div className="col-span-5 md:col-span-2 px-4 py-3 flex justify-center">
                            <span className={`px-3 py-[3px] rounded-full text-[11px] font-semibold ${SEVERITY_PILL[row.severity]}`}>
                              {row.severity.toUpperCase()}
                            </span>
                          </div>
                          <div className="hidden lg:block col-span-2 px-4 py-3 text-center text-lg text-green-400">
                            {row.matches ? "✓" : "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">No findings for current filters.</div>
                    )}
                  </div>
                </div>

               
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="border border-[#1f1f22] rounded-lg overflow-hidden">
                    <div className="bg-[#0d0e12] text-xs text-gray-400 px-4 py-2 border-b border-[#1f1f22]">TLS</div>
                    <div className="divide-y divide-[#1f1f22]">
                      {[
                        ["SSL Grade", summary.sslGrade],
                        ["IP", summary.ipAddress],
                        ["Server", summary.serverSignature],
                        ["Modern TLS", summary.modernTLS ? "Yes (TLS 1.3)" : "No"],
                        ["Strongest Cipher", summary.strongestCipher || "n/a"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between px-4 py-2">
                          <span className="text-sm text-gray-400">{k}</span>
                          <span className="text-sm text-gray-100 text-right max-w-[50%] truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-[#1f1f22] rounded-lg overflow-hidden">
                    <div className="bg-[#0d0e12] text-xs text-gray-400 px-4 py-2 border-b border-[#1f1f22]">Security Headers</div>
                    <div className="divide-y divide-[#1f1f22]">
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Present</span>
                        <span className="text-sm text-gray-100 text-right max-w-[50%] truncate">{summary.presentHeaders.join(", ") || "none"}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Missing</span>
                        <span className="text-sm text-gray-100 text-right max-w-[50%] truncate">{summary.missingHeaders.join(", ") || "none"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#1f1f22] rounded-lg overflow-hidden">
                    <div className="bg-[#0d0e12] text-xs text-gray-400 px-4 py-2 border-b border-[#1f1f22]">Technology</div>
                    <div className="divide-y divide-[#1f1f22]">
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Detected JS libs</span>
                        <span className="text-sm text-gray-100 text-right max-w-[50%] truncate">{summary.libs.join(", ") || "none"}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Top Tech</span>
                        <span className="text-sm text-gray-100 text-right max-w-[50%] truncate">{summary.techs.join(", ") || "none"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#1f1f22] rounded-lg overflow-hidden">
                    <div className="bg-[#0d0e12] text-xs text-gray-400 px-4 py-2 border-b border-[#1f1f22]">Exposure</div>
                    <div className="divide-y divide-[#1f1f22]">
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Subdomains</span>
                        <span className="text-sm text-gray-100">{summary.subdomainCount}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Suspicious Disallow</span>
                        <span className="text-sm text-gray-100 text-right max-w-[50%] truncate">{summary.suspiciousDisallows.join(", ") || "none"}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Sitemap</span>
                        <span className="text-sm text-gray-100 text-right max-w-[50%] truncate">{summary.sitemap || "none"}</span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="border border-[#1f1f22] rounded-lg overflow-hidden sm:col-span-2">
                    <div className="bg-[#0d0e12] text-xs text-gray-400 px-4 py-2 border-b border-[#1f1f22]">urlscan.io</div>
                    <div className="divide-y divide-[#1f1f22]">
                      <div className="flex justify-between px-4 py-2">
                        <span className="text-sm text-gray-400">Title</span>
                        <span className="text-sm text-gray-100 text-right max-w-[60%] truncate">{summary.urlscanSummary || "none"}</span>
                      </div>
                    </div>
                  </div>

                  
                  <div className="border border-[#1f1f22] rounded-lg overflow-hidden sm:col-span-2">
                    <div className="bg-[#0d0e12] text-xs text-gray-400 px-4 py-2 border-b border-[#1f1f22]">Raw JSON (meta)</div>
                    <pre className="text-xs text-gray-300 bg-[#0b0c10] max-h-64 overflow-auto p-4">{JSON.stringify(summary.raw, null, 2)}</pre>
                  </div>
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Scan;