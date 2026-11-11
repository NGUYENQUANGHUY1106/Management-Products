import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Product } from "../types/product";
import { removeProduct } from "../services/products";
import { filterProducts, parsePriceRange, PriceRange, ProductSort } from "../utils/productFilters";
import { ProductForm } from "./ProductForm";
import { AdminRoles } from "./AdminRoles";
import { ErrorBox } from "./ui";
import { Action, adminStyles as s, ModalFrame, palette as c, ProductImage } from "./admin-ui";
import { errorMessage } from "../utils/validation";
import { router } from "expo-router";
import { useFavorites } from "../contexts/FavoritesContext";
import { FavoriteButton } from "./FavoriteButton";

const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
const sortLabels: Record<ProductSort, string> = { default: "Mặc định", name: "Tên A–Z", "price-asc": "Giá tăng dần", "price-desc": "Giá giảm dần" };

export function ProductCatalog({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const { width } = useWindowDimensions(); const wide = width >= 1200; const desktop = width >= 900;
  const { user } = useAuth();
  const favorites = useFavorites();
  const [products, setProducts] = useState<Product[]>([]); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [search, setSearch] = useState(""); const [sort, setSort] = useState<ProductSort>("default"); const [sortOpen, setSortOpen] = useState(false);
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [range, setRange] = useState<PriceRange>({}); const [filterError, setFilterError] = useState("");
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null); const [busy, setBusy] = useState(false); const [deleteError, setDeleteError] = useState("");
  const [settings, setSettings] = useState(false);
  useEffect(() => onSnapshot(collection(db, "products"), snapshot => {
    setProducts(snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Product)); setLoading(false); setError("");
  }, e => { setError(errorMessage(e)); setLoading(false); }), []);
  const favoriteIds = new Set(favorites.ids);
  const displayProducts = favoritesOnly ? products.filter(product => favoriteIds.has(product.id)) : products;
  const shown = filterProducts(displayProducts, search, range, sort);
  const title = settings ? "Cài đặt hệ thống" : favoritesOnly ? "Sản phẩm yêu thích" : "Quản lý sản phẩm";
  const listLoading = loading || (favoritesOnly && !favorites.ready);
  const emptyTitle = favoritesOnly && !displayProducts.length ? "Chưa có sản phẩm yêu thích" : products.length ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm";
  const emptyDescription = favoritesOnly && !displayProducts.length ? "Bấm trái tim ở danh sách sản phẩm để lưu vào đây." : products.length ? "Thử tên khác hoặc thay đổi khoảng giá." : "Thêm sản phẩm đầu tiên vào kho của bạn.";
  const favoriteButton = (product: Product, showLabel = false) => <FavoriteButton name={product.name} selected={favoriteIds.has(product.id)} disabled={!favorites.ready || favorites.saving} showLabel={showLabel} onPress={() => { void favorites.toggle(product.id); }} />;
  const hasRange = range.min !== undefined || range.max !== undefined;
  function applyRange() {
    try { setRange(parsePriceRange(from, to)); setFilterError(""); }
    catch (e) { setFilterError(errorMessage(e)); }
  }
  function clearRange() { setFrom(""); setTo(""); setRange({}); setFilterError(""); }
  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true); setDeleteError("");
    try { await removeProduct(deleting.id); setDeleting(null); setNotice("Đã xóa sản phẩm."); }
    catch (e) { setDeleteError(errorMessage(e)); } finally { setBusy(false); }
  }
  function nav(title: string, icon: string, selected: boolean, onPress: () => void) {
    return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 5, backgroundColor: selected ? "#DFEAFF" : pressed ? c.background : "transparent" })}>
      <Text aria-hidden style={{ fontSize: 16, color: selected ? c.teal : c.ink }}>{icon}</Text><Text style={{ color: selected ? c.teal : c.ink, fontSize: 13, fontWeight: selected ? "600" : "400" }}>{title}</Text>
    </Pressable>;
  }
  return <View style={{ flex: 1, flexDirection: desktop ? "row" : "column", backgroundColor: c.background }}>
    <View style={{ width: desktop ? 224 : "100%", backgroundColor: "white", borderRightWidth: desktop ? 1 : 0, borderBottomWidth: desktop ? 0 : 1, borderColor: c.line, padding: desktop ? 16 : 12, gap: desktop ? 20 : 10 }}>
      <View style={[s.row, { padding: desktop ? 6 : 0, flexWrap: "nowrap" }]}><View style={{ width: 34, height: 34, backgroundColor: c.teal, borderRadius: 8, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "white", fontSize: 22 }}>▣</Text></View><View><Text style={{ color: c.ink, fontWeight: "700", fontSize: 17 }}>Kho Hàng</Text><Text style={{ color: c.muted, fontSize: 11 }}>Management Product</Text></View>
        {!desktop && <View style={{ marginLeft: "auto" }}><Action title="Đăng xuất" variant="ghost" small onPress={() => { void signOut(auth).catch(e => setError(errorMessage(e))); }} /></View>}
      </View>
      <View style={{ flexDirection: desktop ? "column" : "row", gap: 5, flexWrap: "wrap" }}>
        {nav("Danh sách sản phẩm", "▤", !settings && !favoritesOnly, () => { setSettings(false); setSortOpen(false); if (favoritesOnly) router.replace("/admin/products"); })}
        {nav("Sản phẩm yêu thích", "♡", !settings && favoritesOnly, () => { setSettings(false); setSortOpen(false); if (!favoritesOnly) router.replace("/admin/favorites"); })}
        {nav("Cài đặt hệ thống", "⚙", settings, () => { setSettings(true); setSortOpen(false); })}
      </View>
      {desktop && <View style={{ marginTop: "auto", borderTopWidth: 1, borderColor: c.line, paddingTop: 12 }}><Action title="Đăng xuất" icon="↪" variant="ghost" onPress={() => { void signOut(auth).catch(e => setError(errorMessage(e))); }} /></View>}
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      {desktop && <View style={{ height: 65, paddingHorizontal: 30, backgroundColor: "white", borderBottomWidth: 1, borderColor: c.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Text style={{ color: c.ink, fontSize: 16, fontWeight: "600" }}>{title}</Text><View style={s.row}><View style={{ width: 30, height: 30, backgroundColor: c.blue, borderRadius: 8, justifyContent: "center", alignItems: "center" }}><Text style={{ color: c.teal }}>♙</Text></View><Text style={s.text}>Admin</Text></View></View>}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: desktop ? 30 : 16, gap: 20, maxWidth: 1500, width: "100%", alignSelf: "center", paddingBottom: 36 }}>
        <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
          <View style={{ gap: 5 }}><Text style={{ color: c.ink, fontSize: desktop ? 27 : 23, fontWeight: "700", letterSpacing: -0.6 }}>{title}</Text><Text style={s.muted}>{settings ? "Quản lý quyền truy cập hệ thống kho." : favoritesOnly ? "Những sản phẩm bạn đã đánh dấu để xem lại." : "Quản lý thông tin và số lượng sản phẩm."}</Text></View>
          {!settings && !favoritesOnly && <Action title="Thêm sản phẩm" icon="＋" onPress={() => { setEditor("new"); setNotice(""); }} />}
        </View>
        <ErrorBox message={error} />
        {!settings && !!favorites.error && <View style={{ gap: 8 }}><ErrorBox message={favorites.error} /><Action title="Thử tải lại yêu thích" variant="outline" disabled={favorites.saving} onPress={favorites.retry} /></View>}
        {!settings && favoritesOnly && <Text style={[s.muted, { fontSize: 12 }]}>Yêu thích được lưu riêng cho tài khoản trên thiết bị này.</Text>}
        {!!notice && <Text accessibilityRole="alert" style={{ color: c.teal, backgroundColor: "#EAF7F2", padding: 12, borderRadius: 5 }}>{notice}</Text>}
        {settings ? <View style={{ gap: 20 }}><View style={[s.border, { padding: 22, gap: 8 }]}><Text style={s.label}>Tài khoản đang đăng nhập</Text><Text style={s.muted}>{user?.email}</Text><Text style={{ color: c.teal, fontSize: 12 }}>Quản trị viên</Text></View><AdminRoles /></View> : <>
          <View style={[s.border, { padding: 14, gap: 14, zIndex: 2 }]}>
            <View style={[s.row, { justifyContent: "space-between", alignItems: "center" }]}>
              <View style={[s.row, s.border, { backgroundColor: c.background, paddingHorizontal: 12, flex: 1, minWidth: desktop ? 230 : 180, flexWrap: "nowrap" }]}><Text style={{ color: c.muted, fontSize: 20 }} aria-hidden>⌕</Text><TextInput accessibilityLabel="Tìm kiếm tên sản phẩm" placeholder="Tìm kiếm sản phẩm..." placeholderTextColor="#8994A5" value={search} onChangeText={setSearch} style={{ flex: 1, minWidth: 0, height: 38, color: c.ink, fontSize: 13 }} /></View>
              <View style={[s.row, { flexWrap: "nowrap", zIndex: 5 }]}><Text style={[s.muted, { fontSize: 12 }]}>⇅ Sắp xếp:</Text><View style={{ position: "relative" }}>
                <Action title={sortLabels[sort] + "  ⌄"} label={`Sắp xếp: ${sortLabels[sort]}`} variant="outline" small onPress={() => setSortOpen(!sortOpen)} />
                {sortOpen && <View style={[s.border, { position: "absolute", top: 39, right: 0, width: 170, padding: 4, boxShadow: "0px 5px 20px rgba(15,23,42,0.12)" }]}>{(Object.keys(sortLabels) as ProductSort[]).map(key => <Action key={key} title={sortLabels[key]} variant={sort === key ? "primary" : "ghost"} small onPress={() => { setSort(key); setSortOpen(false); }} />)}</View>}
              </View></View>
              <Text testID="product-count" style={{ backgroundColor: c.blue, color: "#145A73", borderRadius: 5, paddingVertical: 9, paddingHorizontal: 12, fontSize: 12 }}>{hasRange || search ? `Hiển thị: ${shown.length} / ${displayProducts.length}` : `Tổng cộng: ${displayProducts.length} sản phẩm`}</Text>
            </View>
            <View style={s.divider} />
            <View style={[s.row, { alignItems: "center", gap: 10 }]}>
              <Text style={[s.label, !desktop && { width: "100%" }]}>Khoảng giá (VNĐ)</Text>
              <View style={{ flex: wide ? undefined : 1, minWidth: 110 }}><TextInput accessibilityLabel="Giá từ" placeholder="Giá từ" placeholderTextColor="#8994A5" value={from} onChangeText={setFrom} keyboardType="decimal-pad" onSubmitEditing={applyRange} style={[s.border, { height: 38, width: wide ? 145 : "100%", paddingHorizontal: 12, fontSize: 13, color: c.ink }]} /></View>
              <Text style={s.muted}>—</Text>
              <View style={{ flex: wide ? undefined : 1, minWidth: 110 }}><TextInput accessibilityLabel="Giá đến" placeholder="Giá đến" placeholderTextColor="#8994A5" value={to} onChangeText={setTo} keyboardType="decimal-pad" onSubmitEditing={applyRange} style={[s.border, { height: 38, width: wide ? 145 : "100%", paddingHorizontal: 12, fontSize: 13, color: c.ink }]} /></View>
              <Action title="Áp dụng" label="Áp dụng lọc giá" small onPress={applyRange} />
              <Action title="Xóa bộ lọc" variant="ghost" small onPress={clearRange} />
            </View>
            <ErrorBox message={filterError} />
            {hasRange && <Text testID="active-price-range" style={{ color: c.teal, fontSize: 12 }}>Đang lọc: {range.min === undefined ? "0 đ" : money(range.min)} – {range.max === undefined ? "Không giới hạn" : money(range.max)} (bao gồm hai đầu khoảng)</Text>}
          </View>
          <View style={[s.border, { zIndex: 1 }]}>
            {desktop && <View style={{ flexDirection: "row", paddingHorizontal: 18, paddingVertical: 14, backgroundColor: c.background, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomWidth: 1, borderColor: c.line }}>
              <Text style={[s.label, { flex: 1 }]}>Sản phẩm</Text><Text style={[s.label, { width: wide ? 160 : 110, textAlign: "right" }]}>Giá bán</Text><Text style={[s.label, { width: wide ? 165 : 120, textAlign: "center" }]}>Số lượng tồn kho</Text><Text style={[s.label, { width: wide ? 208 : 175, textAlign: "right" }]}>Thao tác</Text>
            </View>}
            {listLoading ? <View style={{ padding: 45 }}><ActivityIndicator color={c.teal} /><Text style={[s.muted, { textAlign: "center", marginTop: 14 }]}>Đang tải sản phẩm...</Text></View> : shown.length === 0 ? <View style={{ padding: 38, gap: 10, alignItems: "center" }}><Text style={{ fontSize: 28, color: "#A3AEC0" }}>{favoritesOnly ? "♡" : "▧"}</Text><Text style={s.label}>{emptyTitle}</Text><Text style={s.muted}>{emptyDescription}</Text></View> : shown.map((product, index) => <View key={product.id} testID="product-row" style={{ flexDirection: desktop ? "row" : "column", alignItems: desktop ? "center" : "stretch", gap: desktop ? 0 : 12, paddingHorizontal: 18, paddingVertical: desktop ? 15 : 18, borderTopWidth: index ? 1 : 0, borderColor: c.line, backgroundColor: "white", borderRadius: 7 }}>
              <View style={[s.row, { flex: desktop ? 1 : undefined, flexWrap: "nowrap", minWidth: 0, paddingRight: desktop ? 15 : 0 }]}><ProductImage uri={product.image} name={product.name} size={desktop ? 48 : 58} /><View style={{ flex: 1, gap: 5 }}><Text style={{ color: c.ink, fontSize: 14, fontWeight: "600", lineHeight: 21 }}>{product.name}</Text>{!desktop && <Text style={s.muted}>{money(product.price)} · Số lượng: {product.soluong}</Text>}</View>{!favoritesOnly && favoriteButton(product)}</View>
              {desktop && <><Text style={{ color: c.ink, fontWeight: "600", fontSize: 13, width: wide ? 160 : 110, textAlign: "right" }}>{money(product.price)}</Text><View style={{ width: wide ? 165 : 120, alignItems: "center" }}><Text accessibilityLabel={`Số lượng: ${product.soluong}`} style={{ backgroundColor: c.blue, color: c.ink, fontSize: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 }}>{product.soluong}</Text></View></>}
              <View style={[s.row, { width: desktop ? wide ? 208 : 175 : undefined, justifyContent: "flex-end", gap: 8 }]}>{favoritesOnly ? favoriteButton(product, true) : <><Action title="Chỉnh sửa" label={`Sửa ${product.name}`} icon="✎" variant="outline" small onPress={() => { setEditor(product); setNotice(""); }} /><Action title="Xóa" label={`Xóa ${product.name}`} icon="⌫" variant="delete" small onPress={() => { setDeleting(product); setDeleteError(""); setNotice(""); }} /></>}</View>
            </View>)}
          </View>
          <View style={[s.row, { justifyContent: "space-between" }]}><Text style={[s.muted, { fontSize: 12 }]}>Hiển thị {shown.length} trên tổng số {displayProducts.length} sản phẩm</Text><Text style={[s.muted, { fontSize: 12 }]}>Tồn kho: {displayProducts.reduce((total, p) => total + p.soluong, 0)} · Giá trị kho: {money(displayProducts.reduce((total, p) => total + p.price * p.soluong, 0))}</Text></View>
        </>}
      </ScrollView>
    </View>
    {editor !== null && <ProductForm key={editor === "new" ? "new" : editor.id} product={editor === "new" ? undefined : editor} onDone={saved => { setEditor(null); if (saved) setNotice("Đã lưu sản phẩm."); }} />}
    {deleting && <ModalFrame title="Xóa sản phẩm" width={440} onClose={() => { if (!busy) setDeleting(null); }}>
      <View style={{ padding: 24, gap: 18 }}>
        <View style={{ alignItems: "center", gap: 10 }}><View style={{ width: 46, height: 46, backgroundColor: "#FFF0EE", borderColor: "#FECACA", borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" }}><Text style={{ color: c.red, fontSize: 26 }}>⚠</Text></View><Text style={{ color: c.ink, fontSize: 20, fontWeight: "700" }}>Xóa sản phẩm</Text><Text style={s.muted}>Bạn có chắc chắn muốn xóa sản phẩm này không?</Text></View>
        <View style={[s.row, s.border, { padding: 12, backgroundColor: "#F0F4FF", flexWrap: "nowrap" }]}><ProductImage uri={deleting.image} name={deleting.name} size={52} /><View style={{ flex: 1, gap: 5 }}><Text style={s.label}>{deleting.name}</Text><Text style={[s.muted, { fontSize: 12 }]}>Giá: {money(deleting.price)} · Số lượng: {deleting.soluong}</Text></View></View>
        <Text style={{ padding: 10, fontSize: 12, lineHeight: 18, color: c.red, backgroundColor: "#FFF6F6", borderWidth: 1, borderColor: "#FEE2E2", borderRadius: 5 }}>ⓘ Hành động này không thể hoàn tác sau khi thực hiện.</Text>
        <ErrorBox message={deleteError} />
        <View style={[s.row, { flexWrap: "nowrap" }]}><View style={{ flex: 1 }}><Action title="Hủy" label="Hủy xóa" variant="outline" disabled={busy} onPress={() => setDeleting(null)} /></View><View style={{ flex: 1 }}><Action title="Xác nhận xóa" icon="⌫" variant="danger" busy={busy} onPress={() => { void confirmDelete(); }} /></View></View>
      </View>
    </ModalFrame>}
  </View>;
}
