package com.ordering.retail.Service;

import com.ordering.retail.Entity.Inventory;
import com.ordering.retail.Exception.OutOfStockException;
import com.ordering.retail.Repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class InventoryService {
	private final InventoryRepository inventoryRepository;

	public InventoryService(InventoryRepository inventoryRepository) {
		this.inventoryRepository = inventoryRepository;
	}

	public Optional<Inventory> findByProductId(Long productId) {
		return inventoryRepository.findByProductId(productId);
	}

	public Inventory save(Inventory inventory) {
		return inventoryRepository.save(inventory);
	}

	@Transactional
	public void decreaseStock(Long productId, int amount) {
		Inventory inv = inventoryRepository.findByProductId(productId)
				.orElseThrow(() -> new OutOfStockException("Inventory not found for product: " + productId));
		if (inv.getQuantity() < amount) {
			throw new OutOfStockException("Insufficient stock for product: " + productId);
		}
		inv.setQuantity(inv.getQuantity() - amount);
		inventoryRepository.save(inv);
	}

	@Transactional
	public void increaseStock(Long productId, int amount) {
		Inventory inv = inventoryRepository.findByProductId(productId)
				.orElseThrow(() -> new RuntimeException("Inventory not found for product: " + productId));
		inv.setQuantity(inv.getQuantity() + amount);
		inventoryRepository.save(inv);
	}
}
