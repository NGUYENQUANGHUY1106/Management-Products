import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/ui";
export default function Home() {
  const { user, admin, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <Redirect
      href={!user ? "/login" : admin ? "/admin/dashboard" : "/user/profile"}
    />
  );
}
