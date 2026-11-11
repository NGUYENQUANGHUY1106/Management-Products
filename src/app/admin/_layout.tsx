import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Loading } from "../../components/ui";
export default function AdminLayout() {
  const { admin, loading } = useAuth();
  if (loading) return <Loading />;
  if (!admin) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
