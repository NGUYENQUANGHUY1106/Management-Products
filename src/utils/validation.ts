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
