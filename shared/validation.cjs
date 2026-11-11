const email = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();
function validateProfile(data, { password = false } = {}) {
  const allowed = password
    ? ["email", "hoten", "hinhanh", "password"]
    : ["email", "hoten", "hinhanh"];
  if (
    !data ||
    typeof data !== "object" ||
    Object.keys(data).some((k) => !allowed.includes(k))
  )
    throw new Error("Dữ liệu có trường không hợp lệ.");
  if (["email", "hoten", "hinhanh"].some((k) => typeof data[k] !== "string"))
    throw new Error("Email, họ tên và hình ảnh phải là chuỗi.");
  const out = {
    email: email(data.email),
    hoten: data.hoten.trim(),
    hinhanh: data.hinhanh.trim(),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email) || out.email.length > 254)
    throw new Error("Email không hợp lệ.");
  if (out.hoten.length < 2 || out.hoten.length > 100)
    throw new Error("Họ tên phải từ 2 đến 100 ký tự.");
  if (out.hinhanh) {
    try {
      const u = new URL(out.hinhanh);
      if (
        !["https:", "http:"].includes(u.protocol) ||
        u.username ||
        u.password ||
        out.hinhanh.length > 2048
      )
        throw Error();
    } catch {
      throw new Error("Ảnh phải là URL HTTP/HTTPS hợp lệ.");
    }
  }
  if (
    password &&
    (typeof data.password !== "string" ||
      data.password.length < 8 ||
      data.password.length > 128)
  )
    throw new Error("Mật khẩu phải từ 8 đến 128 ký tự.");
  return out;
}
module.exports = { email, validateProfile };
