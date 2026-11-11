import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { Loading } from "../../components/ui";
import { FavoritesProvider } from "../../contexts/FavoritesContext";
export default function AdminLayout() {
  const { admin, loading } = useAuth();
  if (loading) return <Loading />;
  if (!admin) return <Redirect href="/login" />;
  return <FavoritesProvider><Stack screenOptions={{ headerShown: false }} /></FavoritesProvider>;
}
