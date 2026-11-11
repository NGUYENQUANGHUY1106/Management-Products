import { useLocalSearchParams } from "expo-router";
import { AdminUserForm } from "../../../../components/AdminUserForm";
export default function Edit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AdminUserForm uid={id} />;
}
