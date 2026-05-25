package com.ordering.retail.Controllers;

import com.ordering.retail.DTOs.InventoryDTO;
import com.ordering.retail.Entity.Inventory;
import com.ordering.retail.Entity.Product;
import com.ordering.retail.Repository.ProductRepository;
import com.ordering.retail.Service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
	private final InventoryService inventoryService;
	private final ProductRepository productRepository;

	public InventoryController(InventoryService inventoryService, ProductRepository productRepository) {
		this.inventoryService = inventoryService;
		this.productRepository = productRepository;
	}

	@GetMapping("/{productId}")
	public ResponseEntity<Inventory> getByProduct(@PathVariable Long productId) {
		Inventory inv = inventoryService.findByProductId(productId).orElseThrow(() -> new RuntimeException("Inventory not found"));
		return ResponseEntity.ok(inv);
	}

	@PutMapping
	public ResponseEntity<Inventory> createOrUpdate(@Valid @RequestBody InventoryDTO dto) {
		Product product = productRepository.findById(dto.getProductId()).orElseThrow(() -> new RuntimeException("Product not found"));
		Inventory inv = inventoryService.findByProductId(dto.getProductId()).orElse(new Inventory());
		inv.setProduct(product);
		inv.setQuantity(dto.getQuantity());
		inv.setLowStockThreshold(dto.getLowStockThreshold() == null ? 0 : dto.getLowStockThreshold());
		Inventory saved = inventoryService.save(inv);
		return ResponseEntity.ok(saved);
	}
}
