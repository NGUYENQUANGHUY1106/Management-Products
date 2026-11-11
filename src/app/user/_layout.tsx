import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Loading } from "../../components/ui";
export default function UserLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
