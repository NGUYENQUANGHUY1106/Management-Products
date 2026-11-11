import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { Loading } from "../components/ui";
export default function Index() {
  const { admin, loading } = useAuth();
  return loading ? <Loading /> : <Redirect href={admin ? "/admin/products" : "/login"} />;
}
