import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Shell } from "../../components/Shell";
import { Button, ErrorBox, Loading, styles } from "../../components/ui";
import { useUsers } from "../../hooks/useUsers";
export default function Dashboard() {
  const { users, error, loading, refresh } = useUsers();
  return (
    <Shell
      title="Một góc nhìn tổng quan"
      subtitle="Chăm sóc cộng đồng của bạn từ một không gian thống nhất."
    >
      <ErrorBox message={error} />
      {!!error && (
        <Button
          title="Thử lại"
          onPress={() => {
            void refresh();
          }}
        />
      )}
      {loading ? (
        <Loading />
      ) : (
        <>
          <View style={styles.row}>
            <View style={[styles.card, { flex: 1, minWidth: 220 }]}>
              <Text style={styles.subtitle}>TỔNG SỐ NGƯỜI DÙNG</Text>
              <Text style={[styles.title, { fontSize: 52 }]}>
                {users.length.toString().padStart(2, "0")}
              </Text>
              <Text style={styles.subtitle}>Hồ sơ trong danh bạ</Text>
            </View>
            <View style={[styles.card, { flex: 1, minWidth: 220 }]}>
              <Text style={styles.subtitle}>ĐÃ CÓ ẢNH ĐẠI DIỆN</Text>
              <Text style={[styles.title, { fontSize: 52 }]}>
                {users
                  .filter((u) => u.hinhanh)
                  .length.toString()
                  .padStart(2, "0")}
              </Text>
              <Text style={styles.subtitle}>Hồ sơ được cá nhân hóa</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={[styles.title, { fontSize: 24 }]}>
              Kết nối bắt đầu từ một hồ sơ.
            </Text>
            <Text style={styles.subtitle}>
              Xem danh bạ, thêm thành viên và cập nhật thông tin tài khoản.
            </Text>
            <View style={styles.row}>
              <Button
                title="Mở danh sách người dùng"
                onPress={() => router.push("/admin/users")}
              />
              <Button
                secondary
                title="Thêm người dùng"
                onPress={() => router.push("/admin/users/create")}
              />
            </View>
          </View>
        </>
      )}
    </Shell>
  );
}
