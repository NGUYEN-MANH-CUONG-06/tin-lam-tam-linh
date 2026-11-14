import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiBackendRequest } from "../lib/api";

interface DemoCatalogStatus {
  enabled: boolean;
  xinXam: { status: string; count: number; expectedCount: number; systemId: string; datasetVersion: string };
  xinKeo: { status: string; version: string; outcomes: Array<{ result: string; title: string; statusLabel: string; meaning: string; guidance: string }> };
  disclaimer: string;
}

export function DemoCatalogStatusPanel() {
  const [status, setStatus] = useState<DemoCatalogStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await apiBackendRequest<DemoCatalogStatus>("/demo/reflections/status"));
    } catch (cause) {
      setStatus(null);
      setError(cause instanceof Error ? cause.message : "Không tải được trạng thái Demo từ backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <section className="admin-panel" aria-labelledby="demo-catalog-status-title">
      <header className="admin-panel-heading">
        <div>
          <h2 id="demo-catalog-status-title">Nội dung dùng trong Demo</h2>
          <p className="admin-muted">Dữ liệu demo tách biệt với trạng thái duyệt và phát hành chính thức.</p>
        </div>
        <button type="button" className="admin-secondary-button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? "admin-spin-icon" : ""} /> Làm mới
        </button>
      </header>
      {loading && <p role="status" className="admin-muted">Đang đọc trạng thái từ backend…</p>}
      {!loading && error && <p role="alert" className="admin-muted">{error}</p>}
      {!loading && status && (
        <>
          <div className="admin-metric-grid">
            <article className="admin-metric-card metric-gold">
              <span>Xin xăm</span>
              <strong>{status.xinXam.count}/{status.xinXam.expectedCount}</strong>
              <small className="admin-metric-note">{status.xinXam.status} · {status.xinXam.systemId} · {status.xinXam.datasetVersion}</small>
            </article>
            <article className="admin-metric-card metric-emerald">
              <span>Xin keo</span>
              <strong>{status.xinKeo.outcomes.length} kết quả</strong>
              <small className="admin-metric-note">{status.xinKeo.status} · {status.xinKeo.version} · nội dung cố định trong backend</small>
            </article>
          </div>
          <p role="note" className="admin-muted">{status.enabled ? "Tự động kích hoạt cho môi trường Demo – chưa được duyệt phát hành chính thức." : "Backend chưa bật Demo auto-activation."} {status.disclaimer}</p>
          {status.xinKeo.outcomes.length > 0 && (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead><tr><th>Mã</th><th>Tên kết quả</th><th>Mô tả đang dùng</th><th>Hướng dẫn</th></tr></thead>
                <tbody>{status.xinKeo.outcomes.map((outcome) => (
                  <tr key={outcome.result}>
                    <td>{outcome.result}</td>
                    <td>{outcome.title}<br /><small>{outcome.statusLabel}</small></td>
                    <td>{outcome.meaning}</td>
                    <td>{outcome.guidance}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
