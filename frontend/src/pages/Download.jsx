
import {
  useGetSavedReportsQuery,
  useDeleteSavedReportMutation,
} from "../redux/store/api/apiSlice";
import { Trash2 } from "lucide-react";

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

const Download = () => {
  const { data: saved = [], isLoading, isError } = useGetSavedReportsQuery();
  const [deleteSavedReport, { isLoading: isDeleting }] = useDeleteSavedReportMutation();

  const handleDelete = async (id) => {
    try {

      const ok = window.confirm("Delete this saved report?");
      if (!ok) return;
      await deleteSavedReport(id).unwrap();
    } catch (e) {
      console.error(e);
      alert("Failed to delete report.");
    }
  };

  return (
    <div className="flex">
      <div className="min-h-screen bg-[#0b0b0c] text-gray-100 flex-1">
        <div className="px-6 pt-18 md:pt-7 pb-3">
          <h1 className="  text-xl font-semibold">Saved Reports</h1>
         
        </div>

        <div className="px-6 mt-4">
          <div className="rounded-xl border border-[#1f1f22] bg-[#111214] overflow-hidden">
     
            <div className="hidden md:grid grid-cols-12 bg-[#0d0e12] text-xs text-gray-400 border-b border-[#1f1f22]">
              <div className="col-span-3 px-4 py-2">Domain</div>
              <div className="col-span-2 px-4 py-2">Grade</div>
              <div className="col-span-2 px-4 py-2">Worst</div>
              <div className="col-span-1 px-4 py-2 text-right">Findings</div>
              <div className="col-span-2 px-4 py-2">Saved On</div>
              <div className="col-span-2 px-4 py-2 text-center">Actions</div>
            </div>

            <div className="divide-y divide-[#1f1f22]">
              {isLoading && (
                <div className="text-center text-gray-500 py-8 text-sm">Loading…</div>
              )}

              {isError && (
                <div className="text-center text-red-400 py-8 text-sm">
                  Failed to load saved reports.
                </div>
              )}

              {!isLoading &&
                !isError &&
                saved.map((r) => {
                  const scan = r.scanId || {};
                  const result = scan.result || {};
                  const grade = result.sslGrade || "-";
                  const worst = (result.worstSeverity || "info").toUpperCase();
                  const findings = Array.isArray(result.risks) ? result.risks.length : 0;
                  const savedAt = new Date(r.createdAt).toLocaleString();
                  const scanIdForPdf = scan?._id || r.scanId;

                  return (
                    <div
                      key={r._id}
                      className="px-4 py-3 text-sm hover:bg-[#15161b] transition"
                    >
                     
                      <div className="hidden md:grid grid-cols-12 items-center">
                        <div className="col-span-3 truncate">{r.domain}</div>
                        <div className="col-span-2">
                          <span
                            className={`text-xs px-2 py-[3px] rounded-md ${gradeBadge(
                              grade
                            )}`}
                          >
                            {grade}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`text-[11px] px-2 py-[3px] rounded-full font-semibold ${sevPill(
                              worst
                            )}`}
                          >
                            {worst}
                          </span>
                        </div>
                        <div className="col-span-1 text-right pr-4">{findings}</div>
                        <div className="col-span-2 text-xs pl-4 text-gray-400">
                          {savedAt}
                        </div>

                
                        <div className="col-span-2 flex items-center justify-center gap-7">
                          <button
                            type="button"
                            className="text-xs bg-[#03a48c] text-[#101213] px-3 py-1 rounded hover:bg-[#029e85]"
                            onClick={() =>
                              window.open(
                                `http://localhost:5000/api/scan/${scanIdForPdf}/pdf`,
                                "_blank"
                              )
                            }
                            disabled={!scanIdForPdf}
                            title={!scanIdForPdf ? "Scan not available" : "Download PDF"}
                          >
                            PDF
                          </button>

                          <button
                            type="button"
                            className="p-1 rounded border border-[#2b2d33] hover:bg-[#1a1b20]"
                            onClick={() => handleDelete(r._id)}
                            disabled={isDeleting}
                            title="Delete"
                          >
                            <Trash2 size={15} className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      <div className="md:hidden flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate">{r.domain}</span>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-xs bg-[#03a48c] text-[#101213] px-2 py-1 rounded"
                              onClick={() =>
                                window.open(
                                  `http://localhost:5000/api/scan/${scanIdForPdf}/pdf`,
                                  "_blank"
                                )
                              }
                              disabled={!scanIdForPdf}
                            >
                              PDF
                            </button>
                            <button
                              type="button"
                              className="p-1  rounded border border-[#2b2d33] hover:bg-[#1a1b20]"
                              onClick={() => handleDelete(r._id)}
                              disabled={isDeleting}
                              title="Delete"
                            >
                              <Trash2 size={15} className="text-red-400" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <span className={`px-2 rounded ${gradeBadge(grade)}`}>{grade}</span>
                          <span
                            className={`px-2 rounded-full font-semibold ${sevPill(worst)}`}
                          >
                            {worst}
                          </span>
                          <span className="text-gray-400">{findings} findings</span>
                        </div>

                        <div className="text-[10px] text-gray-500">{savedAt}</div>
                      </div>
                    </div>
                  );
                })}

              {!isLoading && !isError && !saved.length && (
                <div className="text-center text-gray-500 py-8 text-sm">
                  No saved reports yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
};

export default Download;
