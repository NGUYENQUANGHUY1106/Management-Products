export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
export function validate(
  email: string,
  name?: string,
  password?: string,
  confirm?: string,
) {
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email)) ||
    email.length > 254
  )
    throw new Error("Email không hợp lệ.");
  if (
    name !== undefined &&
    (name.trim().length < 2 || name.trim().length > 100)
  )
    throw new Error("Họ tên phải từ 2 đến 100 ký tự.");
  if (password !== undefined && (password.length < 8 || password.length > 128))
    throw new Error("Mật khẩu phải từ 8 đến 128 ký tự.");
  if (confirm !== undefined && password !== confirm)
    throw new Error("Mật khẩu xác nhận chưa khớp.");
}
export function errorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Email đã được sử dụng.",
    "auth/invalid-credential": "Email hoặc mật khẩu chưa đúng.",
    "auth/invalid-login-credentials": "Email hoặc mật khẩu chưa đúng.",
    "auth/wrong-password": "Email hoặc mật khẩu chưa đúng.",
    "auth/user-not-found": "Email hoặc mật khẩu chưa đúng.",
    "auth/weak-password": "Mật khẩu chưa đủ mạnh.",
    "auth/too-many-requests": "Quá nhiều lần thử. Vui lòng thử lại sau.",
    "auth/network-request-failed":
      "Không thể kết nối mạng. Kiểm tra kết nối và thử lại.",
    "permission-denied": "Bạn không có quyền truy cập dữ liệu này.",
    unavailable: "Mất kết nối. Vui lòng kiểm tra mạng và thử lại.",
  };
  return (
    (code && messages[code]) ||
    (e instanceof Error ? e.message : "Có lỗi xảy ra. Hãy thử lại.")
  );
}
