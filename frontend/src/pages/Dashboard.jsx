import React, { useState } from "react";
import { useGetAllScanQuery, useSaveReportMutation } from "../redux/store/api/apiSlice";

const gradeBadge = (g) => {
  const grade = (g || "").toUpperCase();
  const map = {
    A: "bg-[#12301f] text-[#7CFCAD] border border-[#1e5b3a]",
    "A+": "bg-[#12301f] text-[#7CFCAD] border border-[#1e5b3a]",
    B: "bg-[#1b2b3b] text-[#86d1ff] border border-[#28465e]",
    "B+": "bg-[#1b2b3b] text-[#86d1ff] border border-[#28465e]",
    C: "bg-[#2f2a12] text-[#ffd166] border border-[#50461a]",
    D: "bg-[#3a1608] text-[#ff914d] border border-[#5a2a12]",
    F: "bg-[#3a0f13] text-[#ff6b6b] border border-[#5a1a1f]",
  };
  return map[grade] || "bg-[#1e1f22] text-gray-300 border border-[#2b2d33]";
};

const sevPill = (sev) => {
  const s = String(sev || "info").toLowerCase();
  if (s === "critical") return "bg-[#3a0f13] text-[#ff6b6b] border border-[#5a1a1f]";
  if (s === "high") return "bg-[#3a1608] text-[#ff914d] border border-[#5a2a12]";
  if (s === "medium") return "bg-[#2f2a12] text-[#ffd166] border border-[#50461a]";
  if (s === "low") return "bg-[#0e2a3a] text-[#86d1ff] border border-[#1a465e]";
  return "bg-[#1e1f22] text-gray-300 border border-[#2b2d33]";
};

const Dashboard = () => {
  const [toast, setToast] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(false);
  const { data: scans = [] } = useGetAllScanQuery(null,{
    pollingInterval:600000,
    refetchOnFocus: true  
  });
  const [saveReport] = useSaveReportMutation();

  const totalScans = scans.length;
  const domainCount = scans.length;
  const highRiskFindings = scans.reduce((acc, s) => {
    return acc + (s.result.risks.filter(r => String(r.severity).toLowerCase() === "high").length)
  }, 0);

  const avgGrade = (() => {
    const grades = scans.map(s => s.result.sslGrade).filter(Boolean);
    if (!grades.length) return "-"
    return grades[0];
  })();

  const stats = [
    { label: "Total Scans", value: totalScans },
    { label: "High Risk Findings", value: highRiskFindings },
    { label: "Domains Scanned", value: domainCount },
    { label: "Avg SSL Grade", value: avgGrade },
  ];

  const toggleExpand = () => setExpandedDomain(prev=>!prev);

  const handleSaveSingle = async (row) => {
    await saveReport({ scanId: row._id, domain: row.target });
    setToast("Saved Successfully");
    setTimeout(()=>setToast(null),1500);
  };

  const handleSaveAll = async () => {
    for (let sc of scans) await saveReport({ scanId: sc._id, domain: sc.target });
    setToast("All Saved Successfully");
    setTimeout(()=>setToast(null),1500);
  };

  const recentScans = scans.slice().reverse();
  const worstDomains = scans.slice()
    .sort((a, b) => b.result.maxSevScore - a.result.maxSevScore)
    .map(s => ({
      domain: s.target,
      worst: s.result.worstSeverity,
      issues: s.result.risks.map(r => r.message),
      meta: { subdomains: s.result.subdomainCount, tls13: s.result.modernTLS }
    }));

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#0b0b0c] text-gray-100">
      <div className="px-6 pt-8 pb-2">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl sm:ml-10  font-semibold tracking-tight">Security Overview</h1>
            <p className="sm:ml-10  text-sm text-gray-400">Passive scan insights across your monitored assets</p>
          </div>
          <button className="text-sm px-3 py-2 rounded-md bg-[#1a1b20] border border-[#2a2b31] hover:bg-[#202127]" type="button" onClick={handleSaveAll}>Save All</button>
        </div>
      </div>

      <div className="px-6 pt-5 grid gap-4 grid-cols-2 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl bg-[#111214] border border-[#1f1f22] p-4">
            <div className="text-xs uppercase text-gray-400">{s.label}</div>
            <div className="mt-1 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="px-6 mt-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <div className="rounded-xl overflow-hidden border border-[#1f1f22] bg-[#111214]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f22]">
              <div>
                <div className="text-sm font-semibold">Recent Scans</div>
                <div className="text-xs text-gray-500">Latest activity across your assets</div>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 bg-[#0d0e12] text-xs text-gray-400 border-b border-[#1f1f22]">
              <div className="col-span-6 sm:col-span-5 px-4 py-2">Target</div>
              <div className="col-span-3 sm:col-span-2 px-4 py-2">Grade</div>
              <div className="col-span-3 sm:col-span-2 px-4 py-2">Worst Severity</div>
              <div className="hidden sm:block sm:col-span-1 px-4 py-2 text-right">Findings</div>
              <div className="col-span-3 sm:col-span-2 px-4 py-2 text-center">Save</div>
            </div>

            <div className="divide-y divide-[#1f1f22]">
              {recentScans.map((s, i) => (
                <div key={i} className="grid grid-cols-6 sm:grid-cols-12 items-center hover:bg-[#15161b] transition">
                  <div className="col-span-6 sm:col-span-5 px-4 py-3">
                    <div className="text-sm truncate">{s.target}</div>
                    <div className="text-[11px] text-gray-500">Completed</div>
                  </div>
                  <div className="col-span-3 sm:col-span-2 px-4 py-3">
                    <span className={`text-xs px-2 py-[3px] rounded-md ${gradeBadge(s.result.sslGrade)}`}>{s.result.sslGrade}</span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 px-4 py-3">
                    <span className={`text-[11px] px-2 py-[3px] rounded-full font-semibold ${sevPill(s.result.worstSeverity)}`}>{String(s.result.worstSeverity || "info").toUpperCase()}</span>
                  </div>
                  <div className="hidden sm:block sm:col-span-1 px-4 py-3 text-right text-sm">{s.result.risks.length}</div>
                  <div className="col-span-3 sm:col-span-2 px-4 py-3 text-center">
                    <button type="button" className="text-[11px] bg-[#03a48c] text-[#101213] px-2 py-1 rounded hover:bg-[#029e85]" onClick={() => handleSaveSingle(s)}>Save</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-xl border border-[#1f1f22] bg-[#111214] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1f1f22]">
              <div className="text-sm font-semibold">Top Risk Domains</div>
              <div className="text-xs text-gray-500">Prioritize these assets first</div>
            </div>

            <div className="p-4 space-y-3">
              {(expandedDomain ? worstDomains : worstDomains.slice(0,2)).map((w, i) => (
                <div key={i} className="rounded-lg border border-[#1f1f22] bg-[#0d0e12] p-3 hover:border-[#2a2b31] transition">
                  <div className="flex items-start justify-between">
                    <div className="truncate">
                      <div className="text-sm font-medium truncate">{w.domain}</div>
                      <div className="text-[11px] text-gray-500">Subdomains: {w.meta.subdomains} • TLS1.3: {w.meta.tls13 ? "Yes" : "No"}</div>
                    </div>
                    <span className={`text-[11px] px-2 py-[3px] rounded-full font-semibold ${sevPill(w.worst)}`}>{w.worst.toUpperCase()}</span>
                  </div>

                  <div className="mt-2 space-y-1">
                    {w.issues.map((issue, idx) => (
                      <div key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2a2b31]" />
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-1">
                <button onClick={toggleExpand} className="text-xs text-gray-400 hover:text-gray-200" type="button">{ expandedDomain ? "Hide" : "View all →"}</button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#1f1f22] bg-[#111214]">
            <div className="px-4 py-3 border-b border-[#1f1f22]">
              <div className="text-sm font-semibold">Hardening Tips</div>
            </div>
            <div className="p-4 text-xs text-gray-300 space-y-2">
              <div className="flex gap-2"><span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[#2a2b31]" />Enable HSTS with long max-age + includeSubDomains.</div>
              <div className="flex gap-2"><span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[#2a2b31]" />Add a strict Content-Security-Policy to reduce XSS.</div>
              <div className="flex gap-2"><span className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-[#2a2b31]" />Disable weak cipher suites and prefer TLS 1.3.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-8" />

      {toast && (
        <div className="fixed top-10 right-8 bg-[#03a47c] text-white px-4 py-2 rounded-md shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
