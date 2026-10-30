import React, { useState } from "react";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../data/authService";
import { ApiError } from "../lib/api";
import { CelestialAuthLeft } from "../components/CelestialAuthLeft";
import "../styles/LoginScreen.css";

interface ResetPasswordScreenProps { onBackToLogin: () => void; }

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !/^\d{6}$/.test(code.trim())) { setError("Vui lòng nhập email và mã xác minh gồm 6 chữ số."); return; }
    if (password !== confirmation) { setError("Hai mật khẩu chưa trùng khớp."); return; }
    setSubmitting(true);
    try { await resetPassword(email, code, password); setComplete(true); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "Không thể đặt lại mật khẩu. Vui lòng thử lại."); }
    finally { setSubmitting(false); }
  };

  return <main className="split-login-viewport">
    <CelestialAuthLeft />
    <div className="split-login-right">
      <div className="split-form-wrapper">
        <div className="split-form-header">
          <h1 className="split-form-title"><span className="split-seal-badge" aria-hidden="true">定</span> Đặt mật khẩu mới</h1>
          <p className="split-form-subtitle">Chọn mật khẩu mới để tiếp tục sử dụng tài khoản.</p>
        </div>
        {error && <div role="alert" className="split-alert split-alert--error">{error}</div>}
        {complete ? <div className="space-y-4">
          <div className="split-success-card"><div className="split-success-card-title"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><span>Mật khẩu đã được cập nhật</span></div><p className="split-success-card-body">Đăng nhập lại bằng mật khẩu mới. Các phiên đăng nhập cũ đã bị thu hồi.</p></div>
          <button type="button" onClick={onBackToLogin} className="split-submit-btn"><KeyRound className="h-4 w-4" />ĐĂNG NHẬP</button>
        </div> : <form onSubmit={handleSubmit} className="split-form">
          <div className="space-y-1.5"><label htmlFor="reset-email" className="block text-sm font-medium text-ink">Email tài khoản</label><div className="split-input-field"><KeyRound className="split-input-icon" aria-hidden="true" /><input id="reset-email" name="email" className="split-input-box" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email.cua.ban@domain.com" /></div></div>
          <div className="space-y-1.5"><label htmlFor="reset-code" className="block text-sm font-medium text-ink">Mã xác minh</label><div className="split-input-field"><KeyRound className="split-input-icon" aria-hidden="true" /><input id="reset-code" name="code" className="split-input-box" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Nhập mã 6 chữ số" /></div></div>
          <div className="space-y-1.5"><label htmlFor="reset-password" className="block text-sm font-medium text-ink">Mật khẩu mới</label><div className="split-input-field"><KeyRound className="split-input-icon" aria-hidden="true" /><input id="reset-password" name="new-password" className="split-input-box" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" /></div></div>
          <div className="space-y-1.5"><label htmlFor="reset-confirmation" className="block text-sm font-medium text-ink">Nhập lại mật khẩu mới</label><div className="split-input-field"><KeyRound className="split-input-icon" aria-hidden="true" /><input id="reset-confirmation" name="new-password-confirmation" className="split-input-box" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Nhập lại mật khẩu" /></div></div>
          <p className="text-xs text-stone-600">Mật khẩu cần có chữ hoa, chữ thường và chữ số.</p>
          <button type="submit" className="split-submit-btn" disabled={submitting}><span>{submitting ? "ĐANG CẬP NHẬT…" : "LƯU MẬT KHẨU MỚI"}</span></button>
        </form>}
        {!complete && <div className="split-footer-link"><button type="button" onClick={onBackToLogin} className="split-register-action"><ArrowLeft className="inline h-4 w-4" /> Trở lại đăng nhập</button></div>}
      </div>
    </div>
  </main>;
};
