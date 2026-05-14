import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useContent } from "../context/ContentContext";
import Icon from "../components/Icon";
import PinchZoom from "../components/PinchZoom/PinchZoom";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function LearnPresentation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const week = params.get("week") ? Number(params.get("week")) : 1;
  const { ensurePresentations } = useContent();

  const [presentations, setPresentations] = useState([]);
  const [active, setActive] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(Math.min(window.innerWidth - 20, 900));

  useEffect(() => {
    ensurePresentations(week).then((list) => {
      setPresentations(list);
      if (list.length === 1) setActive(list[0]);
    });
  }, [week, ensurePresentations]);

  useEffect(() => {
    setPageIndex(0);
    setNumPages(0);
  }, [active]);

  useEffect(() => {
    const onResize = () => setPageWidth(Math.min(window.innerWidth - 20, 900));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const goNext = () => setPageIndex((i) => (i + 1 < numPages ? i + 1 : i));
  const goPrev = () => setPageIndex((i) => Math.max(0, i - 1));

  if (active) {
    return (
      <div style={viewerWrap}>
        <header style={viewerTop}>
          <button onClick={() => setActive(null)} style={topBtn}>
            <Icon name="rightArrow" size={14} color="#fff" /> רשימה
          </button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
            {numPages > 0 ? `${pageIndex + 1} / ${numPages}` : "טוען..."}
          </span>
          <a href={active.url} target="_blank" rel="noreferrer" style={topBtn}>
            הורדה
          </a>
        </header>
        <div style={{ flex: 1, minHeight: 0, background: "#1a1a1a" }}>
          <PinchZoom onNext={goNext} onPrev={goPrev} key={pageIndex}>
            <Document
              file={active.url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<p style={{ color: "#fff", padding: 40 }}>טוען מצגת...</p>}
              error={<p style={{ color: "#fff", padding: 40 }}>שגיאה בטעינה</p>}
            >
              <Page
                pageNumber={pageIndex + 1}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </PinchZoom>
        </div>
        <div className="pres-viewer-nav" style={viewerNav}>
          <button style={navBtn} onClick={goPrev} disabled={pageIndex === 0}>
            <Icon name="rightArrow" size={14} color="#fff" /> הקודם
          </button>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, textAlign: "center" }}>
            סווייפ ← / → · פינץ' לזום · דאבל-טאפ
          </div>
          <button style={navBtn} onClick={goNext} disabled={pageIndex >= numPages - 1}>
            הבא <Icon name="leftArrow" size={14} color="#fff" />
          </button>
        </div>
        <style>{`
          @media (max-width: 768px), (hover: none) and (pointer: coarse) {
            .pres-viewer-nav { display: none !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <header style={top}>
        <button onClick={() => navigate("/learn")} style={backBtn}>
          <Icon name="rightArrow" size={14} /> חזרה
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>מצגות · שבוע {week}</h2>
      </header>

      {presentations.length === 0 ? (
        <p style={{ color: "#6b7280" }}>אין מצגות לשבוע {week}.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {presentations.map((p) => (
            <button key={p.name} onClick={() => setActive(p)} style={pdfCard}>
              <div style={pdfIcon}>
                <Icon name="presentations" size={26} color="#fff" />
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>PDF</div>
              </div>
              <span style={{ color: "#16284b", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                פתיחה <Icon name="rightArrow" size={12} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const wrap = { maxWidth: 700, margin: "0 auto", padding: 16 };
const top = { display: "flex", alignItems: "center", gap: 16, marginBottom: 16 };
const backBtn = { background: "transparent", border: "none", color: "#16284b", cursor: "pointer", fontSize: 15, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 };

const pdfCard = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 14,
  background: "#fff",
  border: "none",
  borderRadius: 14,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(22,40,75,0.08)",
};
const pdfIcon = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "#16284b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 12px rgba(22,40,75,0.2)",
  flexShrink: 0,
};

const viewerWrap = {
  position: "fixed",
  inset: 0,
  background: "#000",
  display: "flex",
  flexDirection: "column",
  zIndex: 1000,
};
const viewerTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 10,
  background: "#0b1c3b",
  gap: 10,
  borderBottom: "2px solid #f7c90c",
};
const topBtn = {
  color: "#fff",
  background: "rgba(255,255,255,0.1)",
  padding: "6px 12px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 600,
  border: "1px solid rgba(255,255,255,0.25)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const viewerNav = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  background: "#0b1c3b",
  borderTop: "2px solid #f7c90c",
  gap: 8,
};

const navBtn = {
  background: "#f7c90c",
  color: "#16284b",
  border: "none",
  padding: "8px 14px",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

export default LearnPresentation;
