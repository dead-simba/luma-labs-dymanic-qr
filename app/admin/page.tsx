"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Link {
  id: string;
  shortCode: string;
  destinationUrl: string;
  scanCount: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    shortCode: "",
    destinationUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: ""
  });
  const router = useRouter();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    const res = await fetch("/api/links");
    if (res.ok) {
      const data = await res.json();
      setLinks(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct final URL with UTM parameters
    let finalUrl = formData.destinationUrl;
    if (formData.utmSource || formData.utmMedium || formData.utmCampaign) {
      try {
        const urlObj = new URL(finalUrl);
        if (formData.utmSource) urlObj.searchParams.set("utm_source", formData.utmSource);
        if (formData.utmMedium) urlObj.searchParams.set("utm_medium", formData.utmMedium);
        if (formData.utmCampaign) urlObj.searchParams.set("utm_campaign", formData.utmCampaign);
        finalUrl = urlObj.toString();
      } catch (err) {
        // If the URL is invalid (e.g., missing protocol), we'll let the backend validation fail naturally
        console.warn("Invalid URL submitted, UTMs not attached.");
      }
    }

    const payload = {
      shortCode: formData.shortCode,
      destinationUrl: finalUrl
    };

    const url = editingLink ? `/api/links/${editingLink.id}` : "/api/links";
    const method = editingLink ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingLink(null);
      setFormData({ shortCode: "", destinationUrl: "", utmSource: "", utmMedium: "", utmCampaign: "" });
      setShowAdvanced(false);
      fetchLinks();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this link?")) {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (res.ok) fetchLinks();
    }
  };

  const openEditModal = (link: Link) => {
    setEditingLink(link);

    // Attempt to parse existing UTMs if present
    let base = link.destinationUrl;
    let s = "", m = "", c = "";
    try {
      const parsed = new URL(link.destinationUrl);
      s = parsed.searchParams.get("utm_source") || "";
      m = parsed.searchParams.get("utm_medium") || "";
      c = parsed.searchParams.get("utm_campaign") || "";

      // Strip UTMs from the base URL input for editing
      if (s || m || c) {
        parsed.searchParams.delete("utm_source");
        parsed.searchParams.delete("utm_medium");
        parsed.searchParams.delete("utm_campaign");
        base = parsed.toString();
      }
    } catch (e) { }

    setFormData({
      shortCode: link.shortCode,
      destinationUrl: base,
      utmSource: s,
      utmMedium: m,
      utmCampaign: c
    });
    setShowAdvanced(!!(s || m || c));
    setIsModalOpen(true);
  };

  const handleCopy = (shortCode: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(url);
    // Optional: Could add a small toast notification here
    alert(`Copied: ${url}`);
  };

  return (
    <div className="admin-layout">
      <nav className="navbar">
        <div className="nav-content">
          <div className="brand">
            <h1>Luma Labs</h1>
            <span className="badge">Routing</span>
          </div>
          <button onClick={handleLogout} className="btn-secondary">Log out</button>
        </div>
      </nav>

      <main className="container">
        <header className="page-header">
          <div>
            <h2>QR Redirects</h2>
            <p>Manage standard shortlinks and QR destinations.</p>
          </div>
          <button onClick={() => {
            setEditingLink(null);
            setFormData({ shortCode: "", destinationUrl: "", utmSource: "", utmMedium: "", utmCampaign: "" });
            setShowAdvanced(false);
            setIsModalOpen(true);
          }} className="btn-primary">
            New Link
          </button>
        </header>

        {loading ? (
          <div className="loading">Loading database...</div>
        ) : (
          <div className="table-wrapper">
            <table className="link-table">
              <thead>
                <tr>
                  <th>Short Code</th>
                  <th>Destination URL</th>
                  <th>Scans</th>
                  <th>Created</th>
                  <th className="action-column"></th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <div className="code-cell">
                        <span className="code-text">{link.shortCode}</span>
                        <button onClick={() => handleCopy(link.shortCode)} className="copy-btn" title="Copy URL">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      </div>
                    </td>
                    <td className="url-cell" title={link.destinationUrl}>{link.destinationUrl}</td>
                    <td><span className="scan-count">{link.scanCount}</span></td>
                    <td className="date-cell">{new Date(link.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="action-column">
                      <div className="actions">
                        <button onClick={() => openEditModal(link)} className="action-btn">Edit</button>
                        <button onClick={() => handleDelete(link.id)} className="action-btn delete">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {links.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">No links found. Create one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingLink ? "Edit Link" : "Create New Link"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Short Code</label>
                <input
                  className="input"
                  value={formData.shortCode}
                  onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                  placeholder="e.g. arbutin-01"
                  required
                />
                <p className="helper-text">This will be the path: /your-short-code</p>
              </div>
              <div className="form-group">
                <label>Base Destination URL</label>
                <input
                  className="input"
                  value={formData.destinationUrl}
                  onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                  placeholder="https://lumalabs.pk/products/..."
                  required
                />
              </div>

              <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? "▼ Hide Analytics Tracking" : "► Add Analytics Tracking (UTM)"}
              </div>

              {showAdvanced && (
                <div className="advanced-section">
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Campaign Source</label>
                      <input
                        className="input utm-input"
                        value={formData.utmSource}
                        onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                        placeholder="e.g. qr_code"
                      />
                    </div>
                    <div className="form-group half">
                      <label>Campaign Medium</label>
                      <input
                        className="input utm-input"
                        value={formData.utmMedium}
                        onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                        placeholder="e.g. print"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Campaign Name</label>
                    <input
                      className="input utm-input"
                      value={formData.utmCampaign}
                      onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                      placeholder="e.g. summer_sale_2026"
                    />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingLink ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          background: var(--background);
          padding-top: 60px;
        }
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 52px;
          display: flex;
          align-items: center;
          z-index: 100;
          background: var(--background);
          border-bottom: 1px solid var(--border);
        }
        .nav-content {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 40px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand h1 {
          font-size: 14px;
          font-weight: 600;
          color: var(--foreground);
        }
        .badge {
          font-size: 11px;
          background: var(--muted);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--muted-foreground);
          font-weight: 500;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 60px 40px;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
        }
        .page-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: -0.02em;
        }
        .page-header p {
          color: var(--muted-foreground);
          font-size: 14px;
        }
        .btn-secondary {
          padding: 6px 12px;
          color: var(--muted-foreground);
          font-weight: 500;
          font-size: 14px;
          border-radius: var(--radius);
          transition: var(--transition);
        }
        .btn-secondary:hover {
          background: var(--muted);
          color: var(--foreground);
        }
        .loading {
          color: var(--muted-foreground);
          font-size: 14px;
          padding: 20px 0;
        }
        .table-wrapper {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .link-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          background: var(--background);
        }
        .link-table th {
          padding: 12px 16px;
          font-size: 12px;
          color: var(--muted-foreground);
          font-weight: 500;
          border-bottom: 1px solid var(--border);
        }
        .link-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          color: var(--foreground);
        }
        .link-table tr:last-child td {
          border-bottom: none;
        }
        .link-table tr:hover td {
          background-color: rgba(15, 15, 15, 0.02);
        }
        .dark .link-table tr:hover td {
          background-color: rgba(255, 255, 255, 0.02);
        }
        .code-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .code-text {
          font-weight: 500;
        }
        .copy-btn {
          color: var(--muted-foreground);
          opacity: 0;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
        }
        tr:hover .copy-btn {
          opacity: 1;
        }
        .copy-btn:hover {
          background: var(--muted);
          color: var(--foreground);
        }
        .url-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--muted-foreground);
        }
        .date-cell {
          color: var(--muted-foreground);
        }
        .scan-count {
          font-variant-numeric: tabular-nums;
        }
        .action-column {
          width: 120px;
          text-align: right;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .empty-state {
          text-align: center;
          padding: 40px !important;
          color: var(--muted-foreground);
        }
        .action-btn {
          font-size: 13px;
          font-weight: 500;
          color: var(--muted-foreground);
        }
        .action-btn:hover {
          color: var(--foreground);
        }
        .action-btn.delete:hover {
          color: var(--accent-secondary);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 15, 15, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .dark .modal-overlay {
          background: rgba(0, 0, 0, 0.6);
        }
        .modal {
          width: 100%;
          max-width: 440px;
          background: var(--background);
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border);
        }
        .modal h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 6px;
          color: var(--muted-foreground);
        }
        .helper-text {
          font-size: 12px;
          color: var(--muted-foreground);
          margin-top: 6px;
        }
        .advanced-toggle {
          font-size: 13px;
          font-weight: 500;
          color: var(--muted-foreground);
          cursor: pointer;
          margin: 16px 0;
          user-select: none;
          transition: var(--transition);
        }
        .advanced-toggle:hover {
          color: var(--foreground);
        }
        .advanced-section {
          background: rgba(15, 15, 15, 0.02);
          border: 1px dashed var(--border);
          border-radius: var(--radius);
          padding: 16px;
          margin-bottom: 20px;
        }
        .dark .advanced-section {
           background: rgba(255, 255, 255, 0.02);
        }
        .form-row {
          display: flex;
          gap: 16px;
        }
        .form-group.half {
          flex: 1;
        }
        .utm-input {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 12px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 28px;
        }
      `}</style>
    </div>
  );
}

