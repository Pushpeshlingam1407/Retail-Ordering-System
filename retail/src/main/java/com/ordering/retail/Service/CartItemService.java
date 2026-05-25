package com.ordering.retail.Service;

import com.ordering.retail.Entity.Cart;
import com.ordering.retail.Entity.CartItem;
import com.ordering.retail.Entity.Product;
import com.ordering.retail.Exception.OutOfStockException;
import com.ordering.retail.Repository.CartItemRepository;
import com.ordering.retail.Repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CartItemService {
	private final CartItemRepository cartItemRepository;
	private final ProductRepository productRepository;

	public CartItemService(CartItemRepository cartItemRepository, ProductRepository productRepository) {
		this.cartItemRepository = cartItemRepository;
		this.productRepository = productRepository;
	}

	public Optional<CartItem> findById(Long id) {
		return cartItemRepository.findById(id);
	}

	public Optional<CartItem> findByCartAndProduct(Long cartId, Long productId) {
		return cartItemRepository.findByCartIdAndProductId(cartId, productId);
	}

	@Transactional
	public CartItem addOrUpdateCartItem(Cart cart, Long productId, int qty) {
		Product product = productRepository.findById(productId)
				.orElseThrow(() -> new RuntimeException("Product not found: " + productId));

		Optional<CartItem> existing = findByCartAndProduct(cart.getId(), productId);
		if (existing.isPresent()) {
			CartItem item = existing.get();
			item.setQuantity(item.getQuantity() + qty);
			return cartItemRepository.save(item);
		}

		CartItem item = new CartItem(product, qty);
		item.setCart(cart);
		return cartItemRepository.save(item);
	}

	@Transactional
	public CartItem updateQuantity(Long itemId, int quantity) {
		CartItem item = cartItemRepository.findById(itemId)
				.orElseThrow(() -> new RuntimeException("CartItem not found: " + itemId));
		if (quantity <= 0) {
			throw new RuntimeException("Quantity must be >= 1");
		}
		item.setQuantity(quantity);
		return cartItemRepository.save(item);
	}

	@Transactional
	public void removeItem(CartItem item) {
		cartItemRepository.delete(item);
	}
}
