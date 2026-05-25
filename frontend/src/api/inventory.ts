import api from './axios';
import type { Inventory, InventoryDTO } from '../types';

export const getInventory = (productId: number) =>
  api.get<Inventory>(`/api/inventory/${productId}`).then(r => r.data);

export const upsertInventory = (data: InventoryDTO) =>
  api.put<Inventory>('/api/inventory', data).then(r => r.data);
