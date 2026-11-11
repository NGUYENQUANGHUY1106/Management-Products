export type UserProfile = {
  email: string;
  matkhau: string;
  hoten: string;
  hinhanh: string;
};
export type DirectoryUser = UserProfile & { uid: string };
