import { useCallback, useEffect, useState } from "react";
import { DirectoryUser } from "../types/user";
import { api } from "../services/api";
import { errorMessage } from "../utils/validation";
export function useUsers() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await api<DirectoryUser[]>("/admin/users"));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    api<DirectoryUser[]>("/admin/users")
      .then((rows) => {
        if (alive) setUsers(rows);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  return { users, loading, error, refresh };
}
