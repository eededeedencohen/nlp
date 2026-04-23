import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getInfographics } from "../services/contentService";
import Icon from "../components/Icon";
import PinchZoom from "../components/PinchZoom/PinchZoom";

function LearnInfographics() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const week = params.get("week") ? Number(params.get("week")) : 1;

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(null);

  useEffect(() => {
    setLoading(true);
    getInfographics(week)
      .then(setImages)
      .finally(() => setLoading(false));
  }, [week]);

  const close = () => setOpened(null);
  const goNext = () => setOpened((i) => (i < images.length - 1 ? i + 1 : i));
  const goPrev = () => setOpened((i) => (i > 0 ? i - 1 : i));

  if (loading) return <div style={{ padding: 20 }}>טוען...</div>;

  return (
    <div style={wrap}>
      <header style={top}>
        <button onClick={() => navigate("/learn")} style={backBtn}>
          <Icon name="rightArrow" size={14} /> חזרה
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>אינפוגרפיות · שבוע {week}</h2>
      </header>

      {images.length === 0 ? (
        <p style={{ color: "#6b7280" }}>אין אינפוגרפיות לשבוע {week}.</p>
      ) : (
        <div style={grid}>
          {images.map((img, i) => (
            <button key={img.name} onClick={() => setOpened(i)} style={thumb}>
              <img src={img.url} alt={img.name} style={thumbImg} />
              <div style={thumbLabel}>#{i + 1}</div>
            </button>
          ))}
        </div>
      )}

      {opened !== null && images[opened] && (
        <div style={lightbox}>
          <div style={lbHeader}>
            <button style={ctrlBtn} onClick={close}>✕ סגור</button>
            <span style={{ color: "#fff", fontWeight: 700 }}>
              {opened + 1} / {images.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={ctrlBtn} onClick={goPrev} disabled={opened === 0}>
                <Icon name="rightArrow" size={14} color="#fff" />
              </button>
              <button style={ctrlBtn} onClick={goNext} disabled={opened === images.length - 1}>
                <Icon name="leftArrow" size={14} color="#fff" />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PinchZoom onNext={goNext} onPrev={goPrev} key={images[opened].url}>
              <img src={images[opened].url} alt="" />
            </PinchZoom>
          </div>
          <div style={footerHint}>בצעו פינץ' לזום · סווייפ לניווט · דאבל-טאפ לזום מהיר</div>
        </div>
      )}
    </div>
  );
}

const wrap = { maxWidth: 700, margin: "0 auto", padding: 16, paddingBottom: 40 };
const top = { display: "flex", alignItems: "center", gap: 16, marginBottom: 16 };
const backBtn = {
  background: "transparent",
  border: "none",
  color: "#16284b",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 12,
};

const thumb = {
  border: "none",
  padding: 0,
  borderRadius: 14,
  overflow: "hidden",
  cursor: "pointer",
  background: "#fff",
  boxShadow: "0 4px 14px rgba(22,40,75,0.08)",
  position: "relative",
};
const thumbImg = { width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" };
const thumbLabel = {
  position: "absolute",
  bottom: 6,
  right: 6,
  background: "#16284b",
  color: "#f7c90c",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const lightbox = {
  position: "fixed",
  inset: 0,
  background: "#000",
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
};
const lbHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 10,
  background: "rgba(11,28,59,0.95)",
};
const ctrlBtn = {
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  padding: "6px 14px",
  borderRadius: 999,
  cursor: "pointer",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
const footerHint = {
  background: "rgba(11,28,59,0.9)",
  color: "rgba(255,255,255,0.6)",
  textAlign: "center",
  padding: 8,
  fontSize: 11,
};

export default LearnInfographics;
