import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import InventoryIcon from "@mui/icons-material/Inventory";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getBrands,
  getCategories,
} from "../api/products";
import { getInventory, upsertInventory } from "../api/inventory";
import type {
  Brand,
  Category,
  Product,
  ProductRequest,
  InventoryDTO,
  Inventory,
} from "../types";
import ConfirmDialog from "../components/ConfirmDialog";
import notify from "../utils/notify";
import { SearchBar } from "../components/SearchBar";
import { TableSkeleton } from "../components/SkeletonLoaders";

const PACKAGING_OPTIONS = [
  "Box",
  "Bag",
  "Bottle",
  "Can",
  "Pack",
  "Pouch",
  "Jar",
  "Sachet",
];

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23f0ede6' rx='8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='20' fill='%23c0b89a'%3E📦%3C/text%3E%3C/svg%3E";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventories, setInventories] = useState<Record<number, Inventory>>({});
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductRequest>({
    name: "",
    price: 0,
    categoryId: 0,
    brandId: 0,
    packaging: "Box",
    imageUrl: "",
  });
  const [invForm, setInvForm] = useState<InventoryDTO>({
    productId: 0,
    quantity: 0,
    lowStockThreshold: 10,
  });
  const [saving, setSaving] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, bData, cData] = await Promise.all([
        getProducts(),
        getBrands(),
        getCategories(),
      ]);
      setProducts(data);
      setBrands(bData);
      setCategories(cData);
      // Set sensible defaults once we know the real IDs
      setForm((f) => ({
        ...f,
        brandId: f.brandId === 0 ? bData[0]?.id ?? 0 : f.brandId,
        categoryId: f.categoryId === 0 ? cData[0]?.id ?? 0 : f.categoryId,
      }));

      const invMap: Record<number, Inventory> = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const inv = await getInventory(p.id);
            invMap[p.id] = inv;
          } catch {
            /* no inventory yet */
          }
        }),
      );
      setInventories(invMap);
    } catch {
      notify.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview("");
    setUploading(false);
    setDragOver(false);
  };

  // Fetch brands & categories fresh every time dialog opens
  const loadDropdowns = async () => {
    setDialogLoading(true);
    try {
      const [bData, cData] = await Promise.all([getBrands(), getCategories()]);
      setBrands(bData);
      setCategories(cData);
      return { bData, cData };
    } catch {
      notify.error("Failed to load brands/categories");
      return { bData: brands, cData: categories };
    } finally {
      setDialogLoading(false);
    }
  };

  const openCreate = async () => {
    setEditProduct(null);
    resetImageState();
    setInvForm({ productId: 0, quantity: 0, lowStockThreshold: 10 });
    setDialogOpen(true);
    const { bData, cData } = await loadDropdowns();
    setForm({
      name: "",
      price: 0,
      categoryId: cData[0]?.id ?? 0,
      brandId: bData[0]?.id ?? 0,
      packaging: "Box",
      imageUrl: "",
    });
  };

  const openEdit = async (p: Product) => {
    setEditProduct(p);
    resetImageState();
    if (p.imageUrl) setImagePreview(p.imageUrl);
    const inv = inventories[p.id];
    setInvForm({
      productId: p.id,
      quantity: inv?.quantity ?? 0,
      lowStockThreshold: inv?.lowStockThreshold ?? 10,
    });
    setDialogOpen(true);
    const { bData, cData } = await loadDropdowns();
    setForm({
      name: p.name,
      price: p.price,
      categoryId: p.category?.id ?? cData[0]?.id ?? 0,
      brandId: p.brand?.id ?? bData[0]?.id ?? 0,
      packaging: p.packaging ?? "Box",
      imageUrl: p.imageUrl ?? "",
    });
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      notify.warning("Please select a valid image file");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price <= 0) {
      notify.warning("Enter valid name and price");
      return;
    }
    if (!form.brandId || form.brandId === 0) {
      notify.warning("Please select a brand");
      return;
    }
    if (!form.categoryId || form.categoryId === 0) {
      notify.warning("Please select a category");
      return;
    }
    try {
      setSaving(true);

      // Upload new image first if a new file was selected
      let finalImageUrl = form.imageUrl ?? "";
      if (imageFile) {
        setUploading(true);
        try {
          finalImageUrl = await uploadProductImage(imageFile);
        } catch {
          notify.error("Image upload failed — product not saved");
          setSaving(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const payload: ProductRequest = { ...form, imageUrl: finalImageUrl };

      let pId = editProduct?.id;
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, payload);
        setProducts((ps) =>
          ps.map((x) => (x.id === updated.id ? updated : x)),
        );
      } else {
        const created = await createProduct(payload);
        setProducts((ps) => [...ps, created]);
        pId = created.id;
      }
      if (pId) {
        const updatedInv = await upsertInventory({
          ...invForm,
          productId: pId,
        });
        setInventories((prev) => ({ ...prev, [pId!]: updatedInv }));
      }
      notify.success(editProduct ? "Product updated" : "Product created");
      setDialogOpen(false);
    } catch {
      notify.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      setProducts((ps) => ps.filter((p) => p.id !== deleteId));
      notify.success("Product deleted");
    } catch {
      notify.error("Failed to delete product");
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#1d1d1f", letterSpacing: "-0.02em" }}
          >
            Products &amp; Inventory
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
            {products.length} product{products.length !== 1 ? "s" : ""} in
            catalogue
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: "space-between" }}
        >
          <SearchBar
            placeholder="Search products..."
            value={search}
            onSearchChange={setSearch}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ fontWeight: 600, borderRadius: "999px", px: 2.5, whiteSpace: "nowrap" }}
          >
            New Product
          </Button>
        </Stack>
      </Box>

      {/* ── Table ── */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "16px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            border: "1px solid #e8e5de",
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  background: "linear-gradient(135deg,#f8f6f1 0%,#f0ede6 100%)",
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#8a8a8a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Image
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#8a8a8a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Product
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#8a8a8a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Brand / Category
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#8a8a8a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Price
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#8a8a8a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Stock
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#8a8a8a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: "#8a8a8a",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    <InventoryIcon
                      sx={{ fontSize: 40, color: "#d0ccc4", mb: 1 }}
                    />
                    <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                      No products found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const inv = inventories[p.id];
                  const isLowStock =
                    inv && inv.quantity <= inv.lowStockThreshold;
                  const isOutOfStock = inv && inv.quantity === 0;
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{
                        "&:hover": { background: "rgba(0,0,0,0.015)" },
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Image */}
                      <TableCell sx={{ py: 1.5 }}>
                        <Avatar
                          src={p.imageUrl || PLACEHOLDER}
                          variant="rounded"
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "10px",
                            border: "1px solid #ede9e0",
                            background: "#f5f3ee",
                          }}
                        >
                          <ImageIcon sx={{ color: "#c0b89a" }} />
                        </Avatar>
                      </TableCell>

                      {/* Name */}
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#1d1d1f",
                          }}
                        >
                          {p.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "text.secondary",
                            mt: 0.2,
                          }}
                        >
                          #{p.id} · {p.packaging}
                        </Typography>
                      </TableCell>

                      {/* Brand / Category */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          {p.brand && (
                            <Chip
                              label={p.brand.name}
                              size="small"
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                height: 20,
                                background: "#ede9e0",
                                color: "#5a5650",
                                borderRadius: "6px",
                                maxWidth: 140,
                              }}
                            />
                          )}
                          {p.category && (
                            <Chip
                              label={p.category.name}
                              size="small"
                              sx={{
                                fontSize: 11,
                                fontWeight: 500,
                                height: 20,
                                background: "#e8f0fe",
                                color: "#3461d1",
                                borderRadius: "6px",
                                maxWidth: 140,
                              }}
                            />
                          )}
                        </Stack>
                      </TableCell>

                      {/* Price */}
                      <TableCell align="right">
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: "#1d1d1f",
                          }}
                        >
                          ₹{p.price.toFixed(2)}
                        </Typography>
                      </TableCell>

                      {/* Stock */}
                      <TableCell align="right">
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: isOutOfStock
                              ? "#d32f2f"
                              : isLowStock
                                ? "#e65100"
                                : "#1d1d1f",
                          }}
                        >
                          {inv?.quantity ?? "—"}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        {isOutOfStock ? (
                          <Chip
                            label="Out of Stock"
                            size="small"
                            sx={{
                              background: "#fdecea",
                              color: "#d32f2f",
                              fontWeight: 600,
                              fontSize: 11,
                              borderRadius: "8px",
                            }}
                          />
                        ) : isLowStock ? (
                          <Chip
                            icon={
                              <WarningAmberIcon
                                sx={{ fontSize: "14px !important" }}
                              />
                            }
                            label="Low Stock"
                            size="small"
                            sx={{
                              background: "#fff3e0",
                              color: "#e65100",
                              fontWeight: 600,
                              fontSize: 11,
                              borderRadius: "8px",
                            }}
                          />
                        ) : (
                          <Chip
                            icon={
                              <CheckCircleIcon
                                sx={{ fontSize: "14px !important" }}
                              />
                            }
                            label="In Stock"
                            size="small"
                            sx={{
                              background: "#e8f5e9",
                              color: "#2e7d32",
                              fontWeight: 600,
                              fontSize: 11,
                              borderRadius: "8px",
                            }}
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Tooltip title="Edit product">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(p)}
                            sx={{
                              mr: 0.5,
                              background: "#f5f3ee",
                              "&:hover": {
                                background: "#1d1d1f",
                                color: "#fff",
                              },
                              transition: "all 0.2s",
                              borderRadius: "8px",
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete product">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteId(p.id)}
                            sx={{
                              background: "#fdecea",
                              color: "#d32f2f",
                              "&:hover": {
                                background: "#d32f2f",
                                color: "#fff",
                              },
                              transition: "all 0.2s",
                              borderRadius: "8px",
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 700,
                color: "#1d1d1f",
                letterSpacing: "-0.02em",
              }}
            >
              {editProduct ? "Edit Product" : "New Product"}
            </Typography>
            <IconButton
              size="small"
              onClick={() => !saving && setDialogOpen(false)}
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
            {editProduct
              ? `Editing: ${editProduct.name}`
              : "Add a new product to your catalogue"}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 2, pt: 2.5 }}>
          <Stack spacing={2.5}>
            {/* ── Image Upload Zone ── */}
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "text.secondary",
                  mb: 1,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Product Image
              </Typography>

              {imagePreview ? (
                // Preview with replace button
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "2px solid #e8e5de",
                    background: "#f8f6f1",
                    height: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      p: 1,
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      opacity: 0,
                      transition: "all 0.2s",
                      "&:hover": {
                        background: "rgba(0,0,0,0.55)",
                        opacity: 1,
                      },
                    }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        borderRadius: "999px",
                        background: "#fff",
                        color: "#1d1d1f",
                        fontWeight: 600,
                        "&:hover": { background: "#f5f5f5" },
                      }}
                    >
                      Replace Image
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setImagePreview("");
                        setImageFile(null);
                        setForm((f) => ({ ...f, imageUrl: "" }));
                      }}
                      sx={{
                        background: "rgba(255,255,255,0.9)",
                        color: "#d32f2f",
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                // Drag & drop zone
                <Box
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: `2px dashed ${dragOver ? "#1d1d1f" : "#d0ccc4"}`,
                    borderRadius: "14px",
                    background: dragOver ? "rgba(0,0,0,0.03)" : "#faf9f6",
                    height: 150,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      border: "2px dashed #1d1d1f",
                      background: "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      background: "#ede9e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CloudUploadIcon sx={{ color: "#8a7f6d", fontSize: 22 }} />
                  </Box>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: "#1d1d1f" }}
                  >
                    Drop image here or click to browse
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                    PNG, JPG, WEBP up to 10MB
                  </Typography>
                </Box>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = "";
                }}
              />
            </Box>

            {/* ── Product Name ── */}
            <TextField
              label="Product Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
              autoFocus
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />

            {/* ── Price ── */}
            <TextField
              label="Price (₹)"
              type="number"
              value={form.price || ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  price: parseFloat(e.target.value) || 0,
                }))
              }
              fullWidth
              slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />

            {/* ── Brand + Category ── */}
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <FormControl fullWidth disabled={dialogLoading}>
                <InputLabel>Brand</InputLabel>
                <Select
                  value={dialogLoading ? "" : form.brandId || ""}
                  label="Brand"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brandId: Number(e.target.value) }))
                  }
                  sx={{ borderRadius: "12px" }}
                  displayEmpty
                >
                  {dialogLoading ? (
                    <MenuItem value="" disabled>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={14} />
                        <span>Loading…</span>
                      </Box>
                    </MenuItem>
                  ) : brands.length === 0 ? (
                    <MenuItem value="" disabled>
                      No brands found
                    </MenuItem>
                  ) : (
                    brands.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={dialogLoading}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={dialogLoading ? "" : form.categoryId || ""}
                  label="Category"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      categoryId: Number(e.target.value),
                    }))
                  }
                  sx={{ borderRadius: "12px" }}
                  displayEmpty
                >
                  {dialogLoading ? (
                    <MenuItem value="" disabled>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CircularProgress size={14} />
                        <span>Loading…</span>
                      </Box>
                    </MenuItem>
                  ) : categories.length === 0 ? (
                    <MenuItem value="" disabled>
                      No categories found
                    </MenuItem>
                  ) : (
                    categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>

            {/* ── Packaging ── */}
            <FormControl fullWidth>
              <InputLabel>Packaging</InputLabel>
              <Select
                value={form.packaging}
                label="Packaging"
                onChange={(e) =>
                  setForm((f) => ({ ...f, packaging: e.target.value }))
                }
                sx={{ borderRadius: "12px" }}
              >
                {PACKAGING_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ── Inventory ── */}
            <Box>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "text.secondary",
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Inventory
              </Typography>
              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <TextField
                  label="Current Stock"
                  type="number"
                  value={invForm.quantity}
                  onChange={(e) =>
                    setInvForm((f) => ({
                      ...f,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                  fullWidth
                  slotProps={{ input: { inputProps: { min: 0 } } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
                <TextField
                  label="Low Stock Alert"
                  type="number"
                  value={invForm.lowStockThreshold}
                  onChange={(e) =>
                    setInvForm((f) => ({
                      ...f,
                      lowStockThreshold: parseInt(e.target.value) || 0,
                    }))
                  }
                  fullWidth
                  slotProps={{ input: { inputProps: { min: 0 } } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => !saving && setDialogOpen(false)}
            variant="outlined"
            sx={{
              color: "text.secondary",
              borderColor: "#d0ccc4",
              borderRadius: "999px",
              px: 2.5,
              "&:hover": { borderColor: "#1d1d1f", color: "#1d1d1f" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || uploading}
            startIcon={
              uploading ? (
                <CircularProgress size={14} color="inherit" />
              ) : undefined
            }
            sx={{
              fontWeight: 600,
              borderRadius: "999px",
              px: 3,
              background: "#1d1d1f",
              "&:hover": { background: "#3a3a3a" },
              "&:disabled": { background: "#a0a0a0" },
            }}
          >
            {uploading
              ? "Uploading…"
              : saving
                ? "Saving…"
                : editProduct
                  ? "Save Changes"
                  : "Create Product"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
