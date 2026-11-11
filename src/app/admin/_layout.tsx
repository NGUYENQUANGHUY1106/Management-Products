import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Loading } from "../../components/ui";
export default function AdminLayout() {
  const { user, admin, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  if (!admin) return <Redirect href="/user/profile" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
