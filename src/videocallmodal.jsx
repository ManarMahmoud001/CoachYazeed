import { useEffect, useState } from "react";
import { X, ExternalLink, Copy, Check, Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient";

function VideoCallModal({ roomName, callRequestId, onClose }) {
  const [webrtcSupported, setWebrtcSupported] = useState(true);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [callUrl, setCallUrl] = useState("");

  useEffect(() => {
    const supported = !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof window.RTCPeerConnection === "function"
    );
    setWebrtcSupported(supported);
  }, []);

  useEffect(() => {
    if (!roomName) return;

    let cancelled = false;

    const fetchJwt = async () => {
      setLoading(true);
      setError("");

      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-jitsi-jwt",
        { body: { roomName, callRequestId } }
      );

      if (cancelled) return;

      if (fnError || !data?.jwt) {
        console.error("generate-jitsi-jwt error:", fnError, data);
        setError("Couldn't start the call. Please try again in a moment.");
        setLoading(false);
        return;
      }

      setCallUrl(
        `https://8x8.vc/${data.appId}/${roomName}?jwt=${data.jwt}`
      );
      setLoading(false);
    };

    fetchJwt();

    return () => {
      cancelled = true;
    };
  }, [roomName, callRequestId]);

  if (!roomName) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(callUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable, ignore
    }
  };

  return (
    <div className="call-modal-overlay" onClick={onClose}>
      <div className="call-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="call-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        {loading ? (
          <div className="call-modal-loading">
            <Loader2 size={28} className="call-modal-spinner" />
            <p>Connecting to the call...</p>
          </div>
        ) : error ? (
          <div className="call-modal-unsupported">
            <h3>Couldn't start the call</h3>
            <p>{error}</p>
          </div>
        ) : !webrtcSupported ? (
          <div className="call-modal-unsupported">
            <h3>This browser can't join video calls</h3>
            <p>
              If you opened this link from WhatsApp, Instagram, or another
              app, that in-app browser blocks video calls. Open the link
              directly in Chrome or Safari instead.
            </p>

            <div className="call-modal-unsupported-actions">
              <a
                href={callUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn call-modal-open-btn"
              >
                <ExternalLink size={16} />
                Open in Browser
              </a>

              <button
                type="button"
                className="call-modal-copy-btn"
                onClick={handleCopy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <iframe
              src={callUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="call-modal-iframe"
              title="Video Call"
            />
            <div className="call-modal-fallback-bar">
              <span>Camera/mic not working here?</span>
              <a
                href={callUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="call-modal-fallback-link"
              >
                <ExternalLink size={14} />
                Open in a new tab
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VideoCallModal;
