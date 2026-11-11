import React, { useMemo, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { useUsers } from "../../../hooks/useUsers";
import { Shell } from "../../../components/Shell";
import {
  Avatar,
  Button,
  ErrorBox,
  Field,
  Loading,
  styles,
} from "../../../components/ui";
export default function Directory() {
  const { users, error, loading, refresh } = useUsers();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [descending, setDescending] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const filtered = useMemo(
    () =>
      users
        .filter((u) =>
          `${u.hoten} ${u.email}`
            .toLocaleLowerCase("vi")
            .includes(search.trim().toLocaleLowerCase("vi")),
        )
        .sort(
          (a, b) =>
            (a.hoten.localeCompare(b.hoten, "vi") ||
              a.uid.localeCompare(b.uid)) * (descending ? -1 : 1),
        ),
    [users, search, descending],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);
  return (
    <Shell
      title="Danh sách người dùng"
      subtitle="Mỗi thành viên là một phần của cộng đồng."
    >
      <View style={styles.row}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Field
            label="Tìm kiếm họ tên hoặc email"
            value={search}
            onChangeText={(s) => {
              setSearch(s);
              setPage(1);
            }}
            placeholder="Nhập tên hoặc email…"
          />
        </View>
        <Button
          title="Thêm người dùng"
          onPress={() => router.push("/admin/users/create")}
        />
      </View>
      <View style={styles.row}>
        <Button
          secondary
          title={descending ? "Sắp xếp: Z–A" : "Sắp xếp: A–Z"}
          onPress={() => {
            setDescending(!descending);
            setPage(1);
          }}
        />
        <Button
          secondary
          title={`${size} bản ghi/trang`}
          onPress={() => {
            setSize(size === 5 ? 10 : 5);
            setPage(1);
          }}
        />
        <Button
          secondary
          title="Tải lại"
          onPress={() => {
            void refresh();
          }}
        />
        <Text style={styles.subtitle}>
          {filtered.length} kết quả / {users.length} người dùng
        </Text>
      </View>
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : (
        <View style={[styles.card, { padding: width < 768 ? 16 : 24 }]}>
          {rows.length ? (
            rows.map((u) => (
              <View
                key={u.uid}
                testID="user-row"
                style={{
                  flexDirection: width < 768 ? "column" : "row",
                  gap: 16,
                  paddingVertical: 17,
                  borderBottomWidth: 1,
                  borderColor: "#EDF3F0",
                  alignItems: width < 768 ? "stretch" : "center",
                }}
              >
                <View style={[styles.row, { flex: 1 }]}>
                  <Avatar name={u.hoten} uri={u.hinhanh} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.label}>{u.hoten}</Text>
                    <Text style={styles.subtitle}>{u.email}</Text>
                  </View>
                </View>
                <Button
                  secondary
                  title={`Xem ${u.hoten}`}
                  onPress={() => router.push(`/admin/users/${u.uid}`)}
                />
              </View>
            ))
          ) : (
            <View style={{ padding: 30, gap: 12 }}>
              <Text style={[styles.title, { fontSize: 22 }]}>
                {search ? "Không có kết quả phù hợp" : "Danh bạ đang trống"}
              </Text>
              <Text style={styles.subtitle}>
                {search
                  ? "Thử tên hoặc email khác."
                  : "Thêm người dùng đầu tiên để bắt đầu."}
              </Text>
            </View>
          )}
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <Text style={styles.subtitle}>
              Trang {current} / {pages}
            </Text>
            <View style={styles.row}>
              <Button
                secondary
                title="Trang trước"
                disabled={current <= 1}
                onPress={() => setPage(current - 1)}
              />
              <Button
                secondary
                title="Trang sau"
                disabled={current >= pages}
                onPress={() => setPage(current + 1)}
              />
            </View>
          </View>
        </View>
      )}
    </Shell>
  );
}
