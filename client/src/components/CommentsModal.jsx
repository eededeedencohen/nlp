import { useEffect, useRef, useState } from "react";
import Modal from "./Modal/Modal";
import Icon from "./Icon";
import { listComments, addComment, deleteComment } from "../services/commentService";
import { useAuth } from "../context/AuthContext";
import "./CommentsModal.css";

function formatTime(iso) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  if (isYesterday) return `אתמול · ${time}`;
  return d.toLocaleDateString("he-IL") + " · " + time;
}

function CommentsModal({ open, onClose, type, number, headline, week = 1 }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const refresh = async () => {
    if (!open) return;
    setLoading(true);
    try {
      const data = await listComments(type, number, week);
      // reverse: newest at bottom (chat style)
      setComments([...data].reverse());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) refresh();
    else {
      setText("");
      setComments([]);
    }
  }, [open, type, number, week]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const c = await addComment(type, number, currentUser._id, t, week);
      setComments((prev) => [...prev, c]);
      setText("");
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("למחוק את התגובה?")) return;
    await deleteComment(id, currentUser._id);
    setComments((prev) => prev.filter((c) => c._id !== id));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(e);
    }
  };

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(120, el.scrollHeight) + "px";
  };

  const title = `תגובות · ${headline || `#${number}`}`;

  return (
    <Modal open={open} onClose={onClose} title={title} fullBleed>
      <div className="cm-wrap">
        <div className="cm-list" ref={listRef}>
          {loading ? (
            <div className="cm-loading">טוען תגובות...</div>
          ) : comments.length === 0 ? (
            <div className="cm-empty">
              <div className="cm-empty-icon">
                <Icon name="comment" size={32} />
              </div>
              <div className="cm-empty-title">אין עדיין תגובות</div>
              <div className="cm-empty-sub">היו הראשונים לשתף מחשבה!</div>
            </div>
          ) : (
            comments.map((c) => {
              const mine = c.userId?._id === currentUser._id;
              const name = c.userId?.name || "?";
              return (
                <div key={c._id} className={`cm-row ${mine ? "mine" : ""}`}>
                  <div className="cm-avatar">{name.charAt(0)}</div>
                  <div className="cm-bubble-col">
                    <div className="cm-meta">
                      <span className="cm-name">{mine ? "אני" : name}</span>
                      <span>·</span>
                      <span>{formatTime(c.createdAt)}</span>
                    </div>
                    <div className="cm-bubble">
                      {c.text}
                      {mine && (
                        <button
                          className="cm-del"
                          onClick={() => remove(c._id)}
                          aria-label="מחק"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form className="cm-input-bar" onSubmit={send}>
          <textarea
            ref={textareaRef}
            className="cm-textarea"
            placeholder="כתבו תגובה..."
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={onKeyDown}
            disabled={sending}
          />
          <button
            type="submit"
            className="cm-send"
            disabled={sending || !text.trim()}
            aria-label="שלח"
          >
            <Icon name="send" size={18} />
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default CommentsModal;
