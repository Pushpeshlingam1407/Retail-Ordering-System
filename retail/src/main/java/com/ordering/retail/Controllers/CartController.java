package com.ordering.retail.Controllers;

import com.ordering.retail.DTOs.CartDTO;
import com.ordering.retail.Entity.Cart;
import com.ordering.retail.Service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/carts")
public class CartController {
	private final CartService cartService;

	public CartController(CartService cartService) {
		this.cartService = cartService;
	}

	@PostMapping
	public ResponseEntity<CartDTO> createCart(@RequestParam Long userId) {
		Cart cart = cartService.createCart(userId);
		CartDTO dto = new CartDTO();
		dto.setId(cart.getId());
		dto.setUserId(cart.getUserId());
		return ResponseEntity.status(201).body(dto);
	}

	@GetMapping("/{id}")
	public ResponseEntity<CartDTO> getCart(@PathVariable Long id) {
		Cart cart = cartService.getCart(id).orElseThrow(() -> new RuntimeException("Cart not found"));
		CartDTO dto = new CartDTO();
		dto.setId(cart.getId());
		dto.setUserId(cart.getUserId());
		return ResponseEntity.ok(dto);
	}
}
