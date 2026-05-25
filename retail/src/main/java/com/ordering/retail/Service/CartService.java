package com.ordering.retail.Service;

import com.ordering.retail.Entity.Cart;
import com.ordering.retail.Entity.CartItem;
import com.ordering.retail.Exception.OutOfStockException;
import com.ordering.retail.Repository.CartItemRepository;
import com.ordering.retail.Repository.CartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CartService {
	private final CartRepository cartRepository;
	private final CartItemRepository cartItemRepository;
	private final InventoryService inventoryService;
	private final com.ordering.retail.Repository.ProductRepository productRepository;

	public CartService(CartRepository cartRepository,
					   CartItemRepository cartItemRepository,
					   InventoryService inventoryService,
					   com.ordering.retail.Repository.ProductRepository productRepository) {
		this.cartRepository = cartRepository;
		this.cartItemRepository = cartItemRepository;
		this.inventoryService = inventoryService;
		this.productRepository = productRepository;
	}

	public Cart createCart(Long userId) {
		Cart cart = new Cart(userId);
		return cartRepository.save(cart);
	}

	public Optional<Cart> getCart(Long id) {
		return cartRepository.findById(id);
	}

	@Transactional
	public Cart addItemToCart(Long cartId, Long productId, int quantity) {
		Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new RuntimeException("Cart not found"));

		// Verify inventory
		try {
			inventoryService.decreaseStock(productId, quantity);
		} catch (OutOfStockException ex) {
			throw ex;
		}

		// Check existing item
		Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(cartId, productId);
		CartItem item;
		if (existing.isPresent()) {
			item = existing.get();
			item.setQuantity(item.getQuantity() + quantity);
		} else {
			item = new CartItem();
			item.setQuantity(quantity);
			item.setProduct(productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found")));
		}

		item.setCart(cart);
		CartItem saved = cartItemRepository.save(item);
		cart.getItems().add(saved);
		return cartRepository.save(cart);
	}

	@Transactional
	public void removeItemFromCart(Long cartId, Long itemId) {
		Cart cart = cartRepository.findById(cartId).orElseThrow(() -> new RuntimeException("Cart not found"));
		CartItem item = cartItemRepository.findById(itemId).orElseThrow(() -> new RuntimeException("Item not found"));
		cart.getItems().removeIf(i -> i.getId().equals(item.getId()));
		cartItemRepository.delete(item);
		// return stock
		inventoryService.increaseStock(item.getProduct().getId(), item.getQuantity());
	}
}
