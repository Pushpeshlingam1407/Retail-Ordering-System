import api from "./axios";
import type {
  Brand,
  Category,
  Product,
  ProductRequest,
  UploadResponse,
} from "../types";

export const getProducts = () =>
  api.get<Product[]>("/api/products").then((r) => r.data);

export const createProduct = (data: ProductRequest) =>
  api.post<Product>("/api/products", data).then((r) => r.data);

export const updateProduct = (id: number, data: ProductRequest) =>
  api.put<Product>(`/api/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: number) => api.delete(`/api/products/${id}`);

/** Upload a product image and get back the public URL */
export const uploadProductImage = (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  return api
    .post<UploadResponse>("/api/upload/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.url);
};

export const getBrands = () =>
  api.get<Brand[]>("/api/brands").then((r) => r.data);

export const getCategories = () =>
  api.get<Category[]>("/api/categories").then((r) => r.data);
