"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Activation = {
  id: string;
  deviceName: string | null;
  osInfo: string | null;
  appVersion: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  revoked: boolean;
  revokedReason: string | null;
  hwidPrefix: string;
};

type License = {
  id: string;
  key: string;
  planName: string | null;
  maxDevices: number;
  status: string;
  buyerName: string | null;
  buyerEmail: string | null;
  expiresAt: string | null;
  offlineHours: number;
  note: string | null;
  createdAt: string;
  activations: Activation[];
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  active: "Hoạt động",
  suspended: "Tạm khoá",
  revoked: "Thu hồi",
};

export function LicenseManager({
  initialLicenses,
  initialSearch,
  initialStatus,
}: {
  initialLicenses: License[];
  initialSearch: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [licenses, setLicenses] = useState<License[]>(initialLicenses);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Create form state
  const [quantity, setQuantity] = useState(1);
  const [maxDevices, setMaxDevices] = useState(2);
  const [planName, setPlanName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdKeys, setCreatedKeys] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function reload(nextSearch = search, nextStatus = status) {
    const qs = new URLSearchParams();
    if (nextSearch) qs.set("search", nextSearch);
    if (nextStatus && nextStatus !== "all") qs.set("status", nextStatus);
    startTransition(() => router.push(`/admin/licenses?${qs.toString()}`));
    // Optimistic refetch of the JSON is unnecessary — server component reloads.
  }

  async function handleCreate() {
    setCreating(true);
    setMessage(null);
    setCreatedKeys([]);
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          maxDevices,
          planName: planName || null,
          buyerEmail: buyerEmail || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Không tạo được mã.");
      } else {
        setCreatedKeys(data.created || []);
        setMessage(`Đã tạo ${data.created?.length ?? 0} mã.`);
        router.refresh();
      }
    } catch {
      setMessage("Lỗi kết nối máy chủ.");
    } finally {
      setCreating(false);
    }
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Thao tác thất bại.");
        return;
      }
      router.refresh();
      // Reflect the status change locally for immediate feedback.
      if (typeof payload.action === "string") {
        setLicenses((prev) =>
          prev.map((l) => {
            if (l.id !== id) return l;
            if (payload.action === "suspend") return { ...l, status: "suspended" };
            if (payload.action === "activate") return { ...l, status: "active" };
            if (payload.action === "revoke") return { ...l, status: "revoked" };
            if (payload.action === "revoke_activation") {
              return {
                ...l,
                activations: l.activations.map((a) =>
                  a.id === payload.activationId ? { ...a, revoked: true } : a,
                ),
              };
            }
            return l;
          }),
        );
      }
    } catch {
      setMessage("Lỗi kết nối máy chủ.");
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => setMessage(`Đã copy: ${text}`),
      () => setMessage("Không copy được — hãy chọn và copy thủ công."),
    );
  }

  const activeCount = licenses.filter((l) => l.status === "active").length;

  return (
    <div>
      {/* ── Create panel ─────────────────────────────────────────────── */}
      <section className="dash-card" style={{ marginBottom: 20 }}>
        <h2 style={{ marginTop: 0 }}>Tạo mã giấy phép mới</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Số lượng</span>
            <input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ width: 90, padding: "6px 8px" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Số máy / mã</span>
            <input
              type="number"
              min={1}
              max={10}
              value={maxDevices}
              onChange={(e) => setMaxDevices(Number(e.target.value))}
              style={{ width: 90, padding: "6px 8px" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Tên gói (tuỳ chọn)</span>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Gói cơ bản"
              style={{ width: 180, padding: "6px 8px" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Email khách (tuỳ chọn)</span>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="khach@email.com"
              style={{ width: 220, padding: "6px 8px" }}
            />
          </label>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="btn btn-primary"
            style={{ padding: "8px 18px" }}
          >
            {creating ? "Đang tạo..." : "Tạo mã"}
          </button>
        </div>

        {message && (
          <p style={{ marginTop: 12, color: message.includes("Lỗi") ? "#ff8b8b" : "#7dd3a0" }}>
            {message}
          </p>
        )}

        {createdKeys.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, background: "rgba(125,211,160,.08)", borderRadius: 8 }}>
            <strong>Mã vừa tạo (copy gửi khách):</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {createdKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => copy(k)}
                  style={{
                    fontFamily: "monospace",
                    padding: "6px 10px",
                    background: "#1a1d29",
                    border: "1px solid #2a2f45",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "#e6e8ef",
                  }}
                  title="Bấm để copy"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Filter ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && reload(search, status)}
          placeholder="Tìm theo mã / email / tên khách..."
          style={{ flex: "1 1 260px", padding: "8px 10px" }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "8px 10px" }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="suspended">Tạm khoá</option>
          <option value="revoked">Thu hồi</option>
        </select>
        <button type="button" onClick={() => reload(search, status)} className="btn" disabled={isPending}>
          {isPending ? "Đang lọc..." : "Lọc"}
        </button>
      </div>

      {/* ── List ─────────────────────────────────────────────────────── */}
      <p style={{ opacity: 0.7, fontSize: 14 }}>
        {licenses.length} mã hiển thị · {activeCount} đang hoạt động
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Gói</th>
              <th>Thiết bị</th>
              <th>Trạng thái</th>
              <th>Khách</th>
              <th>Hết hạn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 24, opacity: 0.6 }}>
                  Chưa có mã nào. Tạo mã đầu tiên ở trên.
                </td>
              </tr>
            )}
            {licenses.map((l) => {
              const activeDevices = l.activations.filter((a) => !a.revoked).length;
              const isOpen = expanded === l.id;
              return (
                <>
                  <tr key={l.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => copy(l.key)}
                        style={{
                          fontFamily: "monospace",
                          background: "none",
                          border: "none",
                          color: "#8ab4ff",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        title="Bấm để copy"
                      >
                        {l.key}
                      </button>
                    </td>
                    <td>{l.planName || "—"}</td>
                    <td>
                      {activeDevices}/{l.maxDevices}{" "}
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : l.id)}
                        style={{ background: "none", border: "none", color: "#8ab4ff", cursor: "pointer" }}
                      >
                        {isOpen ? "▲" : "▼"}
                      </button>
                    </td>
                    <td>
                      <span className="status">{STATUS_LABEL[l.status] || l.status}</span>
                    </td>
                    <td>{l.buyerEmail || l.buyerName || "—"}</td>
                    <td>{l.expiresAt ? fmtDate(l.expiresAt) : "Không hết hạn"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {l.status === "active" ? (
                        <button type="button" onClick={() => patch(l.id, { action: "suspend" })} className="btn">
                          Tạm khoá
                        </button>
                      ) : (
                        <button type="button" onClick={() => patch(l.id, { action: "activate" })} className="btn">
                          Mở khoá
                        </button>
                      )}{" "}
                      {l.status !== "revoked" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Thu hồi vĩnh viễn mã ${l.key}?`)) {
                              patch(l.id, { action: "revoke" });
                            }
                          }}
                          className="btn"
                          style={{ color: "#ff8b8b" }}
                        >
                          Thu hồi
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${l.id}-detail`}>
                      <td colSpan={7} style={{ background: "rgba(255,255,255,.02)", padding: 16 }}>
                        <strong>Thiết bị đã kích hoạt:</strong>
                        {l.activations.length === 0 && <p style={{ opacity: 0.6 }}>Chưa có máy nào kích hoạt.</p>}
                        {l.activations.length > 0 && (
                          <table style={{ marginTop: 8 }}>
                            <thead>
                              <tr>
                                <th>Máy</th>
                                <th>HĐH</th>
                                <th>App</th>
                                <th>HWID</th>
                                <th>Kích hoạt</th>
                                <th>Lần cuối</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {l.activations.map((a) => (
                                <tr key={a.id} style={{ opacity: a.revoked ? 0.45 : 1 }}>
                                  <td>{a.deviceName || "Không tên"}</td>
                                  <td>{a.osInfo || "—"}</td>
                                  <td>{a.appVersion || "—"}</td>
                                  <td style={{ fontFamily: "monospace" }}>{a.hwidPrefix}…</td>
                                  <td>{fmtDate(a.firstSeenAt)}</td>
                                  <td>{fmtDate(a.lastSeenAt)}</td>
                                  <td>
                                    {a.revoked ? (
                                      <span style={{ opacity: 0.6 }}>Đã gỡ</span>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn"
                                        style={{ color: "#ff8b8b" }}
                                        onClick={() => {
                                          if (confirm("Gỡ máy này để giải phóng slot?")) {
                                            patch(l.id, { action: "revoke_activation", activationId: a.id });
                                          }
                                        }}
                                      >
                                        Gỡ máy
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
